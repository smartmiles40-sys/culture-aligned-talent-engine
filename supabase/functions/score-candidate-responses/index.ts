import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { candidateId, jobId } = await req.json();
    if (!candidateId || !jobId) {
      return new Response(JSON.stringify({ error: "candidateId and jobId are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch job info
    const { data: job } = await supabase.from("jobs").select("title, area, required_skills, behavioral_profile").eq("id", jobId).single();
    if (!job) throw new Error("Job not found");

    // Fetch enabled stages with weight > 0, excluding cv_upload and application
    const { data: stages } = await supabase
      .from("job_stages")
      .select("id, stage_key, label, weight, evaluation_criteria, reference_material")
      .eq("job_id", jobId)
      .eq("is_enabled", true)
      .gt("weight", 0)
      .not("stage_key", "in", "(application,cv_upload)")
      .order("stage_order");

    if (!stages?.length) {
      return new Response(JSON.stringify({ message: "No scorable stages found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all candidate responses with their questions
    const stageIds = stages.map(s => s.id);
    const { data: questions } = await supabase
      .from("stage_questions")
      .select("id, stage_id, question_text")
      .in("stage_id", stageIds)
      .order("question_order");

    const { data: responses } = await supabase
      .from("candidate_responses")
      .select("question_id, response_value")
      .eq("candidate_id", candidateId);

    if (!questions?.length || !responses?.length) {
      return new Response(JSON.stringify({ message: "No questions or responses found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseMap = new Map(responses.map(r => [r.question_id, r.response_value]));

    // Delete existing AI evaluations for these stages
    await supabase
      .from("candidate_evaluations")
      .delete()
      .eq("candidate_id", candidateId)
      .in("stage_id", stageIds)
      .is("evaluator_id", null);

    const results: { stageId: string; score: number; justification: string }[] = [];

    // Score each stage
    for (const stage of stages) {
      const stageQuestions = questions.filter(q => q.stage_id === stage.id);
      if (!stageQuestions.length) continue;

      const qaPairs = stageQuestions
        .map(q => {
          const answer = responseMap.get(q.id);
          return answer ? `Pergunta: ${q.question_text}\nResposta: ${answer}` : null;
        })
        .filter(Boolean)
        .join("\n\n");

      if (!qaPairs) continue;

      const hasCustomCriteria = !!stage.evaluation_criteria;
      const hasReferenceMaterial = !!stage.reference_material;

      const customCriteriaBlock = hasCustomCriteria
        ? `\n## CRITÉRIOS ESPECÍFICOS DESTA ETAPA (configurados pelo recrutador — PRIORIDADE MÁXIMA):\n${stage.evaluation_criteria}\n\nAvalie as respostas ESTRITAMENTE com base nos critérios acima.\n`
        : "";

      const referenceMaterialBlock = hasReferenceMaterial
        ? `\n## MATERIAL DE REFERÊNCIA (estude antes de avaliar):\n${stage.reference_material}\n`
        : "";

      const prompt = `Você é um avaliador justo e criterioso de candidatos. Sua função é identificar candidatos com potencial real para a vaga.

Avalie as respostas do candidato para a etapa "${stage.label}" da vaga "${job.title}" (área: ${job.area || "N/A"}).

Competências desejadas: ${job.required_skills?.join(", ") || "N/A"}
Perfil comportamental: ${job.behavioral_profile || "N/A"}
${customCriteriaBlock}${referenceMaterialBlock}
## Respostas do Candidato:
${qaPairs}

## PRINCÍPIO FUNDAMENTAL:
${hasCustomCriteria
  ? "Use os CRITÉRIOS ESPECÍFICOS configurados acima como base principal da avaliação. Eles têm prioridade sobre as regras genéricas abaixo."
  : "Avalie o CONTEÚDO e a SUBSTÂNCIA das respostas, não a forma. Candidatos preenchem formulários online em celulares — erros de digitação são normais e NÃO indicam incompetência."}

## CRITÉRIOS DE PONTUAÇÃO (área: ${job.area || "geral"}):
- 0-20: Respostas vazias, sem sentido, texto aleatório, ou completamente irrelevantes para a pergunta
- 21-40: Respostas genéricas sem nenhuma evidência concreta, sem conexão com a vaga
- 41-60: Respostas razoáveis, demonstra algum conhecimento mas sem exemplos específicos
- 61-80: Respostas boas com evidências concretas (números, ferramentas, experiências específicas)
- 81-100: Respostas excelentes com múltiplas evidências, forte alinhamento com o perfil da vaga

## O QUE VALORIZAR (eleva o score):
- Números concretos: metas atingidas, taxas de conversão, volume de vendas, tickets gerenciados
- Ferramentas e metodologias citadas (mesmo com erros de grafia): CRM, SPIN Selling, etc.
- Experiências específicas com detalhes reais (empresas, situações, resultados)
- Respostas que demonstram conhecimento prático da área

## O QUE NÃO PENALIZAR PESADO (mas SEMPRE identificar):
- Erros de digitação ou ortografia: penalidade MÁXIMA de 5 pontos no score, MAS liste os erros encontrados no campo "portuguese_errors"
- Respostas curtas mas objetivas quando a pergunta permite resposta direta (ex: "Sim", "3 anos", "R$500k")
- Nomes de ferramentas escritos incorretamente (ex: "pipieDrive" = Pipedrive, "WaSaller" = WhatsApp)

## IDENTIFICAÇÃO DE ERROS DE PORTUGUÊS (OBRIGATÓRIO):
- SEMPRE analise as respostas procurando erros de ortografia, concordância, regência, acentuação e pontuação.
- Liste TODOS os erros encontrados no campo "portuguese_errors" da tool, mesmo que não penalize no score.
- Se não encontrar erros, retorne uma lista vazia.
- Exemplos de erros: "adépto" (adepto), "concerteza" (com certeza), "mim fazer" (eu fazer), falta de acentos, etc.

## SINAIS DE ALERTA (score deve ser BAIXO, 0-30):
- Respostas que NÃO respondem a pergunta feita
- Texto completamente aleatório ou sem sentido
- Contradições óbvias que indicam desonestidade
- Ausência total de qualquer evidência ou experiência

SEJA JUSTO. Avalie o potencial real do candidato. Use a tool score_stage para retornar a nota.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Você é um avaliador de candidatos. Use a tool fornecida para retornar sua avaliação." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "score_stage",
              description: "Retorna a nota, justificativa e erros de português encontrados",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "Nota de 0 a 100" },
                  justification: { type: "string", description: "Justificativa da nota (máx 300 caracteres)" },
                  portuguese_errors: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de erros de português encontrados nas respostas. Ex: ['adépto (correto: adepto)', 'concerteza (correto: com certeza)']. Lista vazia se nenhum erro."
                  },
                },
                required: ["score", "justification", "portuguese_errors"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "score_stage" } },
        }),
      });

      if (!aiResponse.ok) {
        console.error(`AI error for stage ${stage.id}:`, aiResponse.status);
        continue;
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        console.error(`No tool call in response for stage ${stage.id}`);
        continue;
      }

      let parsed;
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error(`Failed to parse tool call for stage ${stage.id}`);
        continue;
      }

      const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
      const portugueseErrors = parsed.portuguese_errors || [];
      const errorsText = portugueseErrors.length > 0
        ? `\n\nErros de português identificados (${portugueseErrors.length}): ${portugueseErrors.join("; ")}`
        : "";
      results.push({ stageId: stage.id, score, justification: parsed.justification, portugueseErrors });

      await supabase.from("candidate_evaluations").insert({
        candidate_id: candidateId,
        stage_id: stage.id,
        score,
        notes: `Avaliação IA: ${parsed.justification}${errorsText}`,
      });
    }

    // Recalculate final score
    await supabase.rpc("calculate_candidate_score", { p_candidate_id: candidateId });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-candidate-responses error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

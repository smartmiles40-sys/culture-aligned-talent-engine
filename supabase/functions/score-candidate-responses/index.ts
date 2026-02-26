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
      .select("id, stage_key, label, weight")
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

      const prompt = `Você é um avaliador EXTREMAMENTE RIGOROSO de candidatos. Sua função é proteger a empresa de contratações ruins.

Avalie as respostas do candidato para a etapa "${stage.label}" da vaga "${job.title}" (área: ${job.area || "N/A"}).

Competências desejadas: ${job.required_skills?.join(", ") || "N/A"}
Perfil comportamental: ${job.behavioral_profile || "N/A"}

## Respostas do Candidato:
${qaPairs}

## CRITÉRIOS RIGOROSOS DE PONTUAÇÃO:
- 0-20: Respostas vazias, sem sentido, aleatórias, copiadas, ou completamente irrelevantes
- 21-40: Respostas genéricas, superficiais, sem exemplos concretos, sem conexão com a vaga
- 41-60: Respostas razoáveis mas sem profundidade, poucos exemplos, conexão fraca com competências
- 61-75: Respostas boas com exemplos, demonstra conhecimento relevante
- 76-90: Respostas excelentes, exemplos concretos, forte alinhamento com competências e cultura
- 91-100: Respostas excepcionais, experiência comprovada, fit cultural perfeito

## SINAIS DE ALERTA (score deve ser BAIXO, 0-30):
- Respostas de uma só palavra ou muito curtas sem substância
- Texto aleatório, sem sentido ou claramente inventado
- Respostas que não respondem a pergunta feita
- Contradições óbvias
- Respostas genéricas que poderiam ser usadas para qualquer vaga

## QUALIDADE DA ESCRITA (penalizar fortemente):
- Erros graves de português (ortografia, concordância, regência) devem REDUZIR o score em 10-20 pontos
- Texto mal estruturado, sem pontuação ou com frases incompreensíveis indica baixa capacidade de comunicação
- Candidato que não consegue se expressar por escrito de forma clara é um risco para a empresa

SEJA HONESTO E RIGOROSO. NÃO infle notas. Use a tool score_stage para retornar a nota.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Você é um avaliador de candidatos. Use a tool fornecida para retornar sua avaliação." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "score_stage",
              description: "Retorna a nota e justificativa para a etapa avaliada",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "Nota de 0 a 100" },
                  justification: { type: "string", description: "Justificativa breve da nota (máx 200 caracteres)" },
                },
                required: ["score", "justification"],
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
      results.push({ stageId: stage.id, score, justification: parsed.justification });

      await supabase.from("candidate_evaluations").insert({
        candidate_id: candidateId,
        stage_id: stage.id,
        score,
        notes: `Avaliação IA: ${parsed.justification}`,
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

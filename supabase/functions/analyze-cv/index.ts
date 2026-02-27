import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cvPath, candidateId, jobTitle, jobArea, requiredSkills, behavioralProfile } = await req.json();

    if (!cvPath || !jobTitle) {
      return new Response(JSON.stringify({ error: "cvPath and jobTitle are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the CV from storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: fileData, error: fileError } = await supabase.storage
      .from("cvs")
      .download(cvPath);

    if (fileError || !fileData) {
      console.error("Storage error:", fileError);
      return new Response(JSON.stringify({ error: "Failed to download CV" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract text from the file
    const cvText = await fileData.text();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Você é um avaliador EXTREMAMENTE RIGOROSO e CRITERIOSO de currículos para recrutamento. Sua função é proteger a empresa de contratações ruins.

## REGRAS CRÍTICAS DE VALIDAÇÃO (aplicar ANTES de qualquer análise):

1. **Verificação de documento**: Se o conteúdo NÃO for um currículo real (foto, receita, documento aleatório, texto sem sentido, conteúdo binário/ilegível, ou texto que não contém informações profissionais como nome, experiência, formação), retorne score 0 e recommendation "Não Recomendado".

2. **VERIFICAÇÃO DE ÁREA/RELEVÂNCIA (REGRA MAIS IMPORTANTE)**:
   - Compare a ÁREA DE ATUAÇÃO REAL do candidato com a ÁREA DA VAGA.
   - Liste mentalmente: quais empresas o candidato trabalhou? quais cargos ocupou? O que fez no dia a dia?
   - Se o candidato tem experiência PREDOMINANTEMENTE em uma área DIFERENTE da vaga (ex: currículo de Marketing para vaga de Vendas, currículo de TI para vaga de RH), o score MÁXIMO deve ser 40.
   - NÃO INVENTE conexões que não existem. Ter "comunicação" ou "trabalho em equipe" NÃO torna um profissional de marketing adequado para vendas.
   - Experiência em "vendas" mencionada vagamente em um currículo de outra área NÃO conta como experiência real em vendas.

3. **Verificação de competências obrigatórias**: 
   - Para CADA competência listada abaixo, verifique se há EVIDÊNCIA CONCRETA no currículo (cargo, projeto, resultado).
   - Se mais de 50% das competências obrigatórias NÃO estão evidenciadas, o score máximo deve ser 50.
   - Competências obrigatórias da vaga: ${requiredSkills?.join(", ") || "Não especificadas"}

4. **QUALIDADE DA ESCRITA DO CURRÍCULO**:
   - Erros graves de português (ortografia, concordância, regência) devem REDUZIR o score em 10-15 pontos.
   - Currículo mal formatado, com frases incoerentes ou sem estrutura profissional indica baixa capacidade de comunicação.
   - Mencione os erros encontrados na lista de weaknesses.

5. **Critérios de pontuação RIGOROSOS**:
   - 0-10: Arquivo inválido, não é currículo
   - 11-25: Experiência em área COMPLETAMENTE diferente da vaga, sem nenhuma conexão real
   - 26-40: Área tangencialmente relacionada, mas experiência principal é outra
   - 41-55: Alguma experiência na área, mas faltam competências importantes
   - 56-70: Experiência relevante na área, possui parte das competências, mas com gaps
   - 71-85: Boa aderência, experiência sólida na mesma área, maioria das competências
   - 86-100: Excepcional, candidato ideal com experiência extensa NA MESMA ÁREA

## DESCRIÇÃO COMPLETA DA VAGA (compare CADA item com o currículo):
- **Título:** ${jobTitle}
- **Área:** ${jobArea || "Não especificada"}
- **Competências obrigatórias:** ${requiredSkills?.join(", ") || "Não especificadas"}
- **Perfil comportamental desejado:** ${behavioralProfile || "Não especificado"}

## Currículo do Candidato (analise LITERALMENTE o que está escrito):
${cvText.substring(0, 8000)}

## CHECKLIST OBRIGATÓRIO (responda mentalmente antes de dar o score):
1. Qual é a área REAL de atuação do candidato? (baseado nos cargos e empresas)
2. Essa área é a MESMA da vaga? Se não, score máximo = 40.
3. Quantas das competências obrigatórias o candidato REALMENTE demonstra? (cite evidências)
4. O currículo tem erros de português? Se sim, penalize 10-15 pontos.
5. As experiências citadas são RELEVANTES para o dia a dia da vaga?

Retorne EXATAMENTE no seguinte formato JSON (sem markdown, sem código):
{
  "score": <número de 0 a 100>,
  "summary": "<resumo de 2-3 frases: diga a área REAL do candidato, compare com a área da vaga, e conclua se há match>",
  "strengths": ["<ponto forte REAL e verificável — cite cargo/empresa específica do currículo>"],
  "weaknesses": ["<gap REAL: competências ausentes, área diferente, erros de português encontrados>"],
  "recommendation": "<Recomendado | Com Ressalvas | Não Recomendado>"
}

REGRAS FINAIS INVIOLÁVEIS:
- Área diferente da vaga → score ≤ 40, recommendation = "Não Recomendado"
- NÃO INVENTE qualidades. Cite APENAS o que está ESCRITO no currículo.
- Erros de português → penalizar e listar em weaknesses.
- Um currículo de Marketing NÃO É adequado para vaga de Vendas.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um assistente de RH especializado em análise de currículos. Sempre responda em JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao analisar currículo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Try to parse the JSON from the response
    let analysis;
    try {
      // Remove potential markdown code blocks
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      analysis = {
        score: 50,
        summary: content.substring(0, 300),
        strengths: [],
        weaknesses: [],
        recommendation: "Com Ressalvas",
      };
    }

    // Save analysis to database and auto-create evaluation
    if (candidateId) {
      const { error: updateError } = await supabase
        .from("candidates")
        .update({ cv_analysis: analysis })
        .eq("id", candidateId);
      if (updateError) {
        console.error("Failed to save cv_analysis:", updateError);
      }

      // Find the candidate's job and the cv_upload stage to auto-score
      const { data: candidate } = await supabase
        .from("candidates")
        .select("job_id")
        .eq("id", candidateId)
        .single();

      if (candidate?.job_id) {
        const { data: cvStage } = await supabase
          .from("job_stages")
          .select("id")
          .eq("job_id", candidate.job_id)
          .eq("stage_key", "cv_upload")
          .single();

        if (cvStage) {
          // Delete any existing AI evaluation (no evaluator) then insert fresh
          await supabase
            .from("candidate_evaluations")
            .delete()
            .eq("candidate_id", candidateId)
            .eq("stage_id", cvStage.id)
            .is("evaluator_id", null);

          await supabase
            .from("candidate_evaluations")
            .insert({
              candidate_id: candidateId,
              stage_id: cvStage.id,
              score: analysis.score ?? 0,
              notes: `Análise IA: ${analysis.recommendation || ""} — ${analysis.summary || ""}`,
            });

          // Recalculate final score
          await supabase.rpc("calculate_candidate_score", { p_candidate_id: candidateId });
        }
      }
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-cv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

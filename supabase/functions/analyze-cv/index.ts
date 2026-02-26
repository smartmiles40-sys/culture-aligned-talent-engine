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

1. **Verificação de documento**: Se o conteúdo NÃO for um currículo real (foto, receita, documento aleatório, texto sem sentido, conteúdo binário/ilegível), retorne score 0 e recommendation "Não Recomendado".

2. **Verificação de relevância para a vaga**: Se o currículo é real MAS a experiência e formação do candidato NÃO TÊM RELAÇÃO com a vaga anunciada, o score DEVE ser BAIXO (0-30). Um programador se candidatando para vaga de vendas, ou um cozinheiro para vaga de TI, DEVE receber score baixo.

3. **Critérios de pontuação RIGOROSOS**:
   - 0-20: Arquivo inválido, ou experiência completamente irrelevante para a vaga
   - 21-40: Pouca relevância, experiência tangencial, falta a maioria das competências
   - 41-60: Alguma relevância, mas faltam competências importantes ou experiência é superficial
   - 61-75: Boa aderência, possui a maioria das competências, experiência relevante
   - 76-90: Forte aderência, experiência sólida na área, quase todas as competências
   - 91-100: Excepcional, candidato ideal com todas as competências e experiência extensa

## Vaga
- **Título:** ${jobTitle}
- **Área:** ${jobArea || "Não especificada"}
- **Competências obrigatórias:** ${requiredSkills?.join(", ") || "Não especificadas"}
- **Perfil comportamental desejado:** ${behavioralProfile || "Não especificado"}

## Currículo do Candidato
${cvText.substring(0, 8000)}

## Instruções
SEJA RIGOROSO. NÃO infle notas. Compare ESTRITAMENTE a experiência e competências do candidato com os requisitos da vaga.

Retorne EXATAMENTE no seguinte formato JSON (sem markdown, sem código):
{
  "score": <número de 0 a 100 - USE A ESCALA ACIMA RIGOROSAMENTE>,
  "summary": "<resumo de 2-3 frases sobre a compatibilidade REAL, seja honesto sobre gaps>",
  "strengths": ["<ponto forte REAL e verificável no currículo>"],
  "weaknesses": ["<gap ou deficiência REAL em relação à vaga>"],
  "recommendation": "<Recomendado | Com Ressalvas | Não Recomendado>"
}

ATENÇÃO: Se não houver match claro entre o perfil do candidato e a vaga, o score DEVE ser baixo. Não invente qualidades que não existem no currículo.`;

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

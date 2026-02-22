import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cvPath, jobTitle, jobArea, requiredSkills, behavioralProfile } = await req.json();

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

    const prompt = `Você é um especialista em recrutamento e seleção. Analise o currículo abaixo e compare com a descrição da vaga.

## Vaga
- **Título:** ${jobTitle}
- **Área:** ${jobArea || "Não especificada"}
- **Competências obrigatórias:** ${requiredSkills?.join(", ") || "Não especificadas"}
- **Perfil comportamental desejado:** ${behavioralProfile || "Não especificado"}

## Currículo do Candidato
${cvText.substring(0, 8000)}

## Instruções
Analise a compatibilidade do candidato com a vaga e retorne EXATAMENTE no seguinte formato JSON (sem markdown, sem código):
{
  "score": <número de 0 a 100>,
  "summary": "<resumo de 2-3 frases sobre a compatibilidade>",
  "strengths": ["<ponto forte 1>", "<ponto forte 2>", "<ponto forte 3>"],
  "weaknesses": ["<ponto fraco ou gap 1>", "<ponto fraco ou gap 2>"],
  "recommendation": "<Recomendado | Com Ressalvas | Não Recomendado>"
}

Considere:
- Experiência relevante para a área
- Competências técnicas mencionadas vs. requeridas
- Formação acadêmica
- Perfil comportamental implícito
- Aderência geral à vaga`;

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

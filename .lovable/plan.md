

## Diagnóstico do Problema

Analisei as respostas reais do candidato e os scores dados pela IA. O problema está claro:

**As respostas mostram um candidato com experiência comercial real:**
- Meta mensal de R$750.000 atingida
- Taxa de conversão de 30%
- Domina ferramentas como RD Station, Pipedrive, Salesforce, Kommo
- Usa SPIN Selling, conhece funil de vendas
- Experiência em múltiplos canais de atendimento

**Mas os scores foram:**
- Bloco C (Experiência): **58** — penalizou pesado por erros de grafia ("pipieDrive", "WaSaller", "adépto")
- Bloco D (Performance): **25** — penalizou por "janeiro de 2026", respostas curtas e erros ortográficos
- Bloco F (Cultura): **35** — penalizou por respostas "superficiais" e erros de português

**Score final: ~38/100 (Risco)** — para um candidato que claramente tem perfil comercial relevante.

### Causa raiz

O prompt da IA está configurado para ser "EXTREMAMENTE RIGOROSO" e penaliza 10-20 pontos por erros de português. Isso faz sentido para vagas que exigem comunicação escrita impecável, mas para vagas comerciais/vendas, penalizar tanto por digitação em formulário online distorce completamente a avaliação.

## Plano de Correção

### 1. Rebalancear os critérios de avaliação no `score-candidate-responses`

Alterar o prompt da IA para:
- **Priorizar conteúdo sobre forma**: erros de digitação em formulário devem penalizar no máximo 5 pontos, não 10-20
- **Valorizar evidências concretas**: números de meta, taxa de conversão, ferramentas citadas devem pesar mais que a gramática
- **Contextualizar por área da vaga**: para vagas comerciais, o que importa é resultado e experiência, não escrita perfeita
- **Respostas curtas mas objetivas não são ruins**: "Sim" para "já fez reunião de fechamento?" é uma resposta válida
- **Escala de pontuação mais justa**: ajustar as faixas para não inflar nem deflacionar

### 2. Reprocessar as avaliações deste candidato

Após ajustar os critérios, re-executar o `score-candidate-responses` para recalcular os scores com a nova lógica.

### Detalhes Técnicos

**Alterações em `supabase/functions/score-candidate-responses/index.ts`:**

Novo prompt com critérios balanceados:
- Faixas de score: 0-20 (irrelevante), 21-40 (genérico sem evidência), 41-60 (razoável), 61-80 (bom com evidências), 81-100 (excelente)
- Erros de digitação em formulário: penalização máxima de 5 pontos (não 10-20)
- Respostas curtas mas corretas: não penalizar se a pergunta permite resposta objetiva
- Números e dados concretos (metas, conversão, ferramentas): devem elevar o score significativamente
- Incluir contexto da área da vaga para calibrar a avaliação


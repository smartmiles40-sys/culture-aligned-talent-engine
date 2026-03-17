

## Diagnóstico do Problema

Atualmente, a avaliação de **todas as etapas** (incluindo Fit Cultural) usa o **mesmo prompt genérico** na IA. O prompt diz apenas "avalie as respostas do candidato para a etapa X" e envia as competências da vaga — mas **não tem critérios específicos** do que significa "fit cultural" na sua empresa, nem material de referência. Isso torna a avaliação subjetiva e inconsistente.

---

## Plano: Critérios de Avaliação Configuráveis por Etapa

### 1. Novo campo no banco: `evaluation_criteria` e `reference_material`

Adicionar dois campos de texto nas tabelas `block_templates` (biblioteca global) e `job_stages` (nível de vaga):

- **`evaluation_criteria`** (text) — Instruções objetivas para a IA avaliar aquela etapa. Ex: para Fit Cultural, você escreveria os valores da empresa, o que significa cada um, e como pontuar.
- **`reference_material`** (text) — Material de apoio/estudo que a IA deve considerar (ex: trechos do Manual de Cultura, descrição dos valores STFEV, etc.)

### 2. Interface nas Configurações (Biblioteca de Blocos)

Ao expandir cada bloco na aba "Biblioteca de Blocos" em Configurações, aparecerão dois novos campos editáveis:

- **"Critérios de Avaliação da IA"** — Campo de texto longo onde o admin descreve exatamente o que a IA deve avaliar, como pontuar, o que valorizar e penalizar.
- **"Material de Referência"** — Campo de texto longo para colar trechos do manual de cultura, diretrizes internas, perfil comportamental esperado, etc.

Esses campos são herdados pela vaga ao adicionar o bloco, podendo ser customizados por vaga também.

### 3. Herança nos `job_stages`

Quando um bloco é adicionado a uma vaga, os campos `evaluation_criteria` e `reference_material` são copiados do template. O recrutador pode editar localmente na configuração da vaga (override) sem afetar o template global.

### 4. Atualização da Edge Function `score-candidate-responses`

A função de scoring será alterada para:
- Buscar `evaluation_criteria` e `reference_material` do `job_stage` correspondente
- Injetar essas informações no prompt da IA como contexto obrigatório
- Se não houver critérios configurados, usar o prompt genérico atual como fallback

Exemplo de como o prompt ficará para o Fit Cultural:
```
## CRITÉRIOS ESPECÍFICOS DESTA ETAPA (configurados pelo recrutador):
{evaluation_criteria da etapa}

## MATERIAL DE REFERÊNCIA:
{reference_material da etapa}

Avalie as respostas ESTRITAMENTE com base nos critérios acima.
```

### 5. Mesma lógica para `analyze-cv`

A edge function de análise de CV também buscará os critérios configurados na etapa `cv_upload`, permitindo que o admin defina o que é importante na análise do currículo (ex: tempo mínimo em empresas, formação, experiência em turismo, etc.)

---

## Resumo das mudanças

| Componente | Alteração |
|---|---|
| **Migração SQL** | Adicionar `evaluation_criteria` e `reference_material` em `block_templates` e `job_stages` |
| **Settings.tsx** | Dois novos campos de texto na expansão de cada bloco |
| **JobConfig.tsx** | Campos herdados editáveis por vaga (override) |
| **score-candidate-responses** | Buscar e injetar critérios no prompt da IA |
| **analyze-cv** | Buscar critérios da etapa cv_upload e injetar no prompt |
| **useJobs / useStages hooks** | Incluir novos campos nas queries |

Isso resolve o problema de subjetividade: cada etapa terá critérios claros e documentados que a IA seguirá rigorosamente, baseados no que vocês configurarem.


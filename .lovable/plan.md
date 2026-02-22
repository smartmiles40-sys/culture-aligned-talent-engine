
# Plano de Melhorias: Formulario Externo, Configuracoes de Vaga e Ajustes no Fluxo

## Resumo das Questoes Identificadas

1. **Link do formulario** - Atualmente em `/formulario`, mas sem vinculo com a vaga especifica
2. **Criterios de classificacao** - Scores sao mock/fixos, sem tela para corrigir
3. **Configuracoes da vaga (Passo 0)** - Nao existe pagina de configuracao
4. **Link externo para candidatos** - Formulario usa layout interno (sidebar), precisa de layout limpo
5. **Upload de video** - Nao existe campo para subir video
6. **Candidato ve as fases** - O step indicator mostra todas as etapas internas
7. **Etapa comercial vs. outras areas** - Comercial mostra performance, mas outras areas nao tem caso pratico

---

## O que sera feito

### 1. Formulario Externo com Layout Limpo (sem sidebar)

- Criar um novo layout `PublicLayout` sem sidebar, header minimalista com logo da empresa
- Nova rota: `/aplicar/:jobId` - formulario vinculado a uma vaga especifica
- O candidato **nao vera** o indicador de fases/etapas (remover step indicator)
- Apenas progress bar simples (ex: "Etapa 2 de 4") sem nomes das etapas

### 2. Formulario Adaptativo por Area

- Se a vaga for **Comercial**: mostrar etapa de Performance Comercial + campo de upload de video
- Se a vaga for **outras areas** (Operacoes, Marketing, etc.): mostrar etapa de Caso Pratico Tecnico (descricao do caso + campo de upload de arquivo)
- A logica ja existe parcialmente (condicional `isCommercial`), sera expandida para cobrir o caso pratico

### 3. Campo de Upload de Video

- Na etapa de Video (Comercial), adicionar campo de upload de arquivo de video
- Aceitar formatos mp4, mov, webm
- Limite de 2 minutos indicado na instrucao
- Inicialmente salvar localmente (sem backend); quando Supabase for ativado, usar Storage

### 4. Pagina de Configuracao da Vaga (Passo 0)

- Nova rota: `/vagas/:jobId/configurar`
- Campos editaveis:
  - Area da vaga
  - Competencias tecnicas obrigatorias (tags)
  - Perfil comportamental ideal
  - Caso pratico (texto descritivo, quando aplicavel)
  - Pesos das etapas (sliders que somam 100%)
  - Score minimo cultural (padrao 60)
  - Score minimo tecnico (padrao 60)
- Botao para copiar link externo de candidatura (`/aplicar/:jobId`)

### 5. Link Externo Visivel na Pagina de Vagas

- No `JobCard` e na pagina de configuracao, adicionar botao "Copiar Link de Candidatura"
- Link no formato: `/aplicar/:jobId`
- Icone de link/copiar com feedback visual (toast)

### 6. Tela de Detalhes do Candidato com Edicao de Scores

- Nova rota: `/candidatos/:id`
- Exibir todas as notas por etapa
- Permitir que o recrutador **edite manualmente** qualquer score
- Exibir classificacao automatica (Forte/Desenvolvivel/Risco) recalculada ao editar
- Exibir alertas comportamentais
- Mostrar criterios usados para cada classificacao

### 7. Criterios de Classificacao Visiveis

- Na pagina de detalhes do candidato, mostrar:
  - Score >= 80: Aprovado (Forte)
  - Score 70-79: Reserva (Desenvolvivel)  
  - Score < 70: Reprovado (Risco)
  - Cultura < 60: Reprovacao automatica
  - Caso tecnico < 60: Reprovacao automatica
- Explicacao visivel de por que o candidato recebeu aquela classificacao

---

## Arquivos a Criar

| Arquivo | Descricao |
|---|---|
| `src/components/layout/PublicLayout.tsx` | Layout limpo sem sidebar para formularios externos |
| `src/pages/PublicApplicationForm.tsx` | Formulario publico vinculado a vaga, sem fases visiveis |
| `src/pages/JobConfig.tsx` | Pagina de configuracao da vaga (Passo 0) |
| `src/pages/CandidateDetail.tsx` | Pagina de detalhes com edicao de scores |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---|---|
| `src/App.tsx` | Adicionar rotas `/aplicar/:jobId`, `/vagas/:jobId/configurar`, `/candidatos/:id` |
| `src/components/jobs/JobCard.tsx` | Adicionar botao "Copiar Link" |
| `src/data/types.ts` | Adicionar campo `practicalCaseDescription` no `JobConfig` |
| `src/data/mockData.ts` | Adicionar dados de caso pratico nos mocks |

---

## Detalhes Tecnicos

### Rota publica do formulario
```
/aplicar/:jobId
```
O formulario busca os dados da vaga pelo `jobId`, detecta a area automaticamente e adapta as etapas:
- Comercial: Dados Pessoais > Triagem Tecnica > Performance Comercial + Video > Fit Cultural > Enviar
- Outras areas: Dados Pessoais > Triagem Tecnica > Caso Pratico > Fit Cultural > Enviar

### Progress bar no formulario publico
Em vez de mostrar nomes das fases, exibir apenas:
```
Etapa 2 de 4   [========--------]
```

### Upload de video/arquivo
Componente com drag-and-drop e preview. Sem backend por enquanto, os arquivos ficam no state local. Quando o Supabase for ativado, sera integrado ao Storage.

### Edicao de scores na pagina do candidato
Campos numericos editaveis (0-100) por etapa, com recalculo automatico do score final usando os pesos da vaga.

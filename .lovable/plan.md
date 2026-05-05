## Objetivo
Permitir exportar todo o projeto em um único arquivo ZIP (download direto), sem precisar do GitHub, para você levar ao Claude Code.

## Solução proposta

Como você está em um projeto Lovable e o GitHub não está funcionando, vou gerar **um pacote ZIP completo do código-fonte** e disponibilizar como artefato para download imediato. Não precisa configurar nada — você só clica e baixa.

### O que o ZIP irá conter
- Todo o código `src/` (páginas, componentes, hooks, contexts, integrations)
- Todas as Edge Functions (`supabase/functions/`)
- Migrations SQL (`supabase/migrations/`) — schema completo do banco
- `supabase/config.toml`
- Arquivos de configuração: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig*.json`, `components.json`, `index.html`, `postcss.config.js`, `eslint.config.js`
- `README.md` e o `prompt-sistema-recrutamento.md` que já criamos
- Um `INSTRUCOES-CLAUDE-CODE.md` novo, explicando ao Claude Code como reconstruir o ambiente (instalar deps, variáveis `.env`, criar projeto Supabase, rodar migrations, deploy das edge functions)

### O que será EXCLUÍDO do ZIP (para ficar leve)
- `node_modules/`
- `.git/`, `.lovable/`
- `bun.lock` / `package-lock.json` (Claude Code reinstala)
- `dist/`, `build/`, caches
- Arquivos `.env` com segredos (vou incluir um `.env.example` no lugar)

### Entrega
- Arquivo final: `/mnt/documents/projeto-recrutamento.zip`
- Aparecerá como artefato clicável no chat para download direto
- Tamanho estimado: 1–3 MB

## Passos de execução
1. Listar e copiar arquivos relevantes para `/tmp/export/`
2. Gerar `INSTRUCOES-CLAUDE-CODE.md` com passo-a-passo de setup
3. Gerar `.env.example` com as variáveis necessárias (sem valores sensíveis)
4. Compactar tudo em `projeto-recrutamento.zip` em `/mnt/documents/`
5. Entregar via tag `<lov-artifact>` para você baixar

## Observação
Esta é uma tarefa de empacotamento (script único), não uma alteração no app. Nada no sistema de recrutamento será modificado — o app continua funcionando normalmente.
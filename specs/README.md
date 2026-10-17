# Specs — como a gente constrói o Greywords

Cada feature vira uma pasta `specs/NNN-nome/` com três arquivos, escritos **nesta ordem** e aprovados um de cada vez.
O código só começa depois do `tasks.md` aprovado.

| Arquivo | Responde | Quem aprova |
| --- | --- | --- |
| `requirements.md` | **O quê** e **por quê**: histórias de usuário e critérios de aceite | Você |
| `design.md` | **Como**: telas, componentes do BEDS, dados, mudanças no código | Você |
| `tasks.md` | **Em que ordem**: checklist de tarefas pequenas, cada uma testável | Você |

## Status

Cada arquivo começa com uma linha de status:

- `Status: rascunho` — em discussão, pode mudar à vontade
- `Status: aprovado` — combinado; mudar exige voltar a conversar
- `Status: implementado` — feito e verificado no navegador

## Critérios de aceite (formato EARS)

Frases curtas e testáveis, sempre com o sistema como sujeito:

- **Sempre:** O SISTEMA DEVE mostrar a meta da semana.
- **Evento:** QUANDO o usuário marcar o check-in, O SISTEMA DEVE registrar o dia de hoje.
- **Estado:** ENQUANTO não houver meta definida, O SISTEMA DEVE pedir a meta.
- **Condição indesejada:** SE o navegador bloquear o armazenamento, ENTÃO O SISTEMA DEVE avisar que o progresso não será salvo.

Cada critério ganha um código (`R1.2`) para ser citado no design, nas tarefas e na verificação.

## Fluxo

1. Você descreve a ideia, mesmo solta.
2. Claude escreve `requirements.md` (rascunho) e lista dúvidas abertas.
3. Você responde e aprova → Claude escreve `design.md`.
4. Você aprova → Claude escreve `tasks.md`.
5. Você aprova → Claude implementa uma tarefa por vez, marcando `[x]`, e roda `npm run build` + `npm run check:ui`.
6. Claude verifica cada critério no navegador e marca a spec como `implementado`.

## Índice

| Spec | Status |
| --- | --- |
| [000-mvp](000-mvp/requirements.md) — busca por imagem, dicionário, revisão, landing | implementado (documentado depois) |
| [001-calendario-meta](001-calendario-meta/requirements.md) — calendário, check-in e meta semanal | implementado |
| [002-videos-nicho](002-videos-nicho/requirements.md) — vídeos por nicho com nível pelas legendas | requisitos aprovados · [design](002-videos-nicho/design.md) aprovado · [tarefas](002-videos-nicho/tasks.md) em implementação |
| [003-imagens-certeiras](003-imagens-certeiras/requirements.md) — imagens da busca pelo significado, sem conteúdo impróprio (Unsplash) | implementado (2026-10-17); Worker publicado, cache pendente em workers.dev · [medição](003-imagens-certeiras/medicao.md): 45,6% → 96,1% |
| [004-frases-exemplo](004-frases-exemplo/requirements.md) — frases reais de exemplo (Tatoeba) na busca e na revisão | implementado (2026-10-17) · [verificação](004-frases-exemplo/tasks.md#verificação) |
| [005-identidade-efeitos](005-identidade-efeitos/requirements.md) — paleta própria, landing mais informativa, efeitos (21st.dev) na landing e no app | implementado (2026-10-17) · [verificação](005-identidade-efeitos/tasks.md#verificação) |

# 001 — Calendário, check-in e meta semanal: tarefas

Status: implementado (2026-10-16)

Uma tarefa por vez, nesta ordem. Cada uma termina com `npm run build` passando; as de interface também com `npm run check:ui` (0 violações).
"Pronto quando" é o teste que fecha a tarefa.

## Base (sem interface)

- [x] **T1 — Datas em `src/progress.js`**: `dayKey`, `mondayOf`, `addDays`, `monthGrid`, tudo em hora local.
  Testes em `src/progress.test.js` com `node --test` (script `npm run test`).
  *Pronto quando:* testes passam para segunda-feira como início da semana, domingo pertencendo à semana anterior, virada de mês, virada de ano e 23h59 sem pular de dia. — R3.4

- [x] **T2 — Metas e semanas em `src/progress.js`**: `withGoal`, `goalForWeek`, `studiedDays`, `weekSummary`, `currentStreak`.
  *Pronto quando:* testes cobrem trocar a meta na mesma semana (substitui) e em semana nova (acrescenta), semana passada mantendo a meta antiga, dia com atividade e check-in contando uma vez, sequência com a semana atual ainda em andamento, e semana sem meta interrompendo a sequência. — R1.2, R1.3, R1.5, R2.5, R3.5, R3.6

- [x] **T3 — Migração em `src/storage.js`**: função pura `migrate(state)` chamada no `loadState`; cria `goals` e `checkinDays` vazios e preenche `activityDays` a partir do `log` e do `addedAt` das palavras.
  *Pronto quando:* teste com um estado antigo (só `words` e `log`) gera os dias certos, e um estado já migrado volta igual. — R5.1

## Estado do app

- [x] **T4 — Ações em `src/App.jsx`**: gravar o dia em `activityDays` ao salvar palavra e ao revisar; `setGoal(days)`; `toggleCheckin()`.
  *Pronto quando:* no navegador, salvar uma palavra e revisar outra deixam o dia de hoje em `activityDays` (conferido no `localStorage`), sem duplicar. — R2.1, R2.2, R2.3

## Interface

- [x] **T5 — Aba Progresso**: quarta opção no `SegmentedControl` e `src/components/Progress.jsx` vazio.
  *Pronto quando:* as quatro abas cabem em 375 px sem rolagem lateral (senão, rótulos curtos conforme o design). — R4.1

- [x] **T6 — Meta**: pergunta com `SegmentedControl` 1–7 (padrão 4) quando não há meta; botão "Mudar meta" abrindo `Dialog`.
  *Pronto quando:* sem meta aparece a pergunta; definir mostra o andamento; mudar a meta atualiza a semana atual. — R1.1, R1.2, R1.3

- [x] **T7 — Andamento da semana e sequência**: `ProgressBar` "X de N dias", `Badge` "Meta cumprida", `Metric` "Semanas seguidas".
  *Pronto quando:* com dados de teste, 3 de 4 mostra só o número (sem cobrança) e 4 de 4 mostra o selo; a sequência bate com o teste de T2. — R1.4, R1.5, R1.6, R3.6

- [x] **T8 — Bloco "Hoje"**: botão "Estudei hoje", "Desfazer" depois do check-in, e aviso quando o dia já conta pela atividade.
  *Pronto quando:* check-in e desfazer funcionam; depois de revisar uma palavra o botão vira o aviso; o dia nunca conta duas vezes. — R2.2, R2.3, R2.4, R2.5

- [x] **T9 — Calendário em `src/components/MonthCalendar.jsx`**: tabela do mês com Seg…Dom, coluna "Semana", dias estudados, hoje destacado, navegação ‹ › e "Hoje".
  *Pronto quando:* mês atual e anteriores corretos, avançar desabilitado no mês atual, dia estudado identificável sem depender da cor, legível em claro e escuro e em 375 px. — R3.1, R3.2, R3.3, R3.4, R3.5

- [x] **T10 — Métricas saem do Dicionário**: a linha de `Metric` vai para o fim da aba Progresso; o aviso "N palavras esperando revisão" fica no Dicionário.
  *Pronto quando:* números iguais aos de antes, agora no Progresso; Dicionário sem a linha de métricas. — R4.1, R4.2

## Fechamento

- [x] **T11 — Textos e docs**: tirar o calendário de "O que vem por aí" na landing; atualizar R2.2 da spec 000 e o mapa de código do `CLAUDE.md`.
  *Pronto quando:* nenhuma referência ao calendário como "em construção". — R5.2 conferido: exportação inclui os campos novos

- [x] **T12 — Verificação final**: `npm run test`, `npm run build`, `npm run check:ui`; percorrer cada critério R1–R5 no navegador (claro, escuro, 375 px) e marcar a spec como `implementado`.
  *Pronto quando:* todos os critérios conferidos e listados aqui embaixo, com o que não deu para verificar dito explicitamente.

## Verificação

Feita em 2026-10-16. `npm test` (35 testes), `npm run build` e `npm run check:ui` (24 arquivos, 0 violações) passando.

| Critério | Como foi conferido | Resultado |
| --- | --- | --- |
| R1.1 | Armazenamento vazio → aba Progresso mostra a pergunta da meta | ok |
| R1.2 | Seletor 1–7; `withGoal` rejeita 0, 8, 2,5 e texto (teste) | ok |
| R1.3 | Meta 3 → 5 na mesma semana substitui; semanas passadas mantêm a meta antiga (teste + sequência 2 com a meta antiga de 2) | ok |
| R1.4 | "3 de 4 dias", "1 de 2 dias" com barra | ok |
| R1.5 | "4 de 4" mostra "Meta cumprida" | ok |
| R1.6 | "3 de 4" mostra só o número, sem mensagem | ok |
| R2.1 | Revisar e salvar gravam o dia em `activityDays` sem duplicar | ok |
| R2.2 / R2.3 | "Estudei hoje" → "Check-in de hoje feito" → "Desfazer" volta ao estado anterior | ok |
| R2.4 | Depois de revisar, o bloco vira "Hoje já conta" | ok |
| R2.5 | Check-in + revisão no mesmo dia → "4 de 4", não 5 (navegador + teste) | ok |
| R3.1 / R3.3 | Dias estudados preenchidos, hoje com contorno; rótulo acessível "16 de outubro, estudado, hoje" | ok |
| R3.2 | ‹ vai para setembro, › desabilitado no mês atual, "Hoje" volta | ok |
| R3.4 | Grade começa na segunda; domingo fica na semana anterior (testes) | ok |
| R3.5 | Coluna "Semana" com "2/2 ✓", "1/2" e "0" sem meta; dias do mês vizinho aparecem apagados para a conta bater | ok |
| R3.6 | Sequência 2 com a semana em aberto, 3 depois de cumprir (navegador + testes) | ok |
| R4.1 / R4.2 | Métricas na aba Progresso; Dicionário só com o aviso de revisão e a lista | ok |
| R5.1 | Estado antigo (só `words` e `log`) carregou, ganhou os campos novos e manteve as palavras | ok |
| R5.2 | `serializeState` inclui meta, atividade e check-ins (teste); nenhum arquivo foi baixado no teste | ok |

Visual: claro, escuro e 375 px sem rolagem lateral.

Ajustes feitos durante a implementação:
- `SegmentedControl` na variante "joined" saía quebrado; usada a variante padrão (pill).
- Dias do mês vizinho aparecem apagados no calendário (em branco, a coluna "Semana" parecia errada).
- Métricas no Progresso se ajustam à largura (a coluna é mais estreita que a do Dicionário).
- `withDay` / `withoutDay` e `serializeState` adicionados para dar para testar T4 e R5.2.

Não verificado: leitor de tela real, Safari/Firefox, celular físico, virada de semana ou mês com o app aberto à meia-noite.

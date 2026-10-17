# 001 — Calendário, check-in e meta semanal: design

Status: implementado (2026-10-16)

## Visão geral

Nova aba **Progresso** no app, com quatro blocos de cima para baixo:

```
┌ Progresso ─────────────────────────────────────────────┐
│ Esta semana        ███████░░░  3 de 4 dias   ✓ Meta    │  R1.4 R1.5
│ Semanas seguidas: 2                    [Mudar meta]    │  R3.6 R1.3
├────────────────────────────────────────────────────────┤
│ Hoje: [Estudei hoje]  ou  "Hoje já conta: você revisou" │  R2.2–R2.4
├────────────────────────────────────────────────────────┤
│ ‹  outubro de 2026  ›                       [Hoje]     │  R3.2
│ Seg Ter Qua Qui Sex Sáb Dom │ Semana                   │  R3.4
│        1   2   3   4   5    │ 2/4                      │
│  6  ●7  ●8   9  10  11  12  │ 2/4                      │  R3.1 R3.5
│ ...                ◯16      │ 3/4 ✓                    │  R3.3
├────────────────────────────────────────────────────────┤
│ Palavras · Para revisar · Aprendendo · Dominadas · Acerto │ R4.1
└────────────────────────────────────────────────────────┘
```

Sem meta definida, o primeiro bloco vira a pergunta "Quantos dias por semana você quer estudar?" (R1.1).

## Dados

Dois campos novos no estado salvo (`localStorage["greywords:v1"]`):

```js
{
  words, log,                                   // já existem
  goals: [{ from: '2026-10-13', days: 4 }],     // histórico de metas; from = segunda-feira da semana em que passou a valer
  activityDays: ['2026-10-14', '2026-10-16'],   // dias com revisão ou palavra salva (automático, R2.1)
  checkinDays: ['2026-10-15'],                  // check-ins manuais (R2.2)
}
```

- **Por que `activityDays` gravado, e não calculado do `log` e das palavras?** Calculado, remover uma palavra apagaria o dia em que ela foi salva e mudaria semanas passadas. Gravado, o histórico fica estável.
- **Por que check-in separado da atividade?** Para o "Desfazer" (R2.3) remover só o manual, sem apagar o dia que conta por atividade.
- **Dia estudado** = `activityDays ∪ checkinDays` (R2.5, cada dia uma vez).
- **Meta de uma semana** = a última entrada de `goals` com `from` ≤ segunda daquela semana. Mudar a meta na mesma semana substitui a entrada; em semana nova, acrescenta (R1.3). Semanas antes da primeira meta não têm meta.
- **Migração (R5.1)** em `loadState`: se faltar `goals`/`checkinDays`, começam vazios; se faltar `activityDays`, é preenchido uma vez a partir das datas do `log` e do `addedAt` das palavras, para o histórico já existente aparecer no calendário.
- **Exportação (R5.2)**: já exporta o estado inteiro, então os campos novos entram sem mudança.

### Datas

- Chave de dia `YYYY-MM-DD` na **hora local**, montada com `getFullYear/getMonth/getDate` (nunca `toISOString`, que usa UTC e erra o dia à noite no Brasil).
- Somar dias com `new Date(ano, mês, dia + n)`, não somando milissegundos (evita erro em horário de verão).
- Segunda-feira da semana: `dia - ((getDay() + 6) % 7)`.

## Código

### Novo: `src/progress.js` (funções puras, sem React)

| Função | Retorna |
| --- | --- |
| `dayKey(date)` | `'2026-10-16'` |
| `mondayOf(dayKey)` | segunda-feira da semana |
| `studiedDays(state)` | `Set` de dias estudados |
| `goalForWeek(goals, monday)` | meta (número) ou `null` |
| `weekSummary(state, monday)` | `{ monday, count, goal, met }` |
| `currentStreak(state, today)` | semanas seguidas com meta cumprida |
| `withGoal(goals, days, today)` | novo array de metas (substitui ou acrescenta) |
| `monthGrid(ano, mês)` | semanas do mês, cada uma com 7 dias (`null` fora do mês) |

**Sequência (R3.6):** conta de trás para frente a partir da semana atual. A semana atual só entra se já cumpriu a meta; se ainda não cumpriu, ela não quebra a sequência (ainda está em andamento) e a contagem começa da semana anterior. Para na primeira semana sem meta cumprida ou sem meta definida.

### Novo: `src/components/Progress.jsx`

Recebe `state` e as ações; desenha os quatro blocos. Componentes do BEDS:

| Bloco | BEDS |
| --- | --- |
| Pergunta da meta / mudar meta | `SegmentedControl` (1 a 7, padrão 4) + `Button`; mudar abre `Dialog` |
| Andamento da semana | `ProgressBar tone="brand"` com rótulo "3 de 4 dias" + `Badge tone="success"` "Meta cumprida" |
| Semanas seguidas | `Metric` |
| Check-in | `Button` "Estudei hoje" / `Button variant="ghost"` "Desfazer"; atividade → `Notice tone="success"` |
| Navegação do mês | `IconButton` (ArrowLeft / ArrowRight; avançar desabilitado no mês atual) + `Button variant="ghost"` "Hoje" |
| Métricas movidas do Dicionário | `Metric` × 5 |

### Novo: `src/components/MonthCalendar.jsx` (do app, CSS `gw-cal-*`)

O BEDS não tem calendário mensal (o `DateItem` é uma linha de lista com data, não uma grade), então a grade é do app, lendo os tokens.

- `<table>` com `<caption>` "outubro de 2026" (nome do mês via `Intl.DateTimeFormat('pt-BR')`), cabeçalho Seg…Dom + coluna "Semana".
- Célula não é clicável (sem check-in em dia passado). Cada célula tem texto acessível completo, ex.: "16 de outubro, estudado, hoje".
- Dia estudado: fundo `--es-brand` com texto `--es-on-brand`. Hoje: contorno `--es-focus`. Dia futuro: texto `--es-secondary`. O estado não depende só de cor: dia estudado também ganha um ponto/marca e o texto acessível.
- Coluna "Semana": "3/4" e um ✓ quando cumpriu; "3" sem barra quando a semana não tinha meta.

### Mudanças em arquivos existentes

| Arquivo | Mudança |
| --- | --- |
| `src/App.jsx` | Aba "Progresso" no `SegmentedControl`; ações `setGoal(days)`, `toggleCheckin()`; registrar o dia em `activityDays` ao salvar palavra e ao revisar (R2.1) |
| `src/storage.js` | Migração descrita acima |
| `src/components/Dictionary.jsx` | Sai a linha de `Metric` (vai para Progresso); fica o aviso "N palavras esperando revisão" (R4.2) |
| `src/styles.css` | Layout da aba Progresso e do calendário (`gw-progress-*`, `gw-cal-*`) |
| `src/landing/Landing.jsx` | Roadmap: calendário sai de "O que vem por aí" quando a feature estiver pronta |
| `specs/000-mvp/requirements.md` | R2.2 (métricas no Dicionário) passa a apontar para a aba Progresso |

**Risco no celular:** quatro abas no `SegmentedControl` podem não caber em 375 px. Plano: testar; se não couber, rótulos menores ("Busca", "Palavras", "Revisão", "Progresso").

## Rastreabilidade

| Requisito | Onde |
| --- | --- |
| R1.1–R1.3 | `Progress.jsx` (pergunta/Dialog) + `withGoal`, `goalForWeek` |
| R1.4–R1.6 | `weekSummary` + `ProgressBar` / `Badge`, sem mensagem de cobrança |
| R2.1 | `App.jsx` grava `activityDays` ao salvar e revisar |
| R2.2–R2.5 | `toggleCheckin`, `studiedDays`, bloco "Hoje" |
| R3.1–R3.5 | `MonthCalendar.jsx` + `monthGrid`, `weekSummary` |
| R3.6 | `currentStreak` |
| R4.1–R4.2 | Aba Progresso; Dicionário sem métricas |
| R5.1–R5.2 | Migração em `loadState`; exportação existente |

## Verificação planejada

- `npm run build` e `npm run check:ui` (0 violações).
- Testes rápidos de `progress.js` com Node (semana começando na segunda, virada de mês e de ano, sequência com semana atual em andamento, troca de meta no meio).
- No navegador: definir meta, check-in e desfazer, revisar uma palavra e ver o dia contar sozinho, navegar meses, semana cumprida com dados de teste, 375 px, claro e escuro.

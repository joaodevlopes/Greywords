# 001 — Calendário, check-in e meta semanal: requisitos

Status: implementado (2026-10-16)

## Objetivo

Dar constância ao estudo: você define quantos dias por semana quer estudar, marca os dias em que estudou e vê isso num calendário.

## R1 — Meta semanal

**História:** Como estudante, quero definir quantos dias por semana vou estudar, para ter um compromisso realista.

- R1.1 ENQUANTO não houver meta definida, O SISTEMA DEVE pedir a meta ao abrir a aba Progresso.
- R1.2 O SISTEMA DEVE aceitar uma meta de 1 a 7 dias por semana.
- R1.3 O SISTEMA DEVE permitir mudar a meta a qualquer momento; a mudança vale a partir da semana atual (semanas passadas mantêm a meta que tinham).
- R1.4 O SISTEMA DEVE mostrar o andamento da semana atual: "X de N dias".
- R1.5 QUANDO a semana atingir a meta, O SISTEMA DEVE indicar que a meta da semana foi cumprida.
- R1.6 QUANDO uma semana terminar sem atingir a meta, O SISTEMA DEVE só mostrar o resultado ("3 de 4"), sem mensagem de cobrança; a semana nova começa do zero.

## R2 — Dia estudado e check-in

**História:** Como estudante, quero que meu estudo no app conte sozinho e poder marcar o estudo feito fora dele (vídeo, série, aula).

- R2.1 QUANDO o usuário revisar ou salvar pelo menos uma palavra num dia, O SISTEMA DEVE contar esse dia como estudado automaticamente.
- R2.2 QUANDO o usuário fizer o check-in manual, O SISTEMA DEVE registrar o dia de hoje (data local) como estudado.
- R2.3 O SISTEMA DEVE permitir desfazer o check-in manual de hoje.
- R2.4 SE o dia de hoje já contar pela atividade no app, ENTÃO O SISTEMA DEVE informar isso no lugar do botão de check-in.
- R2.5 O SISTEMA DEVE contar cada dia uma vez só, seja por atividade, check-in ou os dois.

## R3 — Calendário

**História:** Como estudante, quero ver no calendário os dias em que estudei, para enxergar minha constância.

- R3.1 O SISTEMA DEVE mostrar o mês atual com os dias estudados destacados.
- R3.2 O SISTEMA DEVE permitir navegar para meses anteriores e voltar ao atual.
- R3.3 O SISTEMA DEVE destacar o dia de hoje.
- R3.4 A semana DEVE começar na segunda-feira.
- R3.5 O SISTEMA DEVE mostrar, por semana, quantos dias foram estudados e se a meta foi cumprida.
- R3.6 O SISTEMA DEVE mostrar a sequência de semanas seguidas com a meta cumprida.

## R4 — Aba Progresso

- R4.1 O app DEVE ganhar uma aba "Progresso" com meta, check-in, calendário e as métricas que hoje estão no Dicionário.
- R4.2 O Dicionário DEVE continuar com lista, filtro, ordem, detalhe, exportação e o aviso de palavras para revisar.

## R5 — Dados

- R5.1 O SISTEMA DEVE guardar meta e check-ins no mesmo armazenamento das palavras, sem perder dados já salvos.
- R5.2 A exportação em JSON DEVE incluir meta e check-ins.

## Decisões das dúvidas

| Dúvida | Decisão |
| --- | --- |
| D1 — O que conta como dia estudado | Automático (revisou ou salvou palavra) + check-in manual para estudo fora do app → R2 |
| D2 — Onde fica | Nova aba "Progresso" → R4 |
| D3 — Início da semana | Segunda-feira → R3.4 |
| D4 — Semana sem meta | Sem cobrança, só o resultado → R1.6 |
| D5 — Lembretes | Fora do escopo |

## Fora do escopo

Notificações e lembretes, check-in em dias passados, ranking, compartilhamento, sincronização entre dispositivos.

# 000 — MVP: requisitos

Status: implementado (escrito depois do código, para registrar o combinado)

## Objetivo

Aprender vocabulário em inglês associando a palavra a imagens escolhidas pelo próprio usuário, e revisar no momento certo. Grátis, sem conta, sem backend.

## R1 — Busca por imagem

**História:** Como estudante, quero buscar uma palavra e ver imagens dela antes da tradução, para ligar a palavra direto à ideia.

- R1.1 QUANDO o usuário buscar uma palavra, O SISTEMA DEVE mostrar até 12 imagens de bancos com licença aberta.
- R1.2 QUANDO o usuário buscar uma palavra, O SISTEMA DEVE mostrar definições em inglês, com classe gramatical e exemplos quando existirem.
- R1.3 O SISTEMA DEVE manter a tradução para o português escondida até o usuário pedir.
- R1.4 O SISTEMA DEVE permitir ouvir a pronúncia (áudio do dicionário ou voz do navegador).
- R1.5 O SISTEMA DEVE pré-selecionar as 3 primeiras imagens e permitir trocar a seleção (máximo 3).
- R1.6 Cada parte (imagens, definição, tradução) DEVE aparecer assim que chegar, sem esperar as outras.
- R1.7 SE um serviço falhar ou demorar, ENTÃO O SISTEMA DEVE usar a fonte reserva ou mostrar um aviso, sem travar a tela.
- R1.8 O SISTEMA DEVE mostrar o crédito do autor de cada imagem.

## R2 — Dicionário

**História:** Como estudante, quero ver todas as palavras que salvei e meu progresso, para saber como estou indo.

- R2.1 QUANDO o usuário salvar uma palavra, O SISTEMA DEVE guardar palavra, imagens escolhidas, definições, tradução e data.
- R2.2 O SISTEMA DEVE mostrar: total de palavras, para revisar hoje, aprendendo, dominadas (intervalo ≥ 21 dias) e taxa de acerto dos últimos 30 dias. *(Desde a spec 001, essas métricas ficam na aba Progresso; o Dicionário mantém o aviso de palavras para revisar.)*
- R2.3 O SISTEMA DEVE permitir filtrar por texto e ordenar por mais recentes, próxima revisão ou A–Z.
- R2.4 QUANDO o usuário abrir uma palavra, O SISTEMA DEVE mostrar imagens, definições, tradução e dados da revisão.
- R2.5 QUANDO o usuário pedir para remover uma palavra, O SISTEMA DEVE pedir confirmação antes.
- R2.6 O SISTEMA DEVE permitir exportar todos os dados em JSON.

## R3 — Revisão espaçada

**História:** Como estudante, quero revisar cada palavra no dia certo, para não esquecer e não perder tempo com o que já sei.

- R3.1 O SISTEMA DEVE mostrar na revisão só as palavras com revisão vencida.
- R3.2 A frente do cartão DEVE mostrar as imagens escolhidas (ou a definição com a palavra escondida, se não houver imagem).
- R3.3 O SISTEMA DEVE aceitar um palpite opcional e dizer se acertou.
- R3.4 O SISTEMA DEVE oferecer as notas Errei / Difícil / Bom / Fácil, mostrando quando a palavra volta em cada uma.
- R3.5 QUANDO a nota for "Errei", O SISTEMA DEVE recolocar a palavra no fim da sessão atual.
- R3.6 O SISTEMA DEVE aceitar atalhos: Enter mostra a resposta, teclas 1–4 dão a nota.
- R3.7 O SISTEMA DEVE registrar cada revisão (data, palavra, nota) para as estatísticas.

## R4 — Landing page

**História:** Como visitante, quero entender o que é a plataforma antes de usar.

- R4.1 O SISTEMA DEVE ter uma landing em `#/` e o app em `#/app`.
- R4.2 A landing DEVE explicar a proposta, mostrar uma demonstração ilustrativa, os passos, os diferenciais, o que vem por aí e perguntas frequentes.
- R4.3 A landing NÃO DEVE conter depoimentos, números de usuários ou promessas de resultado inventados.

## R5 — Geral

- R5.1 O SISTEMA DEVE funcionar sem conta e guardar os dados no navegador.
- R5.2 O SISTEMA DEVE ter tema claro e escuro, lembrando a escolha.
- R5.3 O SISTEMA DEVE funcionar em celular (375 px) sem rolagem lateral.
- R5.4 A interface DEVE usar o design system BEDS (ver `CLAUDE.md`).

## Fora do escopo do MVP

Conta e sincronização entre dispositivos, notificações, calendário e metas (→ spec 001), recomendação de vídeos.

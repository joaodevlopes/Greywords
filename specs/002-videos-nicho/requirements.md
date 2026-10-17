# 002 — Vídeos por nicho, no seu nível: requisitos

Status: aprovado (2026-10-16)

## Objetivo

Recomendar vídeos em inglês sobre assuntos de que você gosta, com legenda e com a dificuldade estimada pelas próprias legendas, para você treinar o ouvido com conteúdo que prende a atenção.

## Restrição que molda tudo

O Greywords é grátis e não tem servidor. Isso limita como os vídeos e as legendas podem chegar ao app (ver **D1**). Os requisitos abaixo valem para qualquer resposta da D1; o design é que muda.

## R1 — Meus nichos

**História:** Como estudante, quero dizer de quais assuntos eu gosto, para receber vídeos que eu teria vontade de ver mesmo em português.

- R1.1 ENQUANTO nenhum nicho estiver escolhido, O SISTEMA DEVE pedir para escolher pelo menos um ao abrir a área de vídeos.
- R1.2 O SISTEMA DEVE oferecer uma lista fixa de nichos (ver **D7**) e permitir escolher vários.
- R1.3 O SISTEMA DEVE permitir mudar os nichos a qualquer momento.

## R2 — Recomendações

**História:** Como estudante, quero ver uma lista de vídeos dos meus nichos, para escolher o que assistir sem procurar.

- R2.1 O SISTEMA DEVE mostrar vídeos só dos nichos escolhidos, com título, canal, miniatura, duração e nível.
- R2.2 O SISTEMA DEVE mostrar só vídeos com legenda em inglês disponível.
- R2.3 O SISTEMA DEVE ordenar primeiro os vídeos do nível mais próximo do seu (R4).
- R2.4 O SISTEMA DEVE permitir filtrar por nicho e por nível.
- R2.5 SE não houver vídeo para um filtro, ENTÃO O SISTEMA DEVE dizer isso e sugerir afrouxar o filtro.

## R3 — Nível de dificuldade do vídeo

**História:** Como estudante, quero saber se um vídeo está no meu nível antes de dar play, e entender por quê.

- R3.1 O SISTEMA DEVE classificar cada vídeo num nível (ver **D2**) calculado a partir da legenda.
- R3.2 O cálculo DEVE usar pelo menos: velocidade da fala (palavras por minuto) e proporção de palavras fora de uma lista das palavras mais comuns do inglês.
- R3.3 O SISTEMA DEVE mostrar os números que levaram ao nível (ex.: "150 palavras/min · 9% de palavras pouco comuns").
- R3.4 O nível NÃO DEVE ser apresentado como certificação (ex.: "este vídeo é B2"); é uma estimativa e o app diz isso.

## R4 — Meu nível

- R4.1 O SISTEMA DEVE deixar o usuário dizer o próprio nível (ver **D3**).
- R4.2 O SISTEMA DEVE permitir mudar o nível a qualquer momento.

## R5 — Assistir

**História:** Como estudante, quero assistir e registrar que assisti, para isso contar no meu progresso.

- R5.1 QUANDO o usuário escolher um vídeo, O SISTEMA DEVE permitir assistir (ver **D4**).
- R5.2 O SISTEMA DEVE permitir marcar um vídeo como assistido e desfazer.
- R5.3 QUANDO o usuário marcar um vídeo como assistido, O SISTEMA DEVE contar o dia como estudado na aba Progresso (ver **D5**; liga com a spec 001).
- R5.4 O SISTEMA DEVE mostrar quais vídeos já foram assistidos e permitir escondê-los da lista.

## R6 — Palavras do vídeo (ver **D6**)

- R6.1 O SISTEMA DEVE mostrar algumas palavras-chave da legenda que ainda não estão no seu dicionário.
- R6.2 QUANDO o usuário tocar numa dessas palavras, O SISTEMA DEVE abrir a busca por imagem com ela.

## R7 — Dados e honestidade

- R7.1 O SISTEMA DEVE guardar nichos, nível e vídeos assistidos no mesmo armazenamento, com migração (como na spec 001).
- R7.2 A exportação em JSON DEVE incluir esses dados.
- R7.3 O SISTEMA NÃO DEVE inventar avaliações, visualizações ou "recomendado por X pessoas".
- R7.4 O SISTEMA DEVE dar crédito ao canal e levar ao vídeo original.

## Decisões das dúvidas

| Dúvida | Decisão |
| --- | --- |
| D1 — Fonte | Catálogo preparado offline por script, que gera um JSON publicado com o app. Fonte da v1: TED Talks com **curadoria manual**: os Termos de Uso do TED.com (seção 6.4) proíbem acesso automatizado, então as transcrições são copiadas à mão para arquivos locais e o script só lê esses arquivos (decidido em 2026-10-16, na T1). YouTube por legenda baixada fica de fora pelo mesmo motivo |
| D2 — Escala | Fácil / Médio / Difícil, com os números à mostra |
| D3 — Meu nível | O usuário escolhe: Iniciante / Intermediário / Avançado |
| D4 — Onde assistir | Player embutido no modo sem cookies, mais link para o original |
| D5 — Assisti conta? | Sim, conta o dia como estudado |
| D6 — Palavras do vídeo | Entram agora (R6) |
| D7 — Nichos | 8 nichos (tecnologia, games, ciência, culinária, viagem, esportes, cinema e séries, negócios e dados), **cerca de 5 vídeos cada** na v1 (a curadoria é manual); nicho com menos vídeos fica com o que houver |

## Fora do escopo

Conta e sincronização, comentários, baixar vídeos, legenda traduzida, recomendação por histórico de outros usuários.

# 003 — Imagens mais certeiras na busca: requisitos

Status: aprovado (2026-10-16; alteração Unsplash aprovada em 2026-10-17)

## Objetivo

Fazer as imagens da busca mostrarem o **significado** da palavra, não qualquer foto que tenha a palavra no título, e nunca mostrar conteúdo impróprio.

## O que foi observado (2026-10-16)

- Buscando "study", vieram esboços e pinturas ("Study of…") e um nu artístico. Todos vinham do Wikimedia Commons, que o app usa para completar a lista quando o Openverse traz poucas imagens ou demora. O Commons é cheio de arte e não tem filtro de conteúdo adulto.
- Os dois bancos procuram a palavra no **título e nas tags**, não pelo significado: "whisper" traz "Whispering oaks" (árvores); "study" traz "ITU-D Study Group" (reunião).
- Com contexto e só fotografias, o resultado muda: "student studying" no Openverse trouxe 8 de 8 fotos de gente estudando.

## R1 — Só fotos, conteúdo seguro

**História:** Como estudante, quero ver fotos que representem a palavra, sem pinturas, esboços ou nudez.

- R1.1 O SISTEMA DEVE pedir ao Openverse só fotografias, com o filtro de conteúdo adulto ligado.
- R1.2 O SISTEMA DEVE usar o Wikimedia Commons só quando o Openverse falhar ou não trouxer nenhuma imagem, nunca para completar a lista.
- R1.3 O SISTEMA DEVE permitir esconder uma imagem inadequada; ela não volta a aparecer para aquela palavra (ver **D3**).

## R2 — Busca com contexto

**História:** Como estudante, quero que o app entenda o tipo de palavra, para "study" mostrar alguém estudando e não um "Study Group".

- R2.1 O SISTEMA DEVE montar a busca de imagens a partir da palavra e do seu contexto (ver **D1**), não só da palavra solta.
- R2.2 Para verbos, a busca DEVE procurar a ação acontecendo (ex.: "study" → pessoas estudando).
- R2.3 O SISTEMA DEVE juntar os resultados de mais de uma busca sem repetir imagens.
- R2.4 SE a busca com contexto não trouxer imagens, ENTÃO O SISTEMA DEVE buscar pela palavra sozinha.
- R2.5 As imagens DEVEM aparecer em tempo parecido com o de hoje (ver **D2**).

## R3 — Refinar à mão

**História:** Como estudante, quero ajustar a busca quando as imagens não fizerem sentido.

- R3.1 O SISTEMA DEVE oferecer um campo "Refinar imagens" com 2 a 4 sugestões prontas (ex.: "student studying", "studying at desk").
- R3.2 QUANDO o usuário refinar, O SISTEMA DEVE trocar as imagens pelas da nova busca, mantendo a palavra, a definição e a tradução.
- R3.3 A escolha de até 3 imagens e o salvar continuam como hoje.

## R4 — Medir antes e depois

**História:** Como dono do projeto, quero saber com números se melhorou, e não só achar.

- R4.1 O projeto DEVE ter uma lista fixa de cerca de 20 palavras de teste, misturando substantivos concretos, verbos, adjetivos e palavras abstratas.
- R4.2 Para cada palavra, contar quantas das 9 primeiras imagens são "certeiras": alguém que não leu o título reconhece a palavra na imagem.
- R4.3 A medição DEVE ser feita antes da mudança e depois dela, com o resultado (por palavra e no total) registrado na spec.
- R4.4 A mudança só é dada como pronta se o total melhorar e nenhuma palavra da lista mostrar conteúdo impróprio.

## R5 — Palavras abstratas (ver **D5**)

- R5.1 Para palavras que quase não têm imagem (ex.: "however", "although"), O SISTEMA DEVE deixar claro que o foco é a definição e os exemplos, em vez de mostrar fotos aleatórias.

## Alteração de 2026-10-17: Unsplash como fonte principal

Com o código pronto (T3–T6), o Openverse continuou trazendo fotos fora do tema. Para "study", só 1 em 12 mostrava alguém estudando, e nenhum ajuste de consulta resolveu, porque o ranking dele não serve para palavras do dia a dia. Comparando as 20 palavras do teste, o Unsplash acertou o tema em quase todas (`bench/images/out/stock.html`). Por isso a D4 muda: entra uma fonte com chave, aprovada pelo usuário.

- R1.4 O SISTEMA DEVE buscar as imagens primeiro no **Unsplash**. O Openverse (com R1.1) e o Wikimedia (com R1.2) passam a ser reserva, usados só quando o Unsplash falhar, estiver no limite ou não trouxer nenhuma foto.
- R1.5 A chave do Unsplash NÃO DEVE ir para o código que roda no navegador. O app fala com um intermediário próprio, que guarda a chave.
- R1.6 O SISTEMA DEVE dar crédito ao fotógrafo e ao Unsplash, com link, como pedem as regras do Unsplash. Ao salvar uma foto, deve avisar o Unsplash do uso (registro de download).
- R1.7 SE o intermediário não estiver disponível, ENTÃO O SISTEMA DEVE continuar funcionando com o Openverse, como hoje.

## Decisões das dúvidas

| Dúvida | Decisão |
| --- | --- |
| D1 — Contexto | As duas fontes juntas: regras pela classe gramatical e palavras da definição. A medição (R4) compara as variantes |
| D2 — Esperar a definição | Até 2 segundos; se não chegar, busca pela palavra sozinha. As imagens não trocam enquanto você escolhe |
| D3 — Esconder imagem | Botão "Esconder" em cada imagem, salvo no navegador |
| D4 — Fonte com chave | ~~Não agora~~ → **Unsplash**, decidido em 2026-10-17 depois da comparação (ver "Alteração de 2026-10-17"). O Pexels pausou chaves novas; o Pixabay desaconselha usar o link dele de forma permanente |
| D5 — Palavras abstratas | Conjunções, preposições e advérbios de ligação mostram o aviso "Palavra abstrata: foque na definição e nos exemplos" e poucas imagens, com a opção de refinar |

## Fora do escopo

Gerar imagens com IA, trocar a fonte das definições, mudar a revisão espaçada.

# 003 — Medição das imagens

Método (R4): 20 palavras fixas (`bench/images/words.json`), as 9 primeiras imagens de cada uma, mostradas **sem título**. Uma imagem é "certeira" quando alguém que não leu o título reconhece a palavra nela. Quem marca é a pessoa dona do projeto; o script só busca e monta a página (`node bench/images/run.mjs <variante>`).

## Antes (lógica original do app)

Buscado em 2026-10-16, marcado em 2026-10-17. Palavra solta, qualquer categoria, lista completada com o Wikimedia Commons.
Origem das 180 imagens: 135 do Openverse e 45 do Wikimedia. Em 5 palavras (blanket, bridge, apple, stubborn, tired) as 9 vieram só do Wikimedia, porque o Openverse não respondeu a tempo. É o comportamento real do app hoje.

**Total: 82 de 180 certeiras (45,6%).**

| Grupo | Palavra | Certeiras (de 9) | Marcadas com ⚠ |
| --- | --- | --- | --- |
| concreto | sun | 6 | 3 |
| concreto | river | 9 | 0 |
| concreto | blanket ¹ | 1 | 8 |
| concreto | bridge ¹ | 6 | 2 |
| concreto | apple ¹ | 3 | 5 |
| verbo | study | 3 | 6 |
| verbo | climb | 9 | 0 |
| verbo | whisper | 1 | 7 |
| verbo | cook | 8 | 1 |
| verbo | swim | 9 | 0 |
| adjetivo | stubborn ¹ | 2 | 8 |
| adjetivo | tired ¹ | 3 | 6 |
| adjetivo | crowded | 9 | 0 |
| adjetivo | shiny | 0 | 9 |
| abstrato | freedom | 3 | 7 |
| abstrato | knowledge | 2 | 6 |
| gramatical | however | 1 | 9 |
| gramatical | although | 1 | 8 |
| ambígua | bat | 6 | 3 |
| ambígua | spring | 0 | 7 |

¹ todas as imagens vieram do Wikimedia.

Por grupo: concretos 25/45 (56%) · verbos 30/45 (67%) · adjetivos 14/36 (39%) · abstratos 5/18 (28%) · gramaticais 2/18 (11%) · ambíguas 6/18 (33%).
Por fonte: palavras só com Wikimedia 15/45 (33%); palavras com Openverse 67/135 (50%).

**Sobre o ⚠:** as 95 imagens marcadas eram **erradas**, não impróprias; a marcação confirmou que nenhuma tinha conteúdo impróprio (2026-10-17). Impróprias no "antes": 0. A coluna "Marcadas com ⚠" é, na prática, "erradas" (complemento das certeiras, com folga para imagens que não carregaram). Na página da T7 o botão passa a dizer "Imprópria", para não confundir.

## Depois

Buscado em 2026-10-17 com a lógica nova do app (T3–T6): só fotos do Openverse, até 2 consultas (com contexto e a palavra sozinha), Wikimedia só em falha. 9 imagens por palavra em todas as variantes, para comparar com o "antes" (no app, palavras abstratas mostram só 3).

**Método de marcação (mudança em relação ao "antes"):** uma página só (`node bench/images/run.mjs depois` gera `bench/images/out/depois.html`).
- Ela traz as imagens **distintas** de cada palavra somando as 3 variantes, em ordem embaralhada, sem dizer de qual variante veio cada uma.
- A pessoa marca cada imagem uma vez, e a página calcula as certeiras de cada variante a partir das mesmas marcas.
- São 233 imagens, em vez de 540, e o julgamento fica consistente entre as variantes.

**Condições desta coleta:**
- O dictionaryapi.dev estava fora do ar, então as definições vieram do Wiktionary (`bench/images/cache/defs.json`). Com o dictionaryapi.dev no ar, algumas consultas de contexto mudam.
- "stubborn" ficou sem definição e foi buscada só pela palavra.
- A primeira coleta da variante `class` pegou o Openverse no limite (429): 18 das 20 palavras caíram no Wikimedia. Elas foram descartadas e coletadas de novo; na coleta final nenhuma variante usa o Wikimedia.
- Antes da coleta foi corrigido um defeito: sentidos de flexão do Wiktionary ("simple past and past participle of tire") faziam "tired" virar verbo ("person tireding").

**Consultas usadas:**

| Palavra | class | definition | both |
| --- | --- | --- | --- |
| sun | sun | sun star earth · sun | sun star · sun |
| river | river | river large land · river | river large · river |
| study | person studying · study | study examination review · study | person studying examination · study |
| climb | person climbing · climb | climb slope traverse · climb | person climbing slope · climb |
| whisper | person whispering · whisper | whisper quiet vocal · whisper | person whispering quiet · whisper |
| cook | cook | cook person prepares · cook | cook person · cook |
| swim | person swimming · swim | swim water bottom · swim | person swimming water · swim |
| tired | tired person · tired | tired rest sleep · tired | tired rest · tired |
| crowded | crowded person · crowded | crowded dense containing · crowded | crowded dense · crowded |
| shiny | shiny person · shiny | shiny reflecting light · shiny | shiny reflecting · shiny |
| freedom | freedom | freedom free imprisoned · freedom | freedom free · freedom |
| knowledge | knowledge | knowledge fact subject · knowledge | knowledge fact · knowledge |
| blanket, bridge, apple, stubborn, however, although, bat, spring | a palavra | a palavra | a palavra |

**Resultado:** a marcação desta página foi abandonada, porque a fonte mudou (ver abaixo).

## Depois: Unsplash (resultado final)

Coletado em 2026-10-17 com a lógica do app depois da T8a: o intermediário (`server/images.js`), a palavra sozinha, `content_filter=high`, 9 fotos (`node bench/images/run.mjs unsplash`). Marcado pelo usuário em 2026-10-17, no mesmo formato do "antes" (sem título).

**Total: 173 de 180 certeiras (96,1%)**, contra 82 de 180 (45,6%) no "antes": **+91 imagens certeiras, mais que o dobro.**

**Impróprias: 0.** A página registrou 6 marcações no botão "Imprópria" (whisper #5 e #8, cook #1, stubborn #3, #4 e #6). Em cada uma dessas palavras, certeiras + marcadas somam 9, o mesmo padrão do "antes", em que o botão foi usado para "errada". As 6 imagens foram conferidas: um buldogue francês (3 fotos para "stubborn"), uma cozinha vazia ("cook"), uma mão segurando uma semente e uma silhueta de costas em preto e branco, sem nudez ("whisper"). São erradas, não impróprias.

| Grupo | Palavra | Antes (de 9) | Depois (de 9) | Diferença |
| --- | --- | --- | --- | --- |
| concreto | sun | 6 | 9 | +3 |
| concreto | river | 9 | 9 | 0 |
| concreto | blanket | 1 | 9 | +8 |
| concreto | bridge | 6 | 9 | +3 |
| concreto | apple | 3 | 9 | +6 |
| verbo | study | 3 | 8 | +5 |
| verbo | climb | 9 | 9 | 0 |
| verbo | whisper | 1 | 7 | +6 |
| verbo | cook | 8 | 8 | 0 |
| verbo | swim | 9 | 9 | 0 |
| adjetivo | stubborn | 2 | 6 | +4 |
| adjetivo | tired | 3 | 9 | +6 |
| adjetivo | crowded | 9 | 9 | 0 |
| adjetivo | shiny | 0 | 9 | +9 |
| abstrato | freedom | 3 | 9 | +6 |
| abstrato | knowledge | 2 | 9 | +7 |
| gramatical | however | 1 | 9 | +8 |
| gramatical | although | 1 | 9 | +8 |
| ambígua | bat | 6 | 9 | +3 |
| ambígua | spring | 0 | 9 | +9 |

Por grupo:

| Grupo | Antes | Depois |
| --- | --- | --- |
| concreto | 25/45 (56%) | 45/45 (100%) |
| verbo | 30/45 (67%) | 41/45 (91%) |
| adjetivo | 14/36 (39%) | 33/36 (92%) |
| abstrato | 5/18 (28%) | 18/18 (100%) |
| gramatical | 2/18 (11%) | 18/18 (100%) |
| ambígua | 6/18 (33%) | 18/18 (100%) |

**Leitura:**
- O ganho maior está onde o Openverse mais errava: adjetivos ("shiny" foi de 0 a 9), concretos que vinham do Wikimedia ("blanket" de 1 a 9) e palavras ambíguas ("spring" de 0 a 9).
- As palavras gramaticais e abstratas também passaram a 9/9, pelo julgamento do usuário. Mesmo assim, a spec 004 (frases de exemplo) continua valendo: frase com a palavra em uso ensina "however" melhor que uma foto.
- Erros que sobraram: "stubborn" (3 fotos de um buldogue) e "whisper" (2). O "Refinar" e o "Esconder" cobrem esses casos.
- Critérios R4.3 e R4.4 atendidos: o total melhorou e nenhuma imagem imprópria apareceu.

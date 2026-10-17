# 003 — Imagens mais certeiras na busca: design

Status: aprovado (2026-10-16)

## Visão geral

Hoje a busca dispara imagens, definição e tradução ao mesmo tempo, procurando imagens pela palavra solta. Passa a ser:

```
buscar "study"
  ├─ definição ──────────────┐  (espera no máximo 2 s; D2)
  │                          ▼
  │                 montar consultas (src/imageQuery.js)
  │                   1. com contexto: "person studying" + palavras da definição
  │                   2. a palavra sozinha
  │                          ▼
  │                 Openverse, só fotos, filtro adulto ligado (2 consultas em paralelo)
  │                   └─ falhou de vez ou 0 imagens? → Wikimedia (R1.2)
  │                          ▼
  │                 junta sem repetir, contexto primeiro, tira as escondidas (R1.3)
  └─ tradução (como hoje)
```

## Limite do Openverse (medido em 2026-10-16)

Cabeçalhos da API sem chave: **20 requisições/min e 200/dia por IP** (`x-ratelimit-limit-anon_burst`, `anon_sustained`). Como o navegador de cada usuário chama a API direto, o limite é de cada um.

- Cada busca faz no máximo **2** consultas (contexto + palavra), e cada "Refinar" faz **1**: cerca de 100 palavras por dia por pessoa.
- Resposta 429 (limite atingido) conta como falha: entra o Wikimedia e aparece um aviso curto ("o banco de fotos limitou as buscas por hoje; mostrando outra fonte").

## Montagem das consultas (`src/imageQuery.js`, funções puras e testadas)

| Função | O que faz |
| --- | --- |
| `primaryPos(def)` | Classe da primeira definição: noun, verb, adjective, adverb, preposition, conjunction… |
| `isAbstract(def, word)` | Verdadeiro para conjunção, preposição, pronome, determinante, interjeição e advérbios de ligação (lista curta: however, therefore, although, moreover…) — D5 |
| `toGerund(verb)` | study → studying, make → making, run → running, die → dying, see → seeing |
| `definitionWords(def, word)` | Até 2 palavras de conteúdo da primeira definição: sem palavras gramaticais (lista de ~150), sem a própria palavra, sem terminação -ly, com 4+ letras. "The star that is closest to the Earth" → star, earth |
| `buildQueries(word, def, variant)` | Lista de consultas na ordem de uso; `variant` = `class`, `definition` ou `both` (padrão, D1) |
| `refineSuggestions(word, def)` | 2 a 4 sugestões para o campo "Refinar" (R3.1), tiradas das mesmas regras |

Regras por classe (D1a):

| Classe | Consulta com contexto | Exemplo |
| --- | --- | --- |
| verbo | `person <gerúndio>` | study → "person studying" |
| adjetivo | `<palavra> <1ª palavra da definição>` se houver; senão `<palavra> person` | stubborn → "stubborn determined" ou "stubborn person" |
| substantivo | `<palavra> <1ª palavra da definição>` | sun → "sun star" |
| abstrata | nenhuma: só a palavra, e só 3 imagens | however → aviso + 3 imagens |

Com `both`, a consulta com contexto junta as duas fontes num texto só (ex.: "person studying learning"). A medição (R4) roda `class`, `definition` e `both` e mostra qual acerta mais; a vencedora vira o padrão.

Sem definição (não chegou em 2 s ou não existe), a lista é só a palavra (R2.4).

### Ajustes feitos na T1 (2026-10-16)

- **Classe:** vale a do primeiro sentido. Um substantivo que descreve ação ("The act of…", "An instance of…") conta como verbo ("whisper" → "person whispering"). A ideia inicial ("verbo entre os dois primeiros sentidos ganha") transformava "sun" em "person sunning".
- **Palavras da definição:** as que vêm logo depois de "a/an/the" entram primeiro, porque costumam ser substantivos ("The star … the Earth" → star, earth; antes saía "star, closest"). Limitação conhecida: "A large stream of water" dá "large".
- **Variante `class`:** substantivo usa só a palavra; adjetivo usa "<palavra> person"; verbo usa "person <gerúndio>". As palavras da definição ficam só nas variantes `definition` e `both`, para a medição separar o efeito de cada regra.

### Ajuste feito na T4 (2026-10-17)

- **Definição com pedido em paralelo:** no dia do teste, o dictionaryapi.dev estava fora do ar. Ele só desistia depois de 4 s e aí o app pedia ao Wiktionary, então a definição nunca chegava dentro dos 2 s e as imagens perdiam o contexto.
  - Agora `fetchDefinition` pede também ao Wiktionary se o dictionaryapi.dev não responder em 1,2 s, e usa a primeira resposta.
  - Com o dictionaryapi.dev bem, nada muda: ele responde antes e traz pronúncia e áudio.
  - Fora do ar, a definição chega em cerca de 2 s, sem áudio do dicionário; a pronúncia cai na voz do navegador, que já era a reserva.

### Decisão de 2026-10-17: trocar a fonte principal para um banco de fotos com chave (revê a D4)

> Atualização: o Pexels pausou a emissão de chaves novas no mesmo dia. A escolha passou a ser o **Unsplash**: cadastro aberto, modo demo com 50 buscas por hora para o app, produção com aprovação. As regras dele exigem usar o link original das fotos, o que combina com o dicionário guardar o link, e pedem crédito ao fotógrafo e ao Unsplash. O Pixabay foi descartado porque desaconselha usar o link deles de forma permanente.


- **Por quê:** com as APIs reais, o Openverse devolveu fotos fora do tema mesmo com contexto. Para "study", veio 1 foto de gente estudando em 12. O ranking dele não serve para palavras do dia a dia, e nenhum ajuste de consulta resolve isso.
- **O que muda:** o Pexels vira a fonte principal (grátis, 200 buscas/hora e 20 mil/mês, mas **pede chave**). O Openverse e o Wikimedia ficam como reserva. A regra "só APIs sem chave" passa a ter esta exceção, aprovada pelo usuário.
- **A chave não vai para o navegador:** em produção, um intermediário pequeno (Cloudflare Workers, gratuito) recebe a busca e chama o Pexels. No desenvolvimento, a chave fica em `.env.local`, que está fora do git.
- **Crédito:** o Pexels pede o link "Photos provided by Pexels" e o crédito do fotógrafo; os dois entram junto das imagens.
- **Próximo passo:** comparar Pexels e Openverse nas 20 palavras do benchmark (`node bench/images/stock.mjs`) antes de mexer no app. A marcação da página `depois.html` foi abandonada.

## Unsplash no app (2026-10-17, R1.4–R1.7)

Status desta seção: aprovado (2026-10-17).

```
app (navegador)                     intermediário (tem a chave)                 Unsplash
fetchImagesFor ── GET /search?q= ──▶ /search  → api.unsplash.com/search/photos ──▶
               ◀── fotos enxutas ──  (cache de 24 h por consulta)
save()          ── GET /download?id= ▶ /download → links.download_location ──────▶  (registro de uso)
  └─ falhou / 429 / sem intermediário → Openverse + Wikimedia (lógica atual da T3)
```

### O intermediário (`server/images.js`)

Um único módulo, com funções puras e testadas, usado em dois lugares:

| Onde | Como |
| --- | --- |
| Desenvolvimento (`npm run dev`) | Plugin do Vite que atende `/api/images/*` e lê `UNSPLASH_ACCESS_KEY` do `.env.local`. A chave fica no Node, nunca no pacote do navegador |
| Produção | Worker do Cloudflare (`worker/`, plano grátis de 100 mil chamadas por dia), com cache de 24 h por consulta. O endereço dele entra no build como `VITE_IMAGES_API` |

Rotas:
- `GET /search?q=<texto>&n=<até 12>` devolve `{ images: [{ id, thumb, title, credit, creditLink, link, download }], limited }`.
- `GET /download?id=<id>` repassa o aviso de uso.
- Um 429 do Unsplash vira `limited: true` com lista vazia, e o app cai na reserva.

As URLs de crédito levam `?utm_source=greywords&utm_medium=referral`, como o Unsplash pede.

### No app

- **`fetchImagesFor(queries, n)`:** pede ao intermediário **uma consulta só**, a palavra sozinha (a última de `buildQueries`), porque na comparação a palavra sozinha já acertou. Com falha, `limited` ou zero fotos, segue a lógica atual com o Openverse. "Refinar" também faz 1 consulta ao intermediário.
  - A consulta com contexto (`buildQueries`) continua existindo, mas só é usada no Openverse, na reserva.
- **Sem `VITE_IMAGES_API` no build** (ou com ele fora do ar), o app funciona como hoje, só com o Openverse (R1.7).
- **Crédito (R1.6):**
  - na grade, o título de cada foto diz "Foto de <nome> no Unsplash";
  - abaixo da grade, a legenda muda para "Fotos: Unsplash", com link;
  - no detalhe da palavra salva, cada imagem mostra "Foto de <nome> no Unsplash", com os dois links.
- **Registro de uso:** ao salvar, o app chama `/download` para cada foto do Unsplash escolhida que ainda não estava salva. Se a chamada falhar, nada muda para a pessoa.
- **Dados:** cada imagem salva ganha dois campos opcionais, `source` (`unsplash` | `openverse` | `wikimedia`) e `creditLink`. Imagens antigas continuam valendo sem eles, então não precisa de migração.

### Limites

- **Modo demo:** 50 buscas por hora **para o app inteiro**. Com o cache de 24 h, palavras repetidas não gastam cota. Quando passar do limite, o app cai no Openverse sem erro.
- **Produção** (1.000 por hora, segundo o formulário do pedido): o pedido é feito pelo usuário no painel do Unsplash, com capturas mostrando o crédito e o registro de download (tarefa de fechamento).

### Medição (R4)

O "depois" passa a ser o Unsplash: uma página com 20 palavras × 9 fotos, no mesmo formato do "antes", para o usuário marcar e para o número final (45,6% → ?) entrar no post. A marcação das variantes do Openverse (`depois.html`) foi abandonada.

## Mudanças no código

| Arquivo | Mudança |
| --- | --- |
| `src/api.js` | `fetchOpenverse` com `category=photograph` e `mature=false`; nova `fetchImagesFor(queries)`: até 2 consultas em paralelo, junta sem repetir (contexto primeiro), limite de 12; Wikimedia só se todas falharem ou vierem vazias; marca `limited: true` quando houver 429 |
| `src/imageQuery.js` | Novo (tabela acima) |
| `src/components/Search.jsx` | Imagens esperam a definição (até 2 s, `Promise.race`); aviso de palavra abstrata (`Notice`); campo "Refinar imagens" (`SearchField` + `Button`) com sugestões (`Button` compacto); botão "Esconder" em cada imagem |
| `src/storage.js` | `migrate()` cria `hiddenImages: { [palavra]: [idDaImagem] }` (R1.3), com teste |
| `src/App.jsx` | Ação `hideImage(word, imageId)` |

### "Esconder" na grade (R1.3, D3)

Cada imagem já é um botão (selecionar). O "Esconder" fica como `IconButton` do BEDS (ícone X, rótulo "Esconder imagem") **ao lado** dele, num contêiner do app, nunca dentro do outro botão, e aparece em foco, em hover e sempre no celular.
Esconder tira a imagem da seleção e da grade e grava em `hiddenImages`; as próximas buscas da mesma palavra não mostram mais aquela imagem.

### "Refinar imagens" (R3)

Fica abaixo da grade: sugestões prontas (ex.: "person studying", "studying desk", "student library") e um campo livre. Refinar troca só as imagens; definição, tradução e o que já estava salvo continuam iguais. Uma palavra já salva mantém as imagens escolhidas no topo, como hoje.

## Medição (R4): `bench/images/`

| Arquivo | Papel |
| --- | --- |
| `bench/images/words.json` | 20 palavras fixas: 5 substantivos concretos (sun, river, blanket, bridge, apple), 5 verbos (study, climb, whisper, cook, swim), 4 adjetivos (stubborn, tired, crowded, shiny), 2 substantivos abstratos (freedom, knowledge), 2 palavras gramaticais (however, although) e 2 ambíguas (bat, spring) |
| `bench/images/run.mjs` | Para cada variante (`antes`, `class`, `definition`, `both`) busca as 9 primeiras imagens de cada palavra, usando as mesmas funções do app, e gera uma página HTML local |
| `bench/images/out/` | Páginas geradas (fora do git) |
| `specs/003-imagens-certeiras/medicao.md` | Resultados: certeiras por palavra e total, por variante |

- A variante `antes` reproduz a lógica atual (palavra solta, qualquer categoria, completada com Wikimedia), para a comparação ser justa.
- A página mostra as 9 imagens de cada palavra **sem título**, com uma caixa por imagem. Você marca as certeiras, e um botão copia o resultado (JSON) para colar no `medicao.md`. O julgamento é humano (R4.2); Claude pode fazer uma primeira passada, mas a nota que vale é a sua.
- Limite: 20 palavras × 4 variantes × até 2 consultas são cerca de 140 requisições. O script espera 3,5 s entre chamadas, guarda cache em disco e pode rodar uma variante por dia se o limite diário apertar.
- A medição usa o mesmo IP do seu navegador, então medir e usar o app no mesmo dia dividem as 200 requisições.

## Rastreabilidade

| Requisito | Onde |
| --- | --- |
| R1.1–R1.2 | `src/api.js` (`category=photograph`, Wikimedia só em falha) |
| R1.3 | `hiddenImages`, botão "Esconder" |
| R2.1–R2.4 | `src/imageQuery.js`, `fetchImagesFor` |
| R2.5 | Espera máxima de 2 s pela definição; consultas em paralelo |
| R3.1–R3.3 | Campo "Refinar imagens" em `Search.jsx` |
| R4.1–R4.4 | `bench/images/`, `medicao.md` |
| R5.1 | `isAbstract` + `Notice` |

## Verificação planejada

- Testes de `imageQuery.js`: gerúndio (casos regulares e irregulares comuns), palavras da definição, classe, abstratas, cada variante.
- Teste da migração (`hiddenImages`).
- Medição `antes` e depois; o total precisa subir, e nenhuma das 20 palavras pode mostrar conteúdo impróprio (R4.4).
- Navegador: "study" mostra pessoas estudando; "however" mostra o aviso; refinar troca só as imagens; esconder some e não volta; claro, escuro e 375 px.
- `npm test`, `npm run build`, `npm run check:ui`.

## Riscos

| Risco | Plano |
| --- | --- |
| Limite de 200/dia apertar para quem usa muito | 2 consultas por busca; aviso no 429; se a medição mostrar ganho grande, rever a D4 (fonte com chave) com números |
| Regras de gerúndio e palavras da definição erram em casos raros | O "Refinar" cobre; a medição mostra onde erram |
| Openverse ficar lento (já aconteceu) | Timeout de 5 s mantido; consultas em paralelo; Wikimedia em falha |

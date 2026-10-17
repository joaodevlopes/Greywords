# 003 — Imagens mais certeiras na busca: tarefas

Status: implementado (2026-10-17), com o Worker publicado

Uma tarefa por vez, nesta ordem. Cada uma termina com `npm test` e `npm run build` passando; as de interface também com `npm run check:ui` (0 violações).
A medição do "antes" (T2) vem **antes** de mexer no app, para a comparação ser justa (R4.3).

## Parte 1 — Base e medição do "antes"

- [x] **T1 — Consultas em `src/imageQuery.js`**: `primaryPos`, `isAbstract`, `toGerund`, `definitionWords`, `buildQueries` (variantes `class`, `definition`, `both`) e `refineSuggestions`. Ainda sem uso no app.
  *Pronto quando:* testes cobrem gerúndio (study, make, run, die, see, visit), palavras da definição de "sun" e "study", cada classe, palavras abstratas e as três variantes. — R2.1, R2.2, R3.1, R5.1

- [x] **T2 — Medição do "antes" (`bench/images/`)**: `words.json` (20 palavras), `run.mjs` com cache e espera de 3,5 s entre chamadas, página HTML sem títulos e com caixas para marcar as certeiras; `bench/images/out/` no `.gitignore`. Para funcionar no Node, a limpeza de HTML do Wiktionary em `src/api.js` ganha uma alternativa sem `DOMParser`.
  Rodar a variante `antes` (lógica atual) → **você marca as certeiras** → resultado no `medicao.md`.
  *Pronto quando:* `medicao.md` tem o "antes" por palavra e o total, e anota se apareceu conteúdo impróprio (e em qual palavra). — R4.1, R4.2, R4.3
  *Feito (2026-10-17):* "antes" = 82/180 certeiras (45,6%), detalhe no medicao.md. Nenhuma imagem imprópria (o símbolo de alerta foi usado para "errada"; confirmado na marcação).

## Parte 2 — App

- [x] **T3 — Busca de imagens em `src/api.js`**: Openverse com `category=photograph`; `fetchImagesFor(queries)` com até 2 consultas em paralelo, junta sem repetir (contexto primeiro), no máximo 12; Wikimedia só se todas falharem ou vierem vazias; marca `limited` quando houver 429.
  *Pronto quando:* testes com `fetch` simulado cobrem junção sem repetição, ordem, Wikimedia só em falha/vazio, 429 e timeout. — R1.1, R1.2, R2.3, R2.4
  *Feito (2026-10-17):*
  - `fetchImagesFor(queries, n)` devolve `{ images, limited, source }`. Faz no máximo 2 consultas, sem repetir consulta igual. Se tudo der errado no Openverse, usa o Wikimedia com a palavra sozinha (a última consulta). Só lança erro quando nada pôde ser buscado.
  - O `fetchImages` antigo ficou igual, para a medição do "antes" continuar reproduzindo a lógica original; o app passa a usar a função nova na T4.
  - 8 testes em `src/api.test.js` com `fetch` simulado: fotos e filtro adulto na URL, 2 consultas no máximo, junção sem repetir e na ordem, limite de n, Wikimedia em falha e em vazio, 429 com `limited`, timeout e falha total.
  - **Chamada real** (`person studying` + `study`): 12 imagens do Openverse, sem repetição, em cerca de 0,9 s.
  - **Sinal para a T7:** pelos títulos, as primeiras fotos de "person studying" não eram de gente estudando ("Tree cookies used to study climate…", "A long night"). Parece que a busca do Openverse casa palavras soltas. A medição vai dizer se a consulta com contexto ajuda.

- [x] **T4 — Busca com contexto em `Search.jsx`**: imagens esperam a definição por até 2 s e usam `buildQueries`; aviso de palavra abstrata com só 3 imagens; aviso curto quando `limited`.
  *Pronto quando:* "study" mostra pessoas estudando; "however" mostra o aviso; com a definição demorando (simulada), as imagens vêm pela palavra sozinha depois de 2 s; as imagens não trocam enquanto se escolhe. — R2.1, R2.2, R2.4, R2.5, R5.1
  *Feito (2026-10-17), conferido com as APIs reais em Edge headless, com registro das chamadas:*
  - ✅ "study": consultas "person studying examination" + "study", ambas com `category=photograph`; 12 imagens em cerca de 2,4 s.
  - ✅ "however": aviso "Aqui o que ensina é o contexto" e só 3 imagens (`page_size=3`).
  - ✅ Os dois dicionários atrasados 3,5 s de propósito: imagens pela palavra sozinha ("climb") em 2,1 s. Quando a definição chega depois, as imagens não trocam.
  - ✅ Só o dictionaryapi.dev lento: o Wiktionary responde, e a consulta com contexto acontece ("person climbing slope").
  - ✅ Aviso de limite (`limited`) mostrado quando o Openverse responde 429. Coberto só pelo teste da T3, porque não dá para provocar o 429 de verdade sem gastar a cota.
  - ❌ **"study mostra pessoas estudando": não atingido.** Das 12 fotos, 1 mostra gente estudando; as 3 escolhidas automaticamente eram microscopia, pintura e museu. O mecanismo funciona, mas o ranking do Openverse para "person studying examination" é fraco. Fica para a T7: medir as variantes; se não melhorar, parar e conversar, como já prevê a T7.
  - Correção encontrada no caminho: definição com pedido em paralelo, porque o dictionaryapi.dev estava fora do ar e travava o contexto. Ver "Ajuste feito na T4" no design.md; 4 testes novos.
  - Testes: `orTimeout` (3) e `fetchDefinition` em paralelo (4). 150 testes no total.

- [x] **T5 — "Refinar imagens"**: sugestões prontas e campo livre abaixo da grade; refinar troca só as imagens.
  *Pronto quando:* tocar numa sugestão troca a grade; definição, tradução e imagens já salvas continuam; cada refinamento faz uma requisição só. — R3.1, R3.2, R3.3
  *Feito (2026-10-17), conferido com as APIs reais em Edge headless:*
  - Abaixo da grade: título ("Imagens fora do tema? Refine a busca:" ou "Mostrando imagens de X"), de 2 a 4 sugestões de `refineSuggestions` (para "study": person studying, people studying, study examination, study review) e um campo livre com o botão "Refinar".
  - ✅ Uma sugestão e um texto livre fizeram **1 requisição cada** ao Openverse, sem pedir de novo a definição nem a tradução; o painel da palavra ficou igual.
  - ✅ As imagens que a pessoa escolheu (ou as já salvas) ficam no topo, na ordem da escolha, e as novas vêm depois (`mergeRefined`, 2 testes).
    - **Decisão:** as 3 escolhas *automáticas* da busca não contam como escolha. Ao refinar, elas são trocadas pelas 3 primeiras novas, senão as imagens ruins da primeira busca ficariam presas no topo.
  - ✅ Um refinamento sem resultado mostra o aviso "Nenhuma imagem nova para X".
  - O campo livre não recebe o texto da sugestão; o título já diz o que está sendo mostrado. Antes, o que a pessoa digitava se misturava com a sugestão.
  - Salvar continua igual (R3.3): grava as escolhidas, venham de qual busca vierem.

- [x] **T6 — "Esconder" imagem**: `IconButton` ao lado de cada imagem (não dentro do botão de seleção); `hiddenImages` no `migrate()` com teste; ação `hideImage` no `App.jsx`.
  *Pronto quando:* esconder tira a imagem da grade e da seleção; buscar de novo a mesma palavra não traz ela; funciona no teclado e no celular. — R1.3
  *Feito (2026-10-17), conferido em Edge headless com teclado real:*
  - Cada imagem fica dentro de um `gw-tile-wrap`: o botão de escolher e, ao lado (não dentro), o `IconButton` do BEDS "Esconder esta imagem" (ícone X).
    - O X aparece no hover e no foco do teclado; em tela de toque (`hover: none`), fica sempre visível.
  - ✅ **Teclado:** Tab chega ao X depois da imagem; Enter tira a imagem da grade (12 → 11) e da seleção (3/3 → 2/3). O foco vai para a imagem que ocupa o lugar.
  - ✅ **Dados:** grava `hiddenImages: { sun: ['wm:164118114'] }`. Buscar outra palavra e voltar para "sun" não traz a imagem (11 imagens).
  - ✅ **375 px com toque:** o X fica visível sem hover, e o mesmo fluxo funciona.
  - `migrate()` cria `hiddenImages: {}` e descarta entradas malformadas (3 testes). Os testes de formato completo do estado e os dados de exemplo foram atualizados. 155 testes.
  - As imagens escondidas também ficam fora dos resultados do "Refinar".

## Parte 3 — Unsplash como fonte principal (alteração aprovada em 2026-10-17)

- [x] ~~**T7 — Medição das variantes do Openverse**~~: **cancelada.** A coleta foi feita e a página única gerada (`depois.html`), mas a comparação com o Unsplash mostrou que o problema era a fonte, não a consulta. Ver "Alteração de 2026-10-17" nos requisitos.

- [x] **T7a — Intermediário de imagens**: `server/images.js` com funções puras.
  - O que ele faz: monta a busca no Unsplash, enxuga a resposta, monta os links de crédito com `utm` e valida o id do registro de uso.
  - Testes com `fetch` simulado.
  - Plugin do Vite para `/api/images/*` no `npm run dev`, lendo `UNSPLASH_ACCESS_KEY` do `.env.local`.
  - Worker do Cloudflare em `worker/` (o mesmo módulo, com cache de 24 h) e `wrangler.toml`.
  *Pronto quando:* os testes cobrem o formato devolvido, o 429 (vira `limited`), a falha, o id inválido no `/download` e os links de crédito; no `npm run dev`, `/api/images/search?q=study` devolve fotos; a chave não aparece em nenhum arquivo de `dist/` depois do `npm run build`. — R1.5, R1.6
  *Feito (2026-10-17):*
  - `server/images.js`: `withUtm`, `searchUrl` (com `content_filter=high` e no máximo 12), `trimPhoto`, `isPhotoId` e `handle(path, params, { key, fetchImpl })`.
    - Um 429 vira `{ images: [], limited: true }`; outras falhas viram 502, que nunca vai para o cache.
    - A chave vai no cabeçalho, nunca na URL.
  - **Dev:** plugin `greywords-images-api` no `vite.config.js`, só no `npm run dev`. Lê a chave do `.env.local` pelo `loadEnv`, sem prefixo `VITE_`, e guarda buscas em memória por 24 h. Conferido com chamada real: `/api/images/search?q=study&n=3` devolveu 3 fotos com crédito; `/download?id=../x` devolveu 400.
  - **Produção:** `worker/index.js` (cache de 24 h na borda, CORS com `ALLOWED_ORIGINS`) e `wrangler.toml`.
  - **Testes:** 9 em `server/images.test.js` e 3 em `worker/index.test.js` (runtime simulado: CORS, preflight, cache com 1 chamada ao Unsplash por palavra, origem restrita). O `npm test` passou a incluir `server/` e `worker/`; 172 testes.
  - Conferido: a chave (43 caracteres) não aparece em nenhum arquivo do `dist/`.
  - O Worker real só roda na T9a, que pede a conta do Cloudflare.

- [x] **T8a — App usando o Unsplash**:
  - `fetchImagesFor` pede ao intermediário a palavra sozinha (1 requisição); com falha, `limited` ou zero fotos, cai no Openverse como hoje. "Refinar" faz 1 requisição ao intermediário.
  - Sem `VITE_IMAGES_API` no build, o app usa só o Openverse.
  - Crédito na grade (título), na legenda ("Fotos: Unsplash") e no detalhe da palavra salva, com os links.
  - Registro de uso ao salvar.
  - Campos opcionais `source` e `creditLink` nas imagens salvas.
  *Pronto quando:* "study" mostra gente estudando; o intermediário desligado (simulado) não quebra nada e mostra fotos do Openverse; salvar chama o `/download` uma vez por foto nova do Unsplash; o crédito aparece nos três lugares; esconder e refinar continuam funcionando. — R1.4, R1.6, R1.7
  *Feito (2026-10-17), conferido em Edge headless com o servidor real:*
  - ✅ **"study":** 1 chamada (`/api/images/search?q=study`), 12 fotos do Unsplash de gente estudando, nenhuma chamada ao Openverse. É o critério que tinha falhado na T4.
  - ✅ **Crédito:** título de cada foto ("Foto de Unseen Studio no Unsplash"), legenda "Fotos: Unsplash" com link `utm`, e no detalhe do dicionário "Foto de X · Foto de Y … no Unsplash" com 4 links `utm`.
  - ✅ **Salvar:** 3 chamadas a `/download`, uma por foto nova do Unsplash. As imagens salvas guardam `source: 'unsplash'` e `creditLink`.
  - ✅ **Intermediário fora do ar (simulado):** cai no Openverse (com contexto e a palavra), 12 imagens, sem erro e sem `/download`.
  - ✅ **Refinar:** 1 chamada ao Unsplash por refinamento, e as escolhas continuam no topo. **Esconder:** igual a antes.
  - Sem `VITE_IMAGES_API` no build de produção, o app vai direto ao Openverse (teste). No dev o intermediário é `/api/images`.
  - `imageCredit` (2 testes) e 5 testes do caminho Unsplash/reserva/registro de uso; 179 testes no total.

- [x] **T9a — Publicar o intermediário**:
  - **O usuário:** cria a conta grátis no Cloudflare, roda `npx wrangler login` e guarda a chave como segredo (`npx wrangler secret put UNSPLASH_ACCESS_KEY`).
  - **Claude:** faz o deploy, coloca o endereço no build (`VITE_IMAGES_API`) e testa.
  *Pronto quando:* o build de produção busca no Unsplash pelo Worker; com o Worker fora do ar (simulado), o site usa o Openverse; repetir a mesma busca não gasta cota (cache). — R1.5, R1.7
  *Feito (2026-10-17):*
  - **Conta e segredo:** o usuário criou a conta, fez o `wrangler login`, guardou a chave como segredo e registrou o subdomínio `greywords.workers.dev`.
  - **Worker** `greywords-images` em `https://greywords-images.greywords.workers.dev`, com `ALLOWED_ORIGINS` = endereço do site, `workers_dev = true` e `preview_urls = false`.
  - **Site** em https://greywords.greywords.workers.dev: Worker só com arquivos (`wrangler.site.toml`, `[assets]` de `dist`), e `VITE_IMAGES_API` vem do `.env.production`. O Pages agora faz parte dos Workers: o `wrangler pages project create` publicou, por engano, o código do intermediário como Worker `greywords`, e o deploy do site o substituiu.
  - Comandos: `npm run deploy:images` e `npm run deploy:site` (que faz o build e publica).
  - **Conferido:**
    - `curl` no Worker: 200 com 3 fotos do Unsplash e crédito. `Access-Control-Allow-Origin` sempre é o site, então outra origem não lê pelo navegador.
    - O `dist` não tem a chave nem a página de prévia do dev.
    - No site publicado (Edge headless), a landing carrega as capturas e mostra "8 serviços". "river" traz 12 fotos de `images.unsplash.com` com crédito ao fotógrafo, a definição e frases do Tatoeba com autor. Sem erros no console.
    - Com o Worker bloqueado, o site usa a reserva: 12 imagens e a legenda do Openverse/Wikimedia.
  - **Problema encontrado (resolvido logo depois): o cache não valia em `workers.dev`.** Duas buscas iguais não vieram do cache (as respostas têm horários diferentes). Pela documentação do Cloudflare, a Cache API não tem efeito em `*.workers.dev`, só em domínio próprio. Enquanto isso, cada busca gasta 1 das 50 por hora. **Correção proposta:** guardar as buscas no Workers KV (grátis: 100 mil leituras e mil gravações por dia) por 24 h.
  - **Crédito ajustado para o pedido de produção (2026-10-17):** as regras da API pedem o fotógrafo com link para o perfil sempre que a foto aparece. Na busca, ele só aparecia ao passar o mouse e sem link; na revisão, não aparecia. Agora `UnsplashCredit.jsx` mostra "Fotos de A, B e C no Unsplash" com links e UTM nos três lugares. Conferido no site publicado, com capturas para o pedido.
  - **Cache em KV (2026-10-17):**
    - Namespace `IMAGE_CACHE` ligado no `wrangler.toml`.
    - O Worker guarda cada busca com resultado por 24 h (`expirationTtl`), com a chave `search:<consulta em minúsculas>|<n>`. Nunca guarda erro nem "limited".
    - O CORS é calculado a cada pedido, não vem do cache. O cabeçalho `X-Greywords-Cache` diz `hit` ou `miss`.
    - Se o KV falhar, a busca segue normal. O `caches.default` saiu.
    - 5 testes novos em `worker/index.test.js`: acerto, chave normalizada, erro e "limited" não guardados, sem KV e com KV quebrado, e `/download` fora do cache.
    - **Conferido no Worker publicado:** "lighthouse" 3 vezes deu `miss`, `hit` e `hit`. "Lighthouse " (maiúscula e espaço) também deu `hit`, com as 12 fotos e o crédito. Agora uma palavra já buscada nas últimas 24 h não gasta a cota do Unsplash.

- [x] **T10a — Medição do "depois" (Unsplash)**: variante `unsplash` em `bench/images/run.mjs`, com página de 20 palavras × 9 fotos no formato do "antes" → **o usuário marca as certeiras** → `medicao.md` com antes × depois por palavra e no total.
  *Pronto quando:* o total melhorou em relação ao "antes" (82/180) e nenhuma imagem imprópria apareceu; o número entra no `medicao.md`. — R4.3, R4.4
  *Feito (2026-10-17):* **173/180 certeiras (96,1%) contra 82/180 (45,6%) no antes; 0 impróprias.** As 6 marcadas no botão "Imprópria" foram conferidas e são erradas (ver `medicao.md`). A coleta precisou esperar 1 hora porque a cota de demo do Unsplash, de 50 por hora, acabou com os testes do dia; o intermediário passou a tratar o 403 de limite do Unsplash como `limited`.

- [x] **T11a — Documentação e verificação final**:
  - `CLAUDE.md`: mapa (`server/`, `worker/`), modelo de dados (`hiddenImages`, `source`, `creditLink`), a regra de APIs com a exceção do Unsplash e os comandos.
  - README e `CREDITS.md`: crédito ao Unsplash.
  - Percorrer R1–R5 no navegador (claro, escuro, 375 px) e marcar a spec como `implementado`.
  - Deixar anotado o que o usuário precisa fazer para pedir o modo produção no Unsplash.
  *Pronto quando:* todos os critérios conferidos e listados abaixo, com o que não deu para verificar dito explicitamente.

## Verificação (T11a, 2026-10-17)

Conferido em Edge headless com o servidor real e as APIs reais (`npm run dev` com o intermediário), mais os testes automáticos.

| Critério | Resultado |
| --- | --- |
| R1.1 Openverse só com fotos e filtro adulto | ✅ `category=photograph` e `mature=false` em toda chamada (teste e registro das chamadas) |
| R1.2 Wikimedia só em falha ou vazio | ✅ testes; na reserva com o intermediário fora do ar, nenhuma chamada ao Wikimedia porque o Openverse respondeu |
| R1.3 Esconder imagem | ✅ teclado e toque; some da grade e da seleção e não volta (T6, conferido de novo com o Unsplash) |
| R1.4 Unsplash como fonte principal | ✅ "study": 1 chamada ao intermediário, 12 fotos do Unsplash, nenhuma ao Openverse |
| R1.5 Chave fora do navegador | ✅ a chave (43 caracteres) não aparece em nenhum arquivo de `dist/` nem do repositório; ela vai no cabeçalho, nunca na URL (teste) |
| R1.6 Crédito e registro de uso | ✅ "Foto de X no Unsplash" no título, legenda "Fotos: Unsplash" e créditos com `utm` no detalhe; salvar fez 3 chamadas a `/download` |
| R1.7 Sem intermediário, continua funcionando | ✅ intermediário fora do ar (simulado): 12 imagens do Openverse, sem erro; cota esgotada (403 ou 429) vira `limited` e cai na reserva (teste) |
| R2.1–R2.2 Busca com contexto | ✅ continua na reserva do Openverse ("person studying examination"). No Unsplash, a palavra sozinha bastou (96,1% certeiras) |
| R2.3 Até 2 consultas, juntas sem repetir | ✅ testes |
| R2.4 Palavra sozinha se o contexto falhar | ✅ testes; definição atrasada nos dois dicionários: imagens pela palavra em 2,1 s |
| R2.5 Tempo parecido | ✅ imagens em cerca de 2,4 s no caminho mais lento (espera da definição + Openverse); com o Unsplash, 1 chamada |
| R3.1–R3.3 Refinar | ✅ 2–4 sugestões e campo livre; 1 requisição por refinamento; palavra, definição e tradução continuam; escolhas no topo |
| R4.1–R4.4 Medição | ✅ **82/180 (45,6%) → 173/180 (96,1%)**, 0 impróprias (`medicao.md`) |
| R5.1 Palavras abstratas | ✅ "however": aviso "Aqui o que ensina é o contexto" e 3 imagens |

Landing e documentação atualizadas:
- landing: FAQ, rodapé, diagrama com o Unsplash (8 nós sem sobreposição), "7 serviços", "0 cadastros" (antes dizia "0 servidores", que deixou de ser verdade com o Worker) e gráfico antes × depois com legenda;
- README, `CREDITS.md` e `CLAUDE.md`.

Auditoria da landing (claro no desktop, escuro em 375 px): nenhuma falha de contraste, sem rolagem horizontal, loops pausados fora da tela e foco visível. Testes: 180. `check:ui`: 0 violações. JS: 172,3 KB gzip.

**Não verificado / pendente:**
- **T9a:** o Worker do Cloudflare só foi testado em simulação. Publicar junto com o site; o usuário cria a conta.
- **Modo produção do Unsplash** (grátis, 1.000 por hora): pedir no painel do app depois de publicar o site, com o endereço e capturas mostrando o crédito.
- Safari e Firefox não testados.

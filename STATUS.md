# Greywords — estado do projeto

Atualizado em 2026-10-17. **Leia este arquivo antes de continuar o trabalho.** As regras do projeto estão no [CLAUDE.md](CLAUDE.md); o detalhe de cada feature está em [specs/](specs/README.md).

## Em uma frase

App gratuito (React + Vite, dados só no navegador; um intermediário pequeno guarda a chave do banco de fotos) para aprender vocabulário em inglês **pela imagem**, com revisão espaçada, metas semanais e vídeos do TED por nível. Interface com o design system **BEDS**, marca **Greywords** (greyhound laranja `#e8590c`). Peça de portfólio para o LinkedIn (ângulo de dados).

## Como retomar

```bash
cd C:\Users\joaog\OneDrive\Documentos\englishPlataform
npm install          # se faltar node_modules
npm run dev          # http://localhost:5173   (#/ landing · #/app app)
npm test             # 197 testes de lógica (LIVE_APIS=1 inclui o teste com a API real do Tatoeba)
npm run build
npm run check:ui     # contrato do BEDS: precisa dar 0 violations
```

- Para as fotos do Unsplash no `npm run dev`, é preciso `.env.local` com `UNSPLASH_ACCESS_KEY=...` (já existe na máquina do usuário e está fora do git). Sem ele, o app usa o Openverse.
- Nas sessões, o servidor de desenvolvimento costuma rodar em `npx vite --port 5180 --strictPort`, em segundo plano.
- **Para conferir telas sem o painel do navegador**, que congela animações quando está oculto, use os scripts em Edge headless:
  - `scripts/edge-check.mjs`;
  - `scripts/landing-audit.mjs` (contraste real, CLS, Tab, árvore de acessibilidade);
  - `scripts/app-audit.mjs`;
  - `scripts/capture.mjs` (capturas da landing).
- **Git:** branch `main`. Commits só com o usuário como autor e **sem nenhuma menção a IA** na mensagem: use a skill `git-autoria-unica`, sem `Co-Authored-By`. Mensagens em português, no estilo `feat: ...`.

Fluxo de trabalho: **método de spec** (requisitos → design → tarefas → código, cada etapa aprovada pelo usuário). Para continuar, diga: "lê o STATUS.md e continua a próxima tarefa".

**Como o usuário prefere trabalhar** (aprendido nesta fase):
- Quer ver o resultado funcionando cedo. Se uma solução dá sinais de que não vai dar certo, **pare e diga logo**, em vez de polir. A fonte de imagens (Openverse) custou muito tempo por isso.
- Não quer gastar dinheiro: só serviços gratuitos. Uma chave grátis tudo bem, se ficar protegida.
- Pede orientação passo a passo para tarefas fora do código, como criar contas e chaves.

## Onde paramos (próximos passos, em ordem)

Atualizado em 2026-10-17, depois da T2 da spec 004.

1. **Spec 004 (frases de exemplo), a próxima:** tarefas aprovadas e todas liberadas (a T6 da 003 já saiu). **T1 e T2 feitas** (`src/examples.js`; `fetchExamples` no `api.js`, com 2 chamadas no máximo, busca exata e cache). Próxima: T3 (componente `Examples.jsx`). Aviso: o Tatoeba estava lento (11 a 25 s) no dia; com 6 s de limite, o app cai nos exemplos do dicionário. Quando o Tatoeba entrar, trocar "7 serviços" para 8 na landing (`NUMBERS` em `Landing.jsx`) e incluir o Tatoeba no diagrama.
2. **Spec 005 (efeitos), etapa B:** T12 (animação ao escolher imagem e esqueleto na busca) está liberada. T13 (virar o flashcard) espera a T6 da 004. A T14 fecha a spec.
3. **Publicação do site** (ainda não decidido onde):
   - publicar o Worker (T9a da 003; o usuário cria a conta grátis no Cloudflare);
   - pôr o endereço do Worker no build (`VITE_IMAGES_API`) e em `ALLOWED_ORIGINS`;
   - pedir o modo produção do Unsplash (grátis, cerca de 5.000 buscas por hora), com o endereço do site e capturas do crédito;
   - subir o repositório no GitHub.
4. **Spec 002 (vídeos):** falta a **curadoria manual** (T4, do usuário, com `catalog/SUGESTOES.md` e `catalog/HOW-TO.md`). Depois: `npm run catalog`, calibrar os níveis (T5), tirar "Vídeos do seu nicho" do "O que vem por aí" e verificar com dados reais (T13).

**Feito recentemente:**
- **Spec 003 implementada:** imagens do Unsplash por um intermediário (`server/images.js`: plugin do Vite no dev, Worker do Cloudflare em produção), com crédito, registro de uso e Openverse/Wikimedia de reserva; busca com contexto, "Refinar" e "Esconder". **Medição: 82/180 (45,6%) → 173/180 (96,1%), 0 impróprias.**
- **Spec 005, etapa A (landing) e T10–T11** prontas e verificadas.
- **Git:** repositório criado (branch `main`). Commits só com o usuário como autor, sem menção a IA (skill git-autoria-unica). Ainda não está no GitHub.

## Specs

| Spec | O que é | Estado |
| --- | --- | --- |
| [000-mvp](specs/000-mvp/requirements.md) | Busca por imagem, dicionário, revisão SM-2, landing | implementado |
| [001-calendario-meta](specs/001-calendario-meta/requirements.md) | Aba Progresso: meta semanal, check-in, calendário, sequência | implementado |
| [002-videos-nicho](specs/002-videos-nicho/requirements.md) | Aba Vídeos: talks do TED por nicho e nível, catálogo gerado offline | T1–T3, T6–T11 feitas; T12 quase toda; **faltam T4 (usuário), T5, T13** |
| [003-imagens-certeiras](specs/003-imagens-certeiras/requirements.md) | Imagens pelo significado (Unsplash + reserva), sem conteúdo impróprio, com medição | **implementado** (45,6% → 96,1%); falta só publicar o Worker (T9a) |
| [004-frases-exemplo](specs/004-frases-exemplo/requirements.md) | Frases reais do Tatoeba na busca e revisão com lacuna | tarefas aprovadas; **próxima spec**, todas as tarefas liberadas |
| [005-identidade-efeitos](specs/005-identidade-efeitos/requirements.md) | Paleta própria, landing mais informativa, efeitos inspirados no 21st.dev | etapa A pronta; etapa B: T10–T11 feitas; T12 liberada; T13 espera a T6 da 004; T14 fecha |

## O que existe hoje no app

- **Landing** (`#/`): proposta, demo interativa com ilustrações SVG próprias, passos, diferenciais, roadmap, FAQ, créditos.
- **Busca**: fotos do Unsplash (Openverse e Wikimedia de reserva), "Refinar" e "Esconder", definição (dictionaryapi.dev → Wiktionary), pronúncia, tradução escondida (MyMemory), escolher até 3 imagens.
- **Palavras** (dicionário): lista, filtro, ordem, detalhe em diálogo, remover com confirmação, exportar JSON.
- **Revisão**: flashcard com as imagens, palpite opcional, notas 1–4, SM-2 com ajustes estilo Anki.
- **Vídeos**: escolha de nichos e nível, filtros, player do YouTube (sem cookies) com talks do canal TED, "assistido" conta no Progresso, palavras-chave abrem a busca. Sem catálogo real ainda: em `npm run dev` usa um catálogo de exemplo (números fictícios); no site publicado mostra "Vídeos em preparação".
- **Progresso**: meta semanal, semana atual, semanas seguidas, check-in "Estudei hoje", calendário do mês, métricas das palavras.
- Tema claro/escuro, funciona em 375 px.

## Decisões importantes (e por quê)

- **TED: nunca acessar o TED.com por script.** Os Termos de Uso (seção 6.4) proíbem coleta automatizada. A curadoria é manual; as transcrições ficam em `catalog/transcripts/` (fora do git) e o catálogo publicado leva só números e até 8 palavras soltas por talk.
- **Player dos vídeos**: YouTube no modo sem cookies, tocando o vídeo do canal oficial do TED (conferido pelo oEmbed público do YouTube, que não pede chave).
- **NGSL** (lista de palavras comuns, CC BY-SA 4.0) em `catalog/ngsl/`, usada para medir a dificuldade das transcrições.
- **Fotos: Unsplash** (spec 003). O Openverse trazia fotos fora do tema (1 em 12 para "study"), e nenhuma consulta resolveu.
  - Alternativas descartadas: o Pexels pausou chaves novas; o Pixabay desaconselha usar o link deles de forma permanente.
  - **Cota do Unsplash:** o modo demo dá **50 buscas por hora para o app inteiro**. O modo produção é **grátis** (cerca de 5.000 por hora) e se pede no painel depois de publicar o site.
  - Quando a cota acaba, o app cai no Openverse sem erro.
  - **Cuidado nos testes:** cada busca real gasta cota; o intermediário do dev guarda buscas em memória por 24 h.
- **Intermediário de imagens** (`server/images.js`): a chave nunca vai para o navegador. No dev é um plugin do Vite em `/api/images`; em produção, um Worker do Cloudflare (`worker/`, `wrangler.toml`), ainda **não publicado**. O app usa `VITE_IMAGES_API` no build; sem ele, só o Openverse.
- **Openverse sem chave** (agora reserva): 20 requisições/min e 200/dia por IP; até 2 consultas por busca, só fotos.
- **Tatoeba** (spec 004): a API `api.tatoeba.org/unstable` funciona no navegador, sem chave; usar `trans:lang=por&showtrans=matching` (~9 KB); `showtrans=all` pesa ~105 KB.
- **Medição das imagens** (spec 003): "antes" (Openverse + Wikimedia) = **82/180 certeiras (45,6%)**; "depois" (Unsplash) = **173/180 (96,1%)**; 0 impróprias nas duas. O usuário usa o botão "Imprópria" para marcar as erradas: confira as imagens antes de registrar.
- **21st.dev** (spec 005): componentes vêm em Tailwind + lucide, que o `check:ui` proíbe em `src/`. Cada efeito é reescrito em CSS `gw-*` + `motion/react` (já instalado pelo BEDS). Código só de componente MIT, com crédito em `CREDITS.md`. Licença conferida na página `https://21st.dev/<autor>/components/<nome>.md`. O `motion` já vai no pacote final pelo BEDS, e o `Metric` do BEDS já anima números (`numericValue` + `formatValue`).
- **Contraste do laranja**: `#e8590c` dá 3,3:1 no creme e 3,6:1 com texto branco, o que reprova para texto pequeno. Para texto e para o CTA, usar `--gw-brand-ink` (`#b4430a` no claro, `#ff8a4c` no escuro).
- **Build hoje**: JS 172,3 KB gzip. O orçamento da spec 005 é de até 217 KB; a linha de base era 157,4 KB.
- Nenhuma API paga. Só o Unsplash pede chave (exceção aprovada, protegida pelo intermediário). Nada de depoimentos ou números inventados na landing. A landing hoje diz "7 serviços"; passa a 8 quando o Tatoeba entrar.

## Armadilhas já encontradas

- **Crases dentro de strings no shell** (`node -e "..."` com texto em markdown) executam comandos e apagam trechos. Para editar textos com crases, use a ferramenta de edição ou um script `.mjs` salvo em arquivo.
- O **painel de visualização** do app Claude ficou preso à pasta temporária antiga. Se o preview mostrar código velho, rode o servidor pelo terminal (`npx vite --port 5180`) e abra a URL no painel.
- O Vite guarda em cache um erro de import quando um arquivo é criado depois de ser importado: um `touch` no arquivo resolve.
- Ao importar uma dependência nova pela primeira vez, o Vite reotimiza os pacotes, e a página aberta pode mostrar "Invalid hook call" (duas cópias do React). Basta recarregar a página: numa aba nova o erro some.
- O painel do app não emula `prefers-reduced-motion`, e as abas de fundo dele não ficam com `document.hidden`.
- Com o painel **oculto** ou a sessão fora da tela, o painel congela as animações (`innerWidth` fica 0 e tudo parece preso em opacidade 0). Isso não é bug do app.
- Para conferir efeitos sem depender do painel, use `scripts/edge-check.mjs`: Edge headless via CDP, com os modos `reduced` (emula movimento reduzido), `mobile` (375 px) e `hover` (mouse real), mais `SHOT=arquivo.png` para salvar uma captura.
- **Dois `whileInView` aninhados do motion** (um título animado dentro de um `Reveal`) deixavam tudo preso; o título agora usa `inherit`. Pode ter sido efeito do painel oculto, mas a herança é mais simples de qualquer jeito.
- O `.claude/launch.json` tem barras invertidas sem escape no caminho (JSON inválido). Usar `npx vite --port 5180`; muitas vezes já há um servidor do projeto rodando nessa porta.
- **Unsplash no limite responde 403** ("Rate Limit Exceeded", `X-Ratelimit-Remaining: 0`), não só 429. O intermediário trata os dois como `limited`.
- **dictionaryapi.dev pode ficar fora do ar** (em 2026-10-17 todas as chamadas paravam no limite de tempo). O app pede ao Wiktionary depois de 1,2 s.
- No Edge headless, foco por código não vale enquanto a janela não tem foco. Para digitar, clique com `Input.dispatchMouseEvent`; para o Enter, mande `text: String.fromCharCode(13)` (sem esse texto o formulário não envia).
- Às vezes o Edge headless não abre na primeira tentativa ("Edge did not open a page target"): é só rodar de novo.
- **Heredoc do bash com crases, `${...}` ou regex** quebra ("unexpected EOF") ou corrompe o texto. Crie o script com a ferramenta de escrita (Write) e rode `node arquivo.mjs`.
- Em `String.replace`, `$'` e `$&` no texto novo são padrões especiais: use uma função, `s.replace(a, () => b)`.
- O `.env.local` do usuário tem o valor **entre aspas**; os leitores aceitam os dois formatos.
- **Tatoeba lento:** em 2026-10-17 levava de 11 a 25 s por chamada. O app usa 6 s de limite e cai nos exemplos do dicionário. O teste com a API real só roda com `LIVE_APIS=1`.
- **Marcação de imagens pelo usuário:** ele usa o botão "Imprópria" para as erradas. Antes de registrar "impróprias", olhe as imagens.
- O `localStorage` é separado por porta: dados de teste em `:5180` não aparecem em `:5173`.

## Mapa rápido de arquivos novos (o mapa completo está no CLAUDE.md)

- `src/imageQuery.js` (+ teste): consultas de imagem com contexto, `mergeRefined`, `imageCredit` (spec 003).
- `src/examples.js` (+ teste) e `fetchExamples` no `src/api.js` (+ `api.examples.test.js`): frases de exemplo (spec 004).
- `server/images.js`, `worker/`, `wrangler.toml`, plugin no `vite.config.js`: intermediário de fotos (spec 003).
- `bench/images/`: medição das imagens (`node bench/images/run.mjs antes|unsplash`, `stock.mjs`); saída e cache fora do git.
- `specs/003-imagens-certeiras/medicao.md`: resultados da medição.
- `catalog/`: pipeline offline dos vídeos (`npm run catalog:check`, `npm run catalog`), `SUGESTOES.md` com 42 talks sugeridos.
- `src/dev/catalog.sample.json`: catálogo de exemplo, só no modo dev.

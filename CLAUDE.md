# Greywords — contexto do projeto

> **Antes de qualquer trabalho, leia o [STATUS.md](STATUS.md)**: onde paramos, próximos passos, decisões e armadilhas já encontradas. Atualize-o ao terminar cada tarefa.

Plataforma gratuita para aprender vocabulário em inglês **pela imagem, não pela tradução**, com repetição espaçada.
Projeto pessoal e peça de portfólio (área de dados → post no LinkedIn). Interface em português (pt-BR).

## Como trabalhamos: método de spec

Toda feature nova passa por `specs/` **antes** de qualquer código. Leia [specs/README.md](specs/README.md).

1. `requirements.md` → o usuário aprova
2. `design.md` → o usuário aprova
3. `tasks.md` → implementar uma tarefa por vez, marcando `[x]`
4. Verificar cada critério de aceite no navegador antes de dar a feature como pronta

Não pular etapa sem o usuário pedir. Correção pequena (bug, texto) não precisa de spec.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173  (#/ = landing, #/app = app)
npm run build
npm test           # testes de lógica (node --test): src/, server/, worker/, catalog/
npm run check:ui   # contrato do design system BEDS (precisa dar 0 violations)
npm run catalog:check  # valida a curadoria de vídeos (catalog/sources.json + transcrições)
npm run catalog        # gera public/catalog.json (ver catalog/HOW-TO.md)
```

## Stack e regras

- React 19 + Vite, JavaScript (sem TypeScript no app), sem backend.
- Dados no `localStorage` do navegador (chave `greywords:v1`; lê `lexi:v1` como legado).
- **Design system BEDS** (`beds`, release `0.2.0-rc.2`, instalado pela URL do tarball da release):
  - Usar componentes do BEDS para controles (Button, TextField, SearchField, Select, Tabs, SegmentedControl, Dialog, Metric, Badge, EmptyState, Notice, ProgressBar, Surface…).
  - Layout, páginas e identidade são do app: CSS próprio com prefixo `gw-`, lendo tokens `--es-*`.
  - Proibido: estilizar classes `.es-*`, redefinir `--es-*`, passar `className`/`style` para componentes do BEDS.
  - Rodar `npm run check:ui` depois de mexer em UI.
- Marca: laranja `#e8590c` (`brandColor` do provider) e o greyhound em `src/brand/GreyhoundMark.jsx`
  (cópia em `public/favicon.svg` — manter os dois iguais).
- Paleta do app: tokens `--gw-*` em `src/brand/palette.css` (claro e escuro), conferidos por `src/brand/palette.test.js`
  (contraste AA). Texto em laranja usa `--gw-brand-ink`, nunca `#e8590c` (reprova para texto pequeno). Títulos em `--gw-font-display` (Fraunces).
- APIs só gratuitas e sem chave, sempre com timeout e reserva (ver `src/api.js`). **Exceção aprovada:** Unsplash (imagens), com chave só no intermediário (`server/images.js`), nunca no navegador. Chave em `.env.local` (fora do git) no dev; segredo do Worker em produção.
- Landing honesta: sem depoimento, número de usuários ou promessa de resultado inventados.
- Conteúdo do TED: **nunca** acessar o TED.com por script (Termos de Uso, seção 6.4); curadoria é manual e transcrições não vão para o git nem para o catálogo.

## Mapa do código

| Arquivo | O que faz |
| --- | --- |
| `src/Root.jsx` | Provider do BEDS, tema claro/escuro, rota por hash (`#/` landing, `#/app` app) |
| `src/landing/` | Landing page (`Landing.jsx`), demo interativa (`ProductDemo.jsx`), ilustrações SVG (`Scenes.jsx`) |
| `src/fx/` | Efeitos (spec 005): `Reveal.jsx` (aparecer ao rolar), `TextEffect.jsx` (palavra por palavra), `WordRotate.jsx`, `BorderBeam.jsx`, `Marquee.jsx` (com botão de pausa), `NumberTicker.jsx`, `DotPattern.jsx`, `SpotlightCard.jsx`, `BrowserFrame.jsx`, `AnimatedBeam.jsx`, `TabTransition.jsx` (troca de abas do app), `CountingMetric.jsx` (Metric do BEDS que conta ao aparecer), `celebrate.js` (confete, `canvas-confetti`), `number.js` (testado), `useOnScreen.js` (pausa loops fora da tela/aba oculta via `data-fx-paused` + `.gw-fx-loop`), `variants.js` (testado), `fx.css`. Crédito de cada efeito no topo do arquivo e em `CREDITS.md` |
| `public/landing/` | Capturas WebP do app (claro/escuro) mostradas na seção "Por dentro do app" da landing |
| `scripts/capture.mjs` | Capturas da landing (`public/landing/*.webp`): Edge headless + dados de `src/dev/demoState.js` (fora do build) + `sharp`. Refazer quando a tela do app mudar |
| `scripts/landing-audit.mjs` | Auditoria completa da landing (contraste real, CLS, Tab, árvore de acessibilidade, loops) em Edge headless |
| `scripts/app-audit.mjs` | Auditoria do app com dados de exemplo (contraste por aba, transição, métricas) em Edge headless |
| `scripts/edge-check.mjs` | Confere a página em Edge headless via CDP (`reduced`, `mobile`, `hover`, `SHOT=`); use quando o painel do navegador estiver oculto |
| `server/images.js` | Intermediário de imagens (Unsplash): busca, crédito com `utm`, registro de download; usado pelo plugin do Vite (`/api/images` no `npm run dev`) e pelo Worker |
| `worker/` + `wrangler.toml` | Worker do Cloudflare que publica o intermediário (cache de 24 h, CORS) |
| `src/brand/palette.css` | Tokens `--gw-*` da paleta (claro/escuro); `contrast.js` + teste conferem AA |
| `src/App.jsx` | Shell do app: abas Busca / Palavras / Revisão / Vídeos / Progresso, estado e persistência |
| `src/components/Search.jsx` | Busca: imagens com contexto (espera a definição até 2 s), definição + tradução, escolha de até 3 imagens, "Refinar imagens", "Esconder" imagem, frases de exemplo (no painel; palavra abstrata: no lugar da grade, com "Ver imagens mesmo assim"), salvar com até 2 frases |
| `src/components/Dictionary.jsx` | Lista de palavras, aviso de revisão, filtro/ordem, detalhe em Dialog, exportar JSON |
| `src/components/Review.jsx` | Sessão de revisão com flashcard, palpite opcional, notas 1–4 |
| `src/components/Progress.jsx` | Aba Progresso: meta semanal, semana atual, sequência, check-in de hoje |
| `src/components/MonthCalendar.jsx` | Calendário do mês (do app, sem equivalente no BEDS) |
| `src/components/WordMetrics.jsx` | Métricas das palavras (total, para revisar, aprendendo, dominadas, acerto) |
| `src/progress.js` | Datas em hora local, metas, resumo da semana, sequência (funções puras, testadas) |
| `src/components/Videos.jsx` | Aba Vídeos: carrega `catalog.json`, filtros, estados; `VideoSetup`, `VideoCard`, `VideoDialog` |
| `src/examples.js` | Frases de exemplo (spec 004): formas da palavra, escolha das frases, destaque, lacuna, escolha de até 2 (`togglePicked`) e crédito (`exampleCredit`) (funções puras, testadas) |
| `src/components/Examples.jsx` | Lista de frases de exemplo (spec 004): palavra destacada, "Ver tradução", "Ouvir", crédito; modo de escolha (até 2) com `onTogglePick`. Prévia no dev em `#/dev/examples` (`src/dev/ExamplesPreview.jsx`, fora do build) |
| `src/imageQuery.js` | Consultas de imagem com contexto: classe gramatical, palavras da definição, gerúndio (spec 003) |
| `bench/images/` | Medição de relevância das imagens (`node bench/images/run.mjs antes|unsplash|...`, `stock.mjs` compara bancos lado a lado); resultados em `specs/003-imagens-certeiras/medicao.md` (antes 82/180, Unsplash 173/180) |
| `src/videos.js` | Ordenação por nível, filtros, duração, palavras-chave novas (funções puras, testadas) |
| `src/dev/catalog.sample.json` | Catálogo de exemplo, só em `npm run dev` enquanto não existe `public/catalog.json` (fora do build) |
| `catalog/` | Pipeline offline do catálogo: `text.mjs` (métricas e nível), `sources.mjs` (validação), `catalog.mjs` (montagem), `build.mjs` / `check.mjs` (CLI), `ngsl/` (lista NGSL, CC BY-SA) |
| `src/components/WordInfo.jsx` | Bloco de palavra: pronúncia, definições, tradução escondida |
| `src/srs.js` | Algoritmo de revisão espaçada (SM-2 com ajustes estilo Anki) |
| `src/api.js` | `fetchImagesFor` (Openverse só fotos, até 2 consultas; Wikimedia só em falha; `limited` no 429), `fetchDefinition` (dictionaryapi.dev, com Wiktionary em paralelo após 1,2 s), MyMemory (tradução), `fetchExamples` (Tatoeba, `word_count=4-12`, 6 s, cache na sessão), `orTimeout`. `fetchImages` antigo fica só para a medição do "antes" |
| `src/storage.js` | Carregar/salvar/exportar estado; `migrate()` atualiza dados antigos |
| `src/*.test.js` | Testes de lógica (`npm test`) |

## Modelo de dados (`localStorage["greywords:v1"]`)

```js
{
  words: {
    [palavra]: {
      key, word, phonetic, audio,
      meanings: [{ pos, definition, example }],
      translation: { main, alts } | null,
      images: [{ id, thumb, title, credit, link, source?, creditLink? }], // até 3; source = unsplash | openverse | wikimedia
      addedAt,                                          // timestamp ms
      srs: { ease, interval, reps, lapses, due },       // due = timestamp ms
    },
  },
  log: [{ t, word, q }],   // uma linha por revisão; q = 1 errei, 3 difícil, 4 bom, 5 fácil
  goals: [{ from, days }], // meta semanal; from = segunda-feira (YYYY-MM-DD) em que passou a valer
  activityDays: ['YYYY-MM-DD'], // dias com revisão ou palavra salva (automático)
  checkinDays: ['YYYY-MM-DD'],  // check-ins manuais "Estudei hoje"
  videoNiches: ['tech', …],     // nichos escolhidos na aba Vídeos
  userLevel: 'beginner' | 'intermediate' | 'advanced' | null,
  watchedVideos: { [videoId]: 'YYYY-MM-DD' }, // assistir também grava o dia em activityDays
  hideWatched: false,
  hiddenImages: { [palavra]: ['idDaImagem'] }, // imagens escondidas na busca (spec 003); somem das próximas buscas
}
```

Mudança no formato exige migração em `migrate()` (`src/storage.js`), com teste, para não perder dados salvos.
Datas de dia sempre como `YYYY-MM-DD` em hora local via `dayKey()` — nunca `toISOString()`.

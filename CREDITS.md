# Créditos

O Greywords usa apenas serviços, dados e código com licença aberta. Os créditos dos serviços (imagens, definições, tradução, frases, vídeos, lista NGSL) estão no rodapé da landing e dentro do app. Este arquivo registra o código e as fontes que serviram de base para o visual.

## Fotos

As fotos da busca vêm do [Unsplash](https://unsplash.com/?utm_source=greywords&utm_medium=referral), pela [API do Unsplash](https://unsplash.com/developers). Cada foto mostra o crédito ao fotógrafo, com link, e salvar uma foto avisa o Unsplash do uso, como pedem as regras da API. As reservas são o [Openverse](https://openverse.org) e o [Wikimedia Commons](https://commons.wikimedia.org), com a licença e o autor de cada imagem.

## Frases de exemplo

As frases vêm do [Tatoeba](https://tatoeba.org), um banco aberto de frases escritas por voluntários, pela API em `api.tatoeba.org`. Cada frase tem licença CC BY 2.0 FR (crédito ao autor) ou CC0; o app mostra o autor e um link para a frase original, e a legenda "Frases: Tatoeba, CC BY 2.0 FR / CC0". Quando o Tatoeba não responde, entram os exemplos do próprio dicionário (Free Dictionary / Wiktionary), marcados como "Dicionário".

## Efeitos visuais (spec 005)

Os componentes abaixo foram encontrados no [21st.dev](https://21st.dev). Nenhum foi copiado como veio, porque eles usam Tailwind e lucide, que o design system do app não permite. Cada efeito foi **reescrito** em CSS próprio (`gw-fx-*`) e [Motion](https://motion.dev) (MIT), mantendo a ideia original. A licença de cada um foi conferida na página `.md` do componente no 21st.dev.

| Efeito | Arquivo | Base | Autor | Biblioteca | Licença | Conferido em |
| --- | --- | --- | --- | --- | --- | --- |
| A4 — Seções aparecendo ao rolar | `src/fx/Reveal.jsx` | [Blur Fade](https://21st.dev/@dillionverma/components/blur-fade) | Dillion Verma | Magic UI | MIT | 2026-10-17 |
| A4 — Seções aparecendo ao rolar | `src/fx/Reveal.jsx` | [In View](https://21st.dev/@ibelick/components/in-view) | Julien Thibeaut | Motion Primitives | MIT | 2026-10-17 |
| A1 — Degradê do hero | `src/landing/landing.css` (`.gw-hero-bg`) | Só referência visual: [Aurora Background](https://21st.dev/@manuarora700/components/aurora-background). Escrito do zero, sem código de lá | Manu Arora | Aceternity UI | MIT no 21st.dev | 2026-10-17 |
| A2 — Título palavra por palavra | `src/fx/TextEffect.jsx` | [Text Effect](https://21st.dev/@ibelick/components/text-effect) | Julien Thibeaut | Motion Primitives | MIT | 2026-10-17 |
| A3 — Palavra trocando no título | `src/fx/WordRotate.jsx` | [Word Rotate](https://21st.dev/@dillionverma/components/word-rotate) | Dillion Verma | Magic UI | MIT | 2026-10-17 |
| A6 — Feixe de luz na borda | `src/fx/BorderBeam.jsx` | [Border Beam](https://21st.dev/@dillionverma/components/border-beam) | Dillion Verma | Magic UI | MIT | 2026-10-17 |
| A5 — Cartão com brilho que segue o mouse | `src/fx/SpotlightCard.jsx` | [Magic Card](https://21st.dev/@dillionverma/components/magic-card) | Dillion Verma | Magic UI | MIT | 2026-10-17 |
| B2 — Transição entre abas do app | `src/fx/TabTransition.jsx` | [Transition Panel](https://21st.dev/@ibelick/components/transition-panel) | Julien Thibeaut | Motion Primitives | MIT | 2026-10-17 |
| B5 — Confete ao bater a meta e ao fim da revisão | `src/fx/celebrate.js` | [Confetti](https://21st.dev/@dillionverma/components/confetti) | Dillion Verma | Magic UI | MIT | 2026-10-17 |
| A10 — Moldura de navegador | `src/fx/BrowserFrame.jsx` | [Safari](https://21st.dev/@dillionverma/components/safari) | Dillion Verma | Magic UI | MIT | 2026-10-17 |
| A11 — Mosaico bento | `src/landing/landing.css` (`.gw-bento`) | [Bento Grid](https://21st.dev/@dillionverma/components/bento-grid) | Dillion Verma | Magic UI | MIT | 2026-10-17 |
| A12 — Feixes ligando o app às APIs | `src/fx/AnimatedBeam.jsx` | [Animated Beam](https://21st.dev/@dillionverma/components/animated-beam) | Dillion Verma | Magic UI | MIT | 2026-10-17 |
| A7 — Faixa infinita de palavras | `src/fx/Marquee.jsx` | [Marquee](https://21st.dev/@dillionverma/components/marquee) | Dillion Verma | Magic UI | MIT | 2026-10-17 |
| A8 — Números contando | `src/fx/NumberTicker.jsx` | [Number Ticker](https://21st.dev/@dillionverma/components/number-ticker) | Dillion Verma | Magic UI | MIT | 2026-10-17 |
| A13 — Fundo de pontos | `src/fx/DotPattern.jsx` | [Dot Pattern](https://21st.dev/@dillionverma/components/dot-pattern) | Dillion Verma | Magic UI | MIT | 2026-10-17 |
| A9 — Brilho no botão principal | `src/fx/fx.css` (`.gw-fx-shimmer`) | [Shimmer Button](https://21st.dev/@dillionverma/components/shimmer-button) | Dillion Verma | Magic UI | MIT | 2026-10-17 |

## Bibliotecas usadas no site

| Pacote | Uso | Licença |
| --- | --- | --- |
| [Motion](https://motion.dev) | Animações de entrada e interação (já vem com o BEDS) | MIT |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Confete da celebração (B5) | ISC |

## Capturas do app

As imagens em `public/landing/` são capturas do próprio Greywords, geradas por `scripts/capture.mjs` com palavras de exemplo (`src/dev/demoState.js`). As ilustrações nelas são as da landing, feitas para o projeto. Nenhuma foto de terceiros aparece.

## Ferramentas de desenvolvimento

| Pacote | Uso | Licença |
| --- | --- | --- |
| [sharp](https://sharp.pixelplumbing.com) | Converter as capturas para WebP (`scripts/capture.mjs`, não vai para o site) | Apache-2.0 |

## Fontes

| Fonte | Uso | Licença | Origem |
| --- | --- | --- | --- |
| Fraunces (variável, eixo de peso) | Títulos | SIL Open Font License 1.1 | [@fontsource-variable/fraunces](https://fontsource.org/fonts/fraunces), servida pelo próprio site |
| Inter, Geist Mono | Texto e números | SIL Open Font License 1.1 | Incluídas no design system BEDS |

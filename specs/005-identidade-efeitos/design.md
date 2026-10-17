# 005 — Identidade visual e efeitos: design

Status: implementado (2026-10-17)

## Visão geral

Duas etapas (D2):

- **Etapa A, landing:** paleta, fonte de títulos, efeitos e conteúdo novo. Atende R1, R2, R3, R5 e R6.
- **Etapa B, app:** paleta aplicada às áreas do app e microinterações. Atende R1.3 e R4.

Tudo o que é efeito fica numa pasta nova, `src/fx/`. Cada arquivo começa com um comentário de crédito do componente do 21st.dev que serviu de base. Landing e app importam dali.

## Medido antes (2026-10-17)

| Medida | Valor | Consequência |
| --- | --- | --- |
| Build atual | JS 499 KB (**157,4 KB gzip**), CSS 27,3 KB gzip | Linha de base do orçamento R5.4: JS final de até **217 KB gzip** |
| `motion/react` | Já está no pacote final, porque o BEDS usa (controles, diálogos, layout) | Usar `motion` custa quase nada a mais. Entra como dependência direta, na mesma versão (`13.5.1`) |
| `Metric` do BEDS | Já anima o número quando recebe `numericValue` + `formatValue` | R4.6 sai sem código novo: só passar esses dois campos |
| Navegação do app | `SegmentedControl` do BEDS + conteúdo condicional em `App.jsx` | A transição de abas (R4.2) envolve o **nosso** container de conteúdo, sem tocar no controle |
| Contraste do laranja `#e8590c` | 3,33:1 no creme; o texto branco sobre ele dá 3,58:1 | Bom para gráficos e títulos grandes, **reprovado para texto pequeno**. Entra um "laranja de texto" (abaixo) |

## Paleta (D1, quente e editorial)

Tokens do app em `src/brand/palette.css`, importado no `Root.jsx`. O tema segue o `data-theme` do `<html>` que o `Root.jsx` já define. Nada de redefinir `--es-*`: a paleta pinta só fundos, seções, ilustrações e destaques do app.

| Token | Claro | Escuro | Uso | Contraste medido |
| --- | --- | --- | --- | --- |
| `--gw-bg` | `#fbf6ee` creme | `#1a1512` carvão quente | Fundo da landing | — |
| `--gw-surface` | `#f4eadb` areia | `#251f1a` | Faixas e cartões do app | — |
| `--gw-ink` | `#2e211a` café | `#f5ece0` creme | Títulos | 14,5 / 15,5 |
| `--gw-ink-soft` | `#6b5446` | `#c4b3a1` | Texto secundário | 6,6 / 8,9 |
| `--gw-brand` | `#e8590c` | `#e8590c` | Logo, ilustrações, bordas, brilhos | 3,3 / 5,1 (só gráfico e texto grande) |
| `--gw-brand-ink` | `#b4430a` | `#ff8a4c` | Links, números, texto em laranja | 5,2 / 7,8 |
| `--gw-terracotta` | `#9c3d1b` | `#e07a52` | Segundo destaque (marquee, gráficos) | 6,3 / 6,1 |
| `--gw-cta-bg` / `--gw-cta-fg` | `#b4430a` / `#ffffff` | `#ff8a4c` / `#1a1512` | Botão principal da landing | 5,6 / 7,8 |

O `brandColor` do provider continua `#e8590c` (CLAUDE.md, favicon).

## Tipografia (D6)

- Títulos (`h1`, `h2` e números grandes da landing): **Fraunces**, uma serifa variável de licença OFL 1.1, do pacote `@fontsource-variable/fraunces` (5.3.0). Fica servida pelo próprio site, só o subconjunto latino, com `font-display: swap`.
- O corpo continua com a Inter do BEDS.
- Token do app: `--gw-font-display`. Na `T1` mede-se o peso do arquivo. Se passar de 60 KB, usar só os eixos de peso, sem o eixo óptico.

## Efeitos (D3: lista para você aprovar ou cortar)

Todos MIT, conferidos na página `.md` de cada componente no 21st.dev em 2026-10-17. Os componentes vêm em Tailwind e lucide, então nenhum entra copiado: cada efeito é **reescrito** com CSS `gw-fx-*` e `motion/react`, mantendo a ideia e a geometria. Os créditos vão para o `CREDITS.md`.

Regra de motor:
- **Loops contínuos** (degradê, faixa, brilho) em CSS `@keyframes`, porque é mais barato. Pausam com `animation-play-state` quando saem da tela ou a aba fica oculta (R5.3).
- **Entradas e interações** com `motion/react`, usando `useReducedMotion`.

### Etapa A — landing

| # | Efeito | Base no 21st.dev | Onde | Com menos movimento (R5.1) |
| --- | --- | --- | --- | --- |
| A1 | Fundo do hero com degradê | Referência visual: [Aurora Background](https://21st.dev/@manuarora700/components/aurora-background) (Manu Arora, Aceternity UI). **Escrito do zero** em CSS (manchas de `radial-gradient` creme, laranja e terracota que se deslocam devagar) | Hero | Degradê parado |
| A2 | Título entrando palavra por palavra | [Text Effect](https://21st.dev/@ibelick/components/text-effect) (Julien Thibeaut, Motion Primitives) | `h1` do hero, `h2` das seções | Aparece direto |
| A3 | Palavra em inglês que troca no título ("Aprenda *sun*, *run*, *bridge*… vendo") | [Word Rotate](https://21st.dev/@dillionverma/components/word-rotate) (Dillion Verma, Magic UI) | Hero | Mostra uma palavra fixa |
| A4 | Seções aparecendo ao rolar | [Blur Fade](https://21st.dev/@dillionverma/components/blur-fade) (Magic UI) + [In View](https://21st.dev/@ibelick/components/in-view) (Motion Primitives) | Todas as seções, uma vez cada | Só opacidade, sem deslocamento |
| A5 | Cartão com brilho que segue o mouse | [Magic Card](https://21st.dev/@dillionverma/components/magic-card) (Magic UI) | Passos, diferenciais, bento | Sem brilho; borda normal |
| A6 | Feixe de luz correndo na borda | [Border Beam](https://21st.dev/@dillionverma/components/border-beam) (Magic UI) | Moldura da demo do hero | Borda parada em laranja |
| A7 | Faixa infinita de palavras com ilustração | [Marquee](https://21st.dev/@dillionverma/components/marquee) (Magic UI) | Abaixo do hero, com as ilustrações SVG próprias do `Scenes.jsx` (nenhuma imagem externa) | Lista parada com rolagem horizontal; pausa no hover e no foco |
| A8 | Números contando | [Number Ticker](https://21st.dev/@dillionverma/components/number-ticker) (Magic UI) | Faixa de números | Número final direto |
| A9 | Brilho no botão principal | [Shimmer Button](https://21st.dev/@dillionverma/components/shimmer-button) (Magic UI) | `gw-cta` (é um link nosso, não o `Button` do BEDS) | Sem brilho |
| A10 | Moldura de navegador para as capturas | [Safari](https://21st.dev/@dillionverma/components/safari) (Magic UI), refeita em CSS | Seção "Por dentro do app" | — (estático) |
| A11 | Grade em mosaico (bento) | [Bento Grid](https://21st.dev/@dillionverma/components/bento-grid) (Magic UI) | Seção "Por dentro do app" | — (layout) |
| A12 | Feixes ligando o app às APIs | [Animated Beam](https://21st.dev/@dillionverma/components/animated-beam) (Magic UI) | Seção "Como foi feito": o greyhound no centro e Openverse, Wikimedia, Free Dictionary, Wiktionary, MyMemory, Tatoeba e YouTube em volta | Linhas paradas |
| A13 | Fundo de pontos sutil | [Dot Pattern](https://21st.dev/@dillionverma/components/dot-pattern) (Magic UI) | Faixa de números e fechamento | — (estático) |
| A14 | Greyhound correndo (R1.4) | Próprio, sem base: o `GreyhoundMark` atravessa a faixa do fechamento uma vez ao entrar na tela | Fechamento | Fica parado no centro |

### Etapa B — app

| # | Efeito | Base no 21st.dev | Onde | Com menos movimento |
| --- | --- | --- | --- | --- |
| B1 | Virar o flashcard | [Flip Card](https://21st.dev/@skyleen77/components/flip-card) (Elliot Sutton, Animate UI) | `Review.jsx`. Meia-volta em `rotateY`: a frente gira até 90°, troca o conteúdo e o verso volta de 90° a 0°. Assim não existem duas faces de altura diferente. A nota pode ser dada durante a animação (R4.7) | Troca direta |
| B2 | Transição entre abas | [Transition Panel](https://21st.dev/@ibelick/components/transition-panel) (Motion Primitives) | Container de conteúdo em `App.jsx`: fade de 150 ms com 8 px de deslocamento | Só troca |
| B3 | Retorno ao escolher imagem | Próprio, no estilo do Magic Card: a imagem encolhe um pouco com mola e o número da ordem "salta" | `Search.jsx` | Marca aparece direto |
| B4 | Esqueleto com brilho | [Skeleton](https://21st.dev/@shadcn/components/skeleton) (shadcn/ui) | Grade de imagens enquanto carrega | Esqueleto parado |
| B5 | Celebração | [Confetti](https://21st.dev/@dillionverma/components/confetti) (Magic UI), que usa o pacote **`canvas-confetti`** (1.9.4, licença ISC, cerca de 4 KB gzip) | Ao bater a meta semanal (Progresso) e ao terminar a sessão de revisão. Cores da paleta, cerca de 1 s | `disableForReducedMotion` do próprio pacote: nada aparece, só a mensagem |
| B6 | Métricas contando | `Metric` do BEDS (`numericValue` + `formatValue`) | `WordMetrics.jsx`, Progresso | O BEDS já respeita |
| B7 | Paleta no app | — | Fundo da página do app em `--gw-bg`, cabeçalho e flashcard em `--gw-surface`, destaques em `--gw-brand-ink` | — |

### Peças em `src/fx/`

| Arquivo | Conteúdo |
| --- | --- |
| `fx.css` | Classes `gw-fx-*`, `@keyframes` dos loops e a regra `@media (prefers-reduced-motion: reduce)` |
| `useOnScreen.js` | `IntersectionObserver` + `visibilitychange`; liga e desliga a classe `is-paused` nos loops (R5.3) |
| `Reveal.jsx` | A4 (`motion.div` com `whileInView`, `once`) |
| `TextEffect.jsx`, `WordRotate.jsx` | A2, A3 (texto completo sempre no DOM para leitor de tela; partes animadas com `aria-hidden`) |
| `Marquee.jsx` | A7 (conteúdo duplicado com `aria-hidden` na cópia) |
| `NumberTicker.jsx` | A8 (`useSpring` do motion; o número final fica em texto acessível desde o início) |
| `SpotlightCard.jsx` | A5 (ponteiro atualiza `--gw-x` e `--gw-y`; `radial-gradient` em CSS) |
| `BorderBeam.jsx`, `BrowserFrame.jsx`, `AnimatedBeam.jsx`, `DotPattern.jsx` | A6, A10, A12, A13 |
| `FlipSwap.jsx`, `Skeleton.jsx`, `celebrate.js` | B1, B4, B5 |

## Conteúdo novo da landing (R2)

Ordem das seções:

1. **Cabeçalho** fixo, com fundo translúcido e desfoque ao rolar.
2. **Hero** (A1, A2, A3, A9 e a demo atual dentro de A6).
3. **Faixa de palavras** (A7).
4. **Números verdadeiros** (A8, A13). Cada número é conferido na tarefa:
   - **7** serviços gratuitos e abertos usados;
   - **0** cadastro e **0** servidor ("tudo no seu navegador");
   - cerca de **2.800** palavras da lista NGSL usadas para medir o nível dos vídeos (contadas no arquivo);
   - **3** imagens por palavra.
5. **Como funciona**: os 3 passos atuais, em cartões A5.
6. **Por dentro do app** (A10, A11, D5): mosaico com a demo interativa da busca (a atual) e capturas reais de Revisão, Progresso e Palavras. As capturas são tiradas do próprio app com dados de exemplo, salvas em `public/landing/*.webp`, com `width` e `height` fixos (sem salto de layout) e `loading="lazy"`. A captura de **Vídeos só entra quando houver catálogo real**, porque o catálogo de exemplo tem números fictícios (regra da landing honesta).
7. **Por que funciona** (R2.2): três blocos curtos, cada um com link para a fonte original, sem prometer resultado. Os links são conferidos na tarefa.
   - Curva do esquecimento: Ebbinghaus, 1885.
   - Prática espaçada: meta-análise de Cepeda e colegas, *Psychological Bulletin*, 2006.
   - Imagem + palavra: teoria da dupla codificação de Paivio e o efeito de superioridade da imagem.
8. **Como foi feito** (R2.3, A12): diagrama das APIs; stack (React, Vite, design system BEDS, SM-2); a medição das imagens da spec 003 (45,6% no "antes", e o "depois" quando a T7 da 003 sair); link para o código quando houver repositório público.
9. **Diferenciais**: os 4 atuais, em cartões A5.
10. **O que vem por aí** (R2.5): frases de exemplo (spec 004) e conta opcional. Vídeos saem daqui quando o catálogo real existir.
11. **Perguntas frequentes**: as atuais, ajustadas quando a spec 004 sair.
12. **Fechamento** com A14 e o CTA.
13. **Rodapé** com os créditos atuais, mais "Efeitos inspirados em Magic UI, Motion Primitives, Animate UI e Aceternity UI (MIT), via 21st.dev" e o link para o `CREDITS.md`.

## Mudanças em arquivos existentes

| Arquivo | Mudança |
| --- | --- |
| `package.json` | Novas dependências: `motion` 13.5.1 (já no pacote final), `@fontsource-variable/fraunces`, `canvas-confetti` (só na etapa B) |
| `src/Root.jsx` | Importa `brand/palette.css` e a fonte |
| `src/landing/Landing.jsx`, `landing.css` | Seções novas e efeitos; cores passam a ler `--gw-*` |
| `src/landing/ProductDemo.jsx` | Entra dentro de A6, sem mudar o comportamento |
| `src/App.jsx`, `src/styles.css` | B2, B7 |
| `src/components/Review.jsx`, `Search.jsx`, `Progress.jsx`, `WordMetrics.jsx` | B1, B3, B4, B5, B6 |
| `CREDITS.md` (novo), `README.md`, `CLAUDE.md` | Créditos, mapa do código (`src/fx/`, `palette.css`) |

## Dependência com outras specs

- **Etapa A** não mexe em `Search.jsx`: pode começar já.
- **Etapa B** mexe em `Search.jsx` e `Review.jsx`, que as specs 003 (T3–T6) e 004 (T4–T6) também mudam. Proposta: B3 e B4 depois da T6 da 003, e B1 depois da T6 da 004. B2, B5, B6 e B7 podem ser feitos a qualquer momento.

## Rastreabilidade

| Requisito | Onde |
| --- | --- |
| R1.1–R1.3 | `palette.css`, B7 |
| R1.4 | A14, greyhound no centro de A12 |
| R2.1 | Seção "Por dentro do app" (A10, A11) |
| R2.2 | Seção "Por que funciona" |
| R2.3 | Seção "Como foi feito" (A12) |
| R2.4–R2.5 | Faixa de números, roadmap |
| R3.1–R3.6 | A1–A9 |
| R4.1–R4.7 | B1–B6 |
| R5.1–R5.5 | Coluna "com menos movimento", `useOnScreen`, orçamento medido no build |
| R6.1–R6.3 | `check:ui`, `CREDITS.md`, só componentes MIT |

## Verificação planejada

- `npm test`, `npm run build` (JS de até 217 KB gzip) e `npm run check:ui` (0 violações).
- Navegador: claro, escuro e 375 px; teclado percorrendo a landing toda; `prefers-reduced-motion` emulado, sem nenhum movimento de deslocamento; aba em segundo plano pausa os loops; sem salto de layout ao carregar as capturas.
- Contraste conferido nos dois temas com as cores finais.
- Conferir cada número e cada link de fonte da landing.

## Riscos

| Risco | Plano |
| --- | --- |
| Efeito demais deixa a página cansativa | Um efeito de destaque por seção; os loops ficam só no hero, na faixa e no CTA |
| A fonte de títulos pesa | Medida na T1, com limite de 60 KB, e só o subconjunto latino |
| As capturas ficam velhas quando o app muda | Arquivos com nome por tela, refeitos na tarefa final de cada spec que mudar a tela |
| Efeito por cima de controle do BEDS | Efeitos só em elementos do app; o `check:ui` pega `className` e `style` em componente do BEDS |
| Aceternity tem licença própria fora do 21st.dev | A1 é escrito do zero, sem código de lá; só a referência visual |

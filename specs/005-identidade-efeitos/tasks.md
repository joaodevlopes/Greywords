# 005 — Identidade visual e efeitos: tarefas

Status: aprovado (2026-10-17)

Uma tarefa por vez, nesta ordem. Cada uma termina com `npm test`, `npm run build` e `npm run check:ui` passando (0 violações). As de tela também passam pelo navegador em claro, escuro, 375 px e com movimento reduzido emulado.
Cada efeito baseado no 21st.dev ganha um comentário de crédito no topo do arquivo e uma linha no `CREDITS.md` **na mesma tarefa** em que entra.

## Etapa A — Landing

- [x] **T1 — Paleta, fonte e base**: `motion` 13.5.1 e `@fontsource-variable/fraunces` como dependências diretas; `src/brand/palette.css` com os tokens `--gw-*` dos dois temas, importado no `Root.jsx`; títulos da landing em `--gw-font-display`; cores da landing lendo `--gw-*`; CTA com `--gw-cta-bg` / `--gw-cta-fg`.
  - Teste novo (`src/brand/palette.test.js`): lê o `palette.css`, calcula o contraste WCAG de cada par usado (texto/fundo, CTA, gráfico/fundo) e falha abaixo de 4,5:1 em texto ou 3:1 em gráfico.
  - *Pronto quando:* o teste de contraste passa nos dois temas; o arquivo da fonte (subconjunto latino) foi medido e tem até 60 KB, ou a troca para só os eixos de peso foi feita; a landing atual aparece com a paleta nova, sem quebrar nada. — R1.1, R1.2, R6.1

- [x] **T2 — Base de efeitos em `src/fx/`**: `fx.css` (classes `gw-fx-*` e regra de movimento reduzido), `useOnScreen.js` (pausa fora da tela e com a aba oculta), `Reveal.jsx` (A4); `CREDITS.md` criado com o formato das linhas.
  - *Pronto quando:* uma seção da landing aparece com `Reveal`; com movimento reduzido só muda a opacidade; um loop de teste pausa ao sair da tela e ao trocar de aba (conferido pelo `animation-play-state` no navegador). — R3.2, R5.1, R5.3, R6.2

- [x] **T3 — Hero**: fundo com degradê (A1), título palavra por palavra (A2), palavra em inglês trocando (A3), demo atual dentro da moldura com feixe na borda (A6), brilho no CTA (A9), cabeçalho fixo com fundo translúcido.
  - *Pronto quando:* o hero carrega sem salto de layout; o leitor de tela lê o título inteiro uma vez só; o degradê pausa fora da tela; com movimento reduzido nada se desloca. — R3.1, R3.6, R1.4

- [x] **T4 — Faixa de palavras e números**: faixa infinita com as ilustrações do `Scenes.jsx` (A7), que pausa no hover e no foco; faixa de números (A8) sobre o fundo de pontos (A13).
  - Cada número é conferido na fonte antes de entrar: serviços gratuitos contados no `src/api.js` e no player; total de palavras da NGSL contado no arquivo de `catalog/ngsl/`.
  - *Pronto quando:* a faixa roda e para no hover; com movimento reduzido vira lista parada com rolagem; os números contam ao aparecer e o valor final está no texto desde o início; a origem de cada número está anotada em comentário no código. — R3.4, R3.5, R2.4

- [x] **T5 — Cartões com brilho e seções antigas**: Magic Card (A5) nos passos e nos diferenciais; `Reveal` em todas as seções; título das seções com Text Effect (A2).
  - *Pronto quando:* o brilho segue o mouse e não aparece no toque; o foco do teclado continua visível nos cartões; com movimento reduzido não há brilho. — R3.2, R3.3

- [x] **T6 — Por dentro do app**: dados de exemplo só no modo dev (`src/dev/`); script `scripts/capture.mjs` que tira as capturas de Revisão, Progresso e Palavras com o Edge em modo headless e converte para WebP (`sharp` como devDependency); moldura de navegador (A10); mosaico bento (A11) com a demo interativa da busca e as capturas.
  - *Pronto quando:* as capturas saem com `width` e `height` fixos e `loading="lazy"`; os dados de exemplo não entram no build; **não há captura de Vídeos** enquanto não houver catálogo real; funciona em 375 px (o mosaico vira coluna). — R2.1

- [x] **T7 — Por que funciona e Como foi feito**: três blocos com fonte (Ebbinghaus 1885; Cepeda e colegas 2006; Paivio e o efeito de superioridade da imagem), cada link aberto e conferido; diagrama com feixes ligando o greyhound às APIs (A12); stack; medição das imagens com os números reais da spec 003.
  - *Pronto quando:* cada afirmação tem link que abre a fonte certa; o texto não promete resultado; o diagrama é legível em 375 px (vira lista com linhas paradas se não couber); com movimento reduzido os feixes ficam parados. — R2.2, R2.3, R2.4

- [x] **T8 — Fechamento, roadmap e créditos**: greyhound correndo no fechamento (A14); roadmap atualizado (frases de exemplo; vídeos só com catálogo real); rodapé com o crédito dos efeitos e link para o `CREDITS.md`; `README.md` e `CLAUDE.md` (mapa com `src/fx/`, `palette.css`, `scripts/capture.mjs`).
  - *Pronto quando:* o `CREDITS.md` tem uma linha para cada efeito A1–A13 (nome, autor, link, licença, data); o rodapé mostra os créditos. — R1.4, R2.5, R6.2, R6.3

- [x] **T9 — Verificação da etapa A**: percorrer R1–R3, R5 e R6 no navegador e preencher a seção "Verificação" abaixo.
  - Medir o JS final, que tem de ficar em até 217 KB gzip.
  - Medir o salto de layout (CLS) da landing pelo painel de desempenho do navegador.
  - Percorrer a página toda pelo teclado.
  - Conferir o movimento reduzido, a pausa dos loops com a aba oculta, os temas claro e escuro e a largura de 375 px.
  - *Pronto quando:* tudo conferido e listado, com o que não deu para verificar dito explicitamente.

## Etapa B — App

- [x] **T10 — Paleta no app, transição de abas e métricas**: fundo, cabeçalho e flashcard do app com `--gw-*` (B7); transição curta no container de conteúdo do `App.jsx` (B2); `Metric` com `numericValue` + `formatValue` no `WordMetrics.jsx` e no Progresso (B6).
  - *Pronto quando:* trocar de aba anima sem atrasar o clique; as métricas contam ao abrir o Progresso; com movimento reduzido tudo é direto; landing e app parecem o mesmo produto. — R1.3, R4.2, R4.6, R4.7

- [x] **T11 — Celebração**: `canvas-confetti` (B5) ao bater a meta da semana e ao terminar a sessão de revisão, com as cores da paleta e `disableForReducedMotion`.
  - *Pronto quando:* aparece uma vez por evento (não repete ao reabrir a aba); com movimento reduzido só aparece a mensagem; o JS final continua dentro do orçamento. — R4.5, R5.1

- [x] **T12 — Busca: escolha e esqueleto** (só **depois da T6 da spec 003**): retorno animado ao escolher imagem (B3); esqueleto com brilho enquanto as imagens carregam (B4).
  - *Pronto quando:* escolher e desfazer a escolha respondem na hora; a ordem da escolha "salta"; o esqueleto tem o mesmo tamanho da grade (sem salto); com movimento reduzido o esqueleto fica parado. — R4.3, R4.4, R4.7
  - *Feito (2026-10-17):*
    - **B3:** a imagem escolhida encolhe para 94% dentro do quadro, com mola curta (`motion.img`). O número da ordem entra de 40% a 100% de tamanho e, como usa a ordem como `key`, "salta" de novo quando a ordem muda. Com movimento reduzido, a marca e o número aparecem direto.
    - **B4:** `src/fx/Skeleton.jsx` mostra 12 quadros, o mesmo número de imagens da busca (antes eram 9, e a grade crescia ao chegar). Um brilho passa em cada quadro, um depois do outro (70 ms de atraso entre eles). O brilho usa `.gw-fx-loop`, então para com movimento reduzido. Um texto só para leitor de tela diz "Buscando imagens…". O "Refinar" usa o mesmo esqueleto.
    - Crédito do B4 (Skeleton, shadcn/ui, MIT, conferido na página `.md` do 21st.dev) no `CREDITS.md`. O B3 é próprio.
    - **Conferido no Edge headless**, com a resposta das imagens atrasada 3 s de propósito:
      - O esqueleto tem 12 quadros e 920 px, a mesma altura da grade final; o brilho roda (`gw-fx-sweep`, atraso de 0,14 s no 3º quadro).
      - `aria-pressed` muda no mesmo instante do clique. 40 ms depois, o número do 2º quadro ainda está a 62% do tamanho (o "salto"); depois de 600 ms, as imagens escolhidas estão em 94%.
      - Ao desfazer a 1ª escolha, os números passam de 2 e 3 para 1 e 2; a nova escolha vira 3.
      - Com movimento reduzido: o esqueleto fica parado, sem escala e sem salto, e escolher continua igual. Sem erros no console.
      - JS: 175,2 KB gzip, dentro do orçamento de 217 KB.

- [x] **T13 — Virar o flashcard** (só **depois da T6 da spec 004**, que também mexe na revisão): meia-volta em `rotateY` ao revelar (B1), também com a frente de frase com lacuna.
  - *Pronto quando:* revelar por clique, Espaço ou Enter vira o cartão; as notas 1–4 funcionam durante a animação; o foco vai para o lugar certo depois de virar; com movimento reduzido a troca é direta. — R4.1, R4.7
  - *Feito (2026-10-17):*
    - `src/fx/FlipSwap.jsx`: meia-volta com `useAnimate` do motion. A frente gira de 0° a 90° em 0,14 s, a face troca, e o verso vem de −90° a 0° em 0,18 s; existe uma face por vez. Voltar para a frente (próxima carta) é imediato. Com movimento reduzido, a troca é direta.
    - Na `Review.jsx`, o estado `revealed` muda na hora. Por isso as notas pelo teclado valem no meio da virada, e uma nota interrompe a animação.
    - O conteúdo do verso fica num grupo "Resposta: palavra" (`tabIndex -1`), que recebe o foco quando aparece, porque o campo de palpite que tinha o foco sai da tela. O Tab segue daí para "Ouvir", "Ver tradução" e as notas.
    - As regras `.is-revealed` viraram `[data-side='back']`.
    - Crédito: Flip Card (Elliot Sutton, Animate UI, MIT, conferido na página `.md` do 21st.dev) no `CREDITS.md` e no rodapé da landing, junto com o shadcn/ui do B4.
    - **Conferido no Edge headless** (ângulo e face gravados a cada quadro):
      - Clique em "Mostrar resposta", Enter no campo (com palpite: "Acertou") e Espaço fora do campo: os três viram o cartão, chegando a 90°, voltando de cerca de −76° a 0° e trocando de face com cerca de 0,17 s. Nos três, o foco termina em "Resposta: …".
      - Nota "3" 40 ms depois de revelar: a nota conta, a virada para (13°) e a sessão segue.
      - A frente com frase e lacuna ("blanket") vira igual.
      - Com movimento reduzido: ângulo sempre 0°, o verso aparece no quadro seguinte, foco e notas iguais. Sem erros no console.
      - JS: 175,7 KB gzip.

- [ ] **T14 — Verificação final**: percorrer R4 e R5 no app, conferir de novo o orçamento e o `check:ui`, atualizar o `CREDITS.md` (B1, B2, B4, B5) e o `CLAUDE.md`, e marcar a spec como `implementado`.
  - *Pronto quando:* todos os critérios estão conferidos e listados abaixo, com o que não deu para verificar dito explicitamente.

## Verificação

### Etapa A — landing (T9, 2026-10-17)

**Como foi feito:** no build de produção (`vite preview`), com Edge headless via CDP. Foram 6 combinações: claro e escuro; desktop (1366 px) e 375 px; normal e com `prefers-reduced-motion` emulado.

Em cada uma, o script fez quatro coisas:
- rolou a página inteira;
- mediu o contraste de cada texto visível contra o fundo efetivo (172 textos no desktop, 167 em 375 px);
- apertou Tab 70 vezes com teclado real (CDP);
- leu a árvore de acessibilidade do Chromium.

**Critérios:**

| Critério | Resultado |
| --- | --- |
| R1.1 Paleta própria nos dois temas | ✅ tokens `--gw-*`; landing em claro e escuro conferida |
| R1.2 Contraste AA | ✅ 0 falhas nos textos medidos, nas 6 combinações; teste da paleta com 11 pares de texto e 3 de gráfico. Sobre o degradê do hero (que a varredura não enxerga), o caso pior é texto secundário em cima da mancha laranja mais forte: 4,57:1 no claro e 5,93:1 no escuro, ainda AA |
| R1.3 Landing e app com a mesma paleta | ⏳ **pendente**: o app recebe a paleta na T10 (etapa B) |
| R1.4 Greyhound como identidade | ✅ marca no hero, centro do diagrama "Como foi feito" e entrada correndo no fechamento |
| R2.1 Mostrar o app real | ✅ demo interativa no hero e capturas reais de Revisão, Progresso e Palavras; sem captura de Vídeos |
| R2.2 "Por que funciona" com fontes | ✅ 4 links, cada um para a fonte certa (Crossref e York University); aviso de que não é promessa |
| R2.3 "Como foi feito" | ✅ diagrama dos serviços, stack e medição das imagens (45,6%, gráfico por grupo) |
| R2.4 Só números verdadeiros | ✅ 6 / 0 / 3 / 2.809, com a origem comentada no código; números da medição iguais aos de `medicao.md` |
| R2.5 Roadmap atualizado | ✅ frases de exemplo, conta opcional e vídeos (sem catálogo real ainda) |
| R3.1–R3.6 Efeitos da landing | ✅ degradê e título no hero, seções aparecendo ao rolar, cartões com brilho no mouse, faixa de palavras, números contando, brilho no CTA (detalhes nas notas T3–T8) |
| R5.1 Movimento reduzido | ✅ 0 loops animados; seções só com opacidade; palavra fixa; faixa parada; números diretos; greyhound só aparece |
| R5.2 Teclado e leitor de tela | ✅ 68 paradas de Tab, todas com indicador de foco visível e nenhuma escondida. O "Pular para o conteúdo" aparece por cima do cabeçalho (captura conferida). O h1 é lido uma vez só ("Aprenda palavras em inglês vendo, não traduzindo."), sem o texto animado |
| R5.3 Loops pausam fora da tela e com a aba oculta | ✅ ao fim da rolagem, 0 dos 14 loops fora da tela (7 em 375 px) continuavam rodando. Aba oculta conferida por simulação de `visibilitychange` (T2) |
| R5.4 Orçamento e salto de layout | ✅ JS 162,3 KB gzip (limite 217; +4,9 KB desde o início da spec). CLS 0,0056 no desktop e 0 em 375 px, causado só pela troca de fonte |
| R5.5 375 px e temas | ✅ sem rolagem horizontal nas 6 combinações; nenhuma imagem quebrada |
| R6.1 `check:ui` | ✅ 0 violações (53 arquivos) |
| R6.2 Créditos | ✅ `CREDITS.md` com A1–A13; crédito no topo de cada arquivo de efeito e no rodapé |
| R6.3 Nada de licença desconhecida | ✅ só componentes MIT como base; a Aceternity foi só referência visual, sem código |

**Não deu para verificar:**
- **Leitor de tela real (NVDA ou Narrador):** não foi usado. A árvore de acessibilidade do Chromium confirma o nome dos títulos, mas não substitui ouvir a página.
- **Aparelho real e Safari/Firefox:** só foi testado em Edge (Chromium), desktop e emulação de 375 px. O feixe na borda da demo usa `offset-path: rect()`; em navegador sem suporte, a luz fica parada num canto, sem quebrar nada.
- **Lighthouse:** a nota não foi medida. O orçamento de JS e o CLS foram medidos direto.
- **Painel do navegador do app:** não foi usado nesta verificação, porque estava oculto (ele congela animações). Por isso tudo foi conferido no Edge headless.

Notas de implementação:

- **T1 (2026-10-17):** a paleta e a fonte são importadas em `src/main.jsx`, junto com o CSS do BEDS, em vez do `Root.jsx`; o efeito é o mesmo.
  - A Fraunces com eixo óptico dava 67 KB no subconjunto latino, acima do limite, então entrou só o eixo de peso (`wght.css`, 36,6 KB). O navegador baixa só o subconjunto latino.
  - O teste de contraste cobre 11 pares de texto e 3 de gráfico nos dois temas (119 testes no total).
  - O JS ficou igual (157,4 KB gzip).
  - Conferido no navegador em claro, escuro e 375 px, sem rolagem horizontal.
  - O badge de ordem da demo passou a usar as cores do CTA: o branco sobre `#e8590c` reprovava.
- **T2 (2026-10-17):**
  - O `Reveal` está aplicado em "Três passos por palavra". Conferido: opacidade 0 antes de rolar; depois de entrar na tela, opacidade 1 e `blur(0px)`.
  - A pausa usa o atributo `data-fx-paused` no container e a classe `.gw-fx-loop` em cada loop. Com um loop de teste no hero:
    - com o hero fora da tela (mais de 120 px), o loop fica `paused`;
    - ao voltar, fica `running` de novo;
    - com `document.hidden` simulado e o evento `visibilitychange`, pausa e retoma.
  - As abas de fundo do painel do app continuam com `document.hidden = false`, por isso a aba oculta foi simulada.
  - **Movimento reduzido:** o painel não emula `prefers-reduced-motion`. A regra está coberta pelo teste de `revealVariants` (só opacidade) e pela regra CSS. Falta conferir com a configuração real do sistema (no Windows, "Efeitos de animação" desligado) na T9.
  - JS: 157,9 KB gzip (+0,4 KB).
- **T3 (2026-10-17):**
  - Título visual: "Aprenda *sun* vendo, não traduzindo.", com a palavra trocando entre sun, moon, beach, lamp e sea (as palavras que têm ilustração).
    - O leitor de tela recebe a frase original "Aprenda palavras em inglês vendo, não traduzindo." em `gw-visually-hidden`; a parte animada fica em `aria-hidden`.
    - A árvore de acessibilidade do painel ignora `aria-hidden`, então o markup foi conferido no DOM. Um teste com leitor de tela real (Narrador ou NVDA) fica para a T9.
  - A troca de palavra usa `mode="wait"`: nunca há duas palavras ao mesmo tempo (amostrado a cada 180 ms).
  - A altura do título fica estável durante as trocas, e não há rolagem horizontal em 375 px.
  - Todos os 5 loops do hero (3 manchas do degradê, feixe e brilho do CTA) ficam `paused` fora da tela e voltam a `running`. A palavra para de trocar fora da tela.
  - **Bug corrigido:** o `animation:` resumido das manchas, mais específico, anulava a pausa e anularia também o movimento reduzido. As duas regras de estado do `fx.css` agora usam `!important`, com o motivo comentado no arquivo.
  - CLS no carregamento: 0,0026 (vem da troca de fonte).
  - JS: 158,4 KB gzip.
  - O cabeçalho ficou fixo e translúcido. As âncoras param abaixo dele (`scroll-margin-top`), e o link "Pular para o conteúdo" ficou acima dele.
- **T4 (2026-10-17):**
  - **Números conferidos:**
    - **6** serviços: Openverse, Wikimedia Commons, Free Dictionary, Wiktionary e MyMemory no `api.js`, mais o YouTube no `VideoDialog.jsx`. O design previa 7, mas o Tatoeba só existe depois da spec 004; trocar para 7 quando ela sair.
    - **0** cadastros e servidores.
    - **3** imagens por palavra (`MAX_PICK`).
    - **2.809** lemas da NGSL, contados no arquivo. O README da pasta dizia 2.810 e foi corrigido.
    - A origem de cada número está comentada em `NUMBERS`, no `Landing.jsx`.
    - O card da NGSL diz "(em preparação)" porque os vídeos ainda não têm catálogo real.
  - **Faixa:**
    - Para além da pausa no hover, a faixa ganhou um **botão Pausar/Continuar** (`IconButton` do BEDS), porque o hover não serve para quem usa teclado (WCAG 2.2.2).
    - Conferido: o botão para o movimento e troca o rótulo; o hover e a saída da tela pausam.
    - Com movimento reduzido, a faixa vira lista parada com rolagem, sem a cópia e sem o botão. Isso está só no CSS; a conferência fica para a T9.
  - **Números:** contam até o valor ao aparecer; o valor final fica em texto acessível desde o início, e a largura vem do valor final (sem salto).
  - Conferido em claro, escuro e 375 px, sem rolagem horizontal. Em 375 px os números ficam em 2 colunas.
  - JS: 159,2 KB gzip.
- **T5 (2026-10-17):**
  - Os passos viraram cartões, no mesmo estilo dos diferenciais. `SpotlightCard` foi aplicado nos dois grupos. Todas as seções estão em `Reveal`, e os títulos usam `TextEffect` no modo `inherit`.
  - **Decisão técnica:** o título não observa a tela por conta própria; ele herda o estado do `Reveal` pela propagação de variantes do motion. Assim cada seção tem um observador só.
  - **Verificação em Edge headless** (`scripts/edge-check.mjs`), porque a sessão não estava visível e o painel do app congela as animações quando está oculto:
    - Todas as 6 seções começam em opacidade 0 e chegam a 1 ao rolar.
    - As 24 palavras dos títulos chegam a 1, sem deslocamento.
    - Os números chegam a 6, 0, 3 e 2.809.
    - Em 375 px, sem rolagem horizontal.
  - **Hover com mouse real (CDP):** o brilho e o anel aparecem só no cartão sob o cursor (as variáveis `--gw-x`/`--gw-y` acompanham). No toque nada aparece, porque a regra exige `hover: hover` e `pointer: fine` e o código ignora `pointerType` diferente de mouse.
  - **Movimento reduzido emulado (CDP):**
    - as seções só mudam a opacidade;
    - todos os 8 loops ficam com `animation: none`;
    - a palavra do título fica fixa;
    - a faixa vira lista parada com rolagem, sem a cópia e sem o botão;
    - o feixe some e a borda fica laranja parada;
    - o brilho do CTA some;
    - os números aparecem direto.

    Com isso, as pendências de movimento reduzido da T2–T4 estão conferidas.
  - JS: 159,3 KB gzip.
- **T6 (2026-10-17):**
  - **Dados de exemplo:** `src/dev/demoState.js` (6 palavras, 3 para revisar, 3 semanas de meta batida, nada no futuro; 4 testes). O app **não** importa esse arquivo; o `scripts/capture.mjs` injeta os dados no `localStorage` de um perfil descartável do Edge headless. Conferido que nenhum texto dele aparece no build.
    - Definições e exemplos foram escritos para o arquivo.
    - As "imagens" são as ilustrações SVG da própria landing, lidas da página como data URIs. Assim nenhuma foto de terceiros (com licença CC variada) vai para as capturas.
  - **Capturas:** Revisão, Progresso e Palavras, em claro e escuro, salvas como 6 arquivos WebP de 1600×1013, com 22 a 31 KB cada.
    - Movimento reduzido emulado durante a captura, para pegar o estado final.
    - Sem captura de Vídeos.
    - As capturas mostram o app ainda com o cinza do BEDS. **Refazer com `node scripts/capture.mjs` depois da T10**, quando a paleta chegar ao app.
  - **Seção "Por dentro do app"** (link "Por dentro" no menu):
    - Mosaico com a Revisão ocupando 2×2 e Progresso e Palavras ao lado. Em 375 px, uma coluna.
    - A demonstração da busca **ficou só no hero**, para não repetir o mesmo bloco duas vezes. É uma mudança em relação ao design, que punha a demo também no mosaico.
    - A imagem de cada tema só baixa no tema ativo e só quando a seção chega perto da tela (conferido: antes da rolagem nenhuma; depois só as 3 do tema). Conferido em claro e em escuro.
  - Corrigido: a sombra da moldura usava `--gw-ink`, que fica creme no escuro e criava um halo claro; agora é uma sombra escura fixa.
  - `scripts/edge.mjs` reúne o código do Edge headless, usado por `edge-check.mjs` e `capture.mjs`. O `sharp` entrou como devDependency (Apache-2.0).
  - JS: 159,9 KB gzip.
- **T7 (2026-10-17):**
  - **Fontes conferidas** pelos metadados do Crossref (título, revista, volume, páginas e autores batem). Os DOIs da APA respondem 403 para robôs, mas abrem no navegador. O capítulo 7 do Ebbinghaus (tradução de 1913, York University) responde 200.
    - Cepeda, Pashler, Vul, Wixted e Rohrer (2006), *Psychological Bulletin* 132(3), 354–380. O "317 experimentos" vem do resumo do artigo.
    - Paivio (1991), *Canadian Journal of Psychology* 45(3), 255–287.
    - Nelson, Reed e Walling (1976), *JEP: Human Learning and Memory* 2(5), 523–528.
    - Cada autor tem o próprio link. A seção avisa que os estudos explicam o método e não são promessa de resultado.
  - **Diagrama (A12):** o greyhound no centro e 7 nós (os 6 serviços mais "Seu navegador"), sem sobreposição. Os nós são uma lista HTML legível; as linhas são decorativas.
    - Cada feixe é um traço único que corre pela curva.
    - **Corrigido:** o `vector-effect` quebrava o `pathLength` e virava tracinhos. Como a caixa tem proporção fixa, a espessura agora fica em unidades do viewBox.
    - Em 720 px ou menos vira lista em 2 colunas, sem linhas. Com movimento reduzido, as linhas ficam paradas.
  - **Medição das imagens:** o número principal, 45,6% (82 de 180, nenhuma imprópria), e um gráfico de barras com os 6 grupos, conforme a skill de visualização.
    - Uma série só, na cor da marca (contraste de gráfico coberto pelo teste da paleta), barras finas com ponta arredondada.
    - O valor fica como texto ao lado e, para leitor de tela, com "x de y".
    - Números iguais aos de `medicao.md`. Quando a T7 da spec 003 medir o "depois", acrescentar aqui.
  - `formatPercent` (pt-BR) em `number.js`, com teste. 131 testes.
  - Conferido em Edge headless: desktop, 375 px e movimento reduzido, sem rolagem horizontal.
  - JS: 162,0 KB gzip (de um orçamento de 217).
- **T8 (2026-10-17):**
  - **Greyhound (A14):** entra correndo pela esquerda e para centralizado acima do título do fechamento. Ele herda o estado do `Reveal` (sem `whileInView` próprio).
    - Conferido: a posição vai avançando (484 → 664 px) e para no centro.
    - Com movimento reduzido, só aparece no lugar.
  - **Roadmap:** ficou com "Frases de exemplo" (spec 004), "Usar em mais de um aparelho" e "Vídeos do seu nicho". Vídeos continua porque ainda não há catalogo real. Grade de 3 colunas, e 1 em 375 px.
  - **Rodapé:** créditos dos efeitos, sendo Magic UI e Motion Primitives como base de código e Aceternity só como inspiração do fundo, mais a Fraunces (OFL), com menção ao `CREDITS.md`.
    - A Animate UI só entra no rodapé na T13, quando a B1 for feita.
    - O `CREDITS.md` não é servido pelo site; o rodapé só cita o arquivo. Pôr um link quando houver repositório público.
  - O `CREDITS.md` tem linha para A1–A13. A A14 é própria, sem base.
  - README atualizado: identidade, efeitos, créditos, `capture.mjs`, `edge-check.mjs` e spec 004 nos próximos passos. CLAUDE.md atualizado com `public/landing/`.
  - JS: 162,3 KB gzip.
- **T10 (2026-10-17):**
  - **Paleta no app (B7):** o `styles.css` passou a ler os tokens `--gw-*`, e o fundo da página (`html`) também usa `--gw-bg`.
    - O cabeçalho virou uma barra translúcida de largura total, fixa no topo, como a da landing. No celular ele não fica fixo, porque o menu quebra em duas linhas.
    - Os dias estudados no calendário e o número de ordem das imagens usam as cores do CTA, com contraste AA. Antes era branco ou café sobre `#e8590c`.
    - **Mudança em relação ao design:** o flashcard continua dentro do `Surface` do BEDS (o contrato manda usar os componentes do BEDS), então os cartões do BEDS mantêm o visual dele sobre o fundo da paleta.
  - **Transição de abas (B2):** `TabTransition` com `key={tab}`. A aba nova monta na hora, sem esperar a antiga sair, e faz fade com subida de 8 px em 180 ms. Conferido: logo depois do clique o conteúdo novo já está montado e aparecendo; com movimento reduzido entra direto (opacidade 1).
  - **Métricas (B6):** o `Metric` do BEDS só anima quando o valor *muda* depois de montado, então "passar `numericValue`" não bastava (o design previa que bastaria). O `CountingMetric` monta em 0 e vai ao valor no frame seguinte, e a contagem é a do próprio BEDS.
    - Conferido: `0 → 2 → 3 → 4` em cerca de 0,8 s ao abrir o Progresso.
    - Com movimento reduzido, entra direto no valor.
    - "Acerto em 30 dias" sem revisões continua "—".
  - **Auditoria do app** (`scripts/app-audit.mjs`) nas 5 abas, em claro, escuro, movimento reduzido e escuro em 375 px: nenhuma falha de contraste, sem rolagem horizontal.
  - A landing foi auditada de novo depois da mudança no `styles.css`: nenhuma falha.
  - Capturas da landing refeitas com o app na paleta nova.
  - JS: 162,4 KB gzip.
- **T11 (2026-10-17):**
  - `src/fx/celebrate.js`: duas rajadas laterais de `canvas-confetti` (cerca de 1 s) nas cores da paleta, com `disableForReducedMotion`. Dois eventos ao mesmo tempo (a última revisão que também bate a meta) dão uma rajada só.
  - **Meta semanal:** `goalJustMet(prev, next)` em `progress.js` (4 testes). Só dispara quando estudar faz a semana chegar à meta. Não dispara ao reabrir o app, nem ao baixar a meta, nem depois de já cumprida.
    - O aviso usa o `Toaster` do próprio BEDS: "Meta da semana cumprida: X de Y dias." (tom success, com papel de status para leitor de tela).
  - **Fim da revisão:** confete quando a sessão termina, isto é, quando a última carta é respondida e a mensagem "Sessão concluída" aparece. Abrir a aba sem nada para revisar não dispara.
  - **Conferido em Edge headless com teclado real e dados de exemplo:**
    - check-in que bate a meta: confete e aviso; o canvas some sozinho;
    - recarregar: nada de novo;
    - 3 cartas respondidas com Enter e 3: confete e "Sessão concluída";
    - com movimento reduzido: nenhum confete, o aviso aparece igual.
  - JS: 168,3 KB gzip (+5,9 KB do Toaster e do confete; limite 217). 135 testes.

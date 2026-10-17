# 005 — Identidade visual e efeitos: requisitos

Status: aprovado (2026-10-17)

## Objetivo

Dar ao Greywords cara de produto profissional: landing com mais informação e identidade própria, paleta com personalidade e efeitos de movimento (inspirados no [21st.dev](https://21st.dev)) na landing e no app, sem perder acessibilidade, desempenho nem o contrato do BEDS.

## Por que

- A landing tem pouca informação: proposta, 3 passos, 4 diferenciais, roadmap e FAQ. Não mostra o app de verdade, nem o porquê do método, nem como foi feito (o ângulo de dados do post no LinkedIn).
- A paleta hoje é o cinza neutro do BEDS mais um único laranja (`#e8590c`). Funciona, mas não tem personalidade.
- Quase não há movimento: 2 animações em CSS na landing e nenhuma no app.

## O que foi verificado antes (2026-10-16)

| Achado | Consequência |
| --- | --- |
| Os componentes do 21st.dev usam Tailwind, shadcn e ícones lucide | O `npm run check:ui` **proíbe** importar `tailwindcss` e `lucide` em `src/`. Não dá para colar o código como vem: cada efeito é **reescrito** em CSS próprio (`gw-*`) e `motion/react` |
| O `motion` (13.5.1) já vem instalado junto com o BEDS, que o usa como motor de animação | Usar o mesmo pacote, declarado como dependência direta do app; nada de outra biblioteca de animação |
| No 21st.dev a licença é por componente: a padrão é MIT, mas alguns aparecem como "unknown" | Só servem de base para código os componentes MIT, com crédito (autor, link e licença) em um arquivo de créditos. Os "unknown" servem só como referência visual |
| O BEDS não deixa redefinir `--es-*` nem estilizar `.es-*` | A paleta nova vive em tokens do app (`--gw-*`) e pinta só o que é do app (fundos, seções, ilustrações, destaques). Os controles do BEDS continuam com o visual dele |

## R1 — Identidade visual

**História:** Como visitante, quero sentir que o Greywords é um produto cuidado, com personalidade, e não um modelo genérico.

- R1.1 O SISTEMA DEVE ter uma paleta própria (tokens `--gw-*`) derivada do laranja do greyhound, com versões para tema claro e escuro (ver **D1**).
- R1.2 A paleta DEVE ter contraste mínimo AA (4,5:1 em texto, 3:1 em elementos gráficos) nos dois temas.
- R1.3 Landing e app DEVEM usar a mesma paleta, para parecerem o mesmo produto.
- R1.4 O greyhound DEVE aparecer como elemento de identidade além do logo (ilustração, padrão de fundo ou animação de entrada), sem pesar na leitura.

## R2 — Landing mais informativa

**História:** Como visitante, quero entender o que o Greywords faz, por que funciona e como foi feito antes de abrir o app.

- R2.1 A landing DEVE mostrar o app real: busca, revisão, progresso e vídeos, com capturas ou demonstrações interativas (ver **D5**).
- R2.2 A landing DEVE ter uma seção "Por que funciona" que explique repetição espaçada, curva do esquecimento e aprendizado com imagem, **com link para a fonte de cada afirmação** e sem prometer resultado.
- R2.3 A landing DEVE ter uma seção "Como foi feito" (stack, APIs abertas e gratuitas, medição da qualidade das imagens com os números reais da spec 003), que sirva de vitrine para o portfólio.
- R2.4 A landing DEVE trazer só números verdadeiros e verificáveis (ex.: quantas APIs gratuitas, zero cadastro, tamanho da lista NGSL). Nada de usuários, depoimentos ou resultados inventados (regra do projeto).
- R2.5 O roadmap DEVE ser atualizado (frases de exemplo; vídeos só quando houver catálogo real).

## R3 — Efeitos na landing

**História:** Como visitante, quero uma página com movimento e acabamento de produto profissional.

- R3.1 O hero DEVE ter um fundo com movimento sutil (ver **D4**) e um título com entrada animada.
- R3.2 As seções DEVEM aparecer com animação ao rolar a página.
- R3.3 Cartões (passos, diferenciais) DEVEM reagir ao mouse (ex.: brilho que segue o cursor, borda animada).
- R3.4 A landing DEVE ter pelo menos um elemento contínuo que mostre o produto (ex.: faixa rolando com palavras e imagens).
- R3.5 Os números da landing DEVEM contar até o valor quando aparecerem na tela.
- R3.6 O botão principal (CTA) DEVE ter um destaque animado.

## R4 — Efeitos no app

**História:** Como estudante, quero que estudar seja gostoso: retorno visual quando faço algo e transições suaves.

- R4.1 QUANDO o usuário revelar o cartão na revisão, O SISTEMA DEVE virar o flashcard com animação.
- R4.2 QUANDO o usuário trocar de aba, O SISTEMA DEVE fazer uma transição curta entre os conteúdos.
- R4.3 QUANDO o usuário escolher uma imagem na busca, O SISTEMA DEVE dar retorno animado (marca e ordem da escolha).
- R4.4 ENQUANTO as imagens carregam, O SISTEMA DEVE mostrar um esqueleto com brilho no lugar da grade.
- R4.5 QUANDO o usuário bater a meta da semana ou terminar uma sessão de revisão, O SISTEMA DEVE mostrar uma celebração curta.
- R4.6 As métricas do Progresso DEVEM contar até o valor ao abrir a aba.
- R4.7 Nenhum efeito do app pode atrasar uma ação: a nota da revisão, salvar e buscar respondem na hora, e a animação acontece por cima.

## R5 — Acessibilidade e desempenho

- R5.1 SE o usuário pedir menos movimento (`prefers-reduced-motion`), ENTÃO O SISTEMA DEVE trocar os movimentos por aparições sem deslocamento ou por mudança direta, sem perder nenhuma informação.
- R5.2 Nenhuma informação ou ação pode depender só da animação; teclado, foco visível e leitor de tela continuam funcionando.
- R5.3 Efeitos contínuos (fundo do hero, faixa rolando) DEVEM pausar fora da tela e com a aba em segundo plano.
- R5.4 O JavaScript da landing não pode crescer mais que **60 KB (gzip)** em relação a hoje, e o carregamento não pode ter saltos de layout causados pelos efeitos.
- R5.5 Tudo DEVE funcionar em 375 px, nos temas claro e escuro.

## R6 — Contrato e créditos

- R6.1 `npm run check:ui` DEVE continuar com 0 violações.
- R6.2 Cada efeito baseado em componente do 21st.dev DEVE ter crédito registrado (nome, autor, link, licença e data) em `CREDITS.md`.
- R6.3 Nenhum código de componente com licença desconhecida entra no projeto.

## Decisões das dúvidas

| Dúvida | Decisão |
| --- | --- |
| D1 — Direção da paleta | **Quente e editorial**: laranja do greyhound + creme, terracota e marrom-café; tema escuro em carvão quente |
| D2 — Ordem | **Landing primeiro** (R1–R3, R5, R6); o app (R4) numa segunda etapa, com tarefas próprias no mesmo `tasks.md` |
| D3 — Quais efeitos | Lista curta de componentes MIT do 21st.dev no `design.md`, com link de cada um; o usuário aprova ou corta |
| D4 — Fundo do hero | **Degradê animado em CSS** (leve, fácil de pausar) |
| D5 — Mostrar o app | mistura, com capturas reais em moldura para revisão, progresso e vídeos e a demo interativa atual para a busca |
| D6 — Fonte de títulos | fonte de títulos própria com licença aberta (OFL), servida pelo próprio site, sem chamar Google Fonts; o corpo do texto continua com a fonte do BEDS |

## Fora do escopo

Mudar o visual dos controles do BEDS (botões, campos, diálogos), novas funções do app, sons, modo "gamificado" com pontos e níveis.

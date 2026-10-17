# Greywords — estado do projeto

Atualizado em 2026-10-17. **Leia este arquivo antes de continuar o trabalho.** As regras do projeto estão no [CLAUDE.md](CLAUDE.md); o detalhe de cada feature está em [specs/](specs/README.md).

## Em uma frase

App gratuito (React + Vite, sem servidor, dados no navegador) para aprender vocabulário em inglês **pela imagem**, com revisão espaçada, metas semanais e vídeos do TED por nível. Interface com o design system **BEDS**, marca **Greywords** (greyhound laranja `#e8590c`). Peça de portfólio para o LinkedIn (ângulo de dados).

## Como retomar

```bash
cd C:\Users\joaog\OneDrive\Documentos\englishPlataform
npm install          # se faltar node_modules
npm run dev          # http://localhost:5173   (#/ landing · #/app app)
npm test             # 191 testes de lógica
npm run build
npm run check:ui     # contrato do BEDS: precisa dar 0 violations
```

Fluxo de trabalho: **método de spec** (requisitos → design → tarefas → código, cada etapa aprovada pelo usuário). Para continuar, diga: "lê o STATUS.md e continua a próxima tarefa".

## Onde paramos (próximos passos, em ordem)

Atualizado em 2026-10-17, depois da T11a da spec 003.

1. **Spec 004 (frases de exemplo), a próxima:** tarefas aprovadas e todas liberadas (a T6 da 003 já saiu). **T1 feita** (`src/examples.js`, 11 testes). Próxima: T2 (`fetchExamples` no `api.js`, Tatoeba). Quando o Tatoeba entrar, trocar "7 serviços" para 8 na landing (`NUMBERS` em `Landing.jsx`) e incluir o Tatoeba no diagrama.
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
| [005-identidade-efeitos](specs/005-identidade-efeitos/requirements.md) | Paleta própria, landing mais informativa, efeitos inspirados no 21st.dev | etapa A pronta; etapa B: T10–T11 feitas; **T12/T13 esperam as specs 003 e 004** |

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
- **Openverse sem chave**: 20 requisições/min e 200/dia **por IP** (cada usuário tem o seu). A spec 003 limita a 2 consultas por busca.
- **Tatoeba** (spec 004): a API `api.tatoeba.org/unstable` funciona no navegador, sem chave; usar `trans:lang=por&showtrans=matching` (~9 KB); `showtrans=all` pesa ~105 KB.
- **Medição das imagens** (spec 003): "antes" (Openverse + Wikimedia) = **82/180 certeiras (45,6%)**; "depois" (Unsplash) = **173/180 (96,1%)**; 0 impróprias nas duas. O usuário usa o botão "Imprópria" para marcar as erradas: confira as imagens antes de registrar.
- **21st.dev** (spec 005): componentes vêm em Tailwind + lucide, que o `check:ui` proíbe em `src/`. Cada efeito é reescrito em CSS `gw-*` + `motion/react` (já instalado pelo BEDS). Código só de componente MIT, com crédito em `CREDITS.md`. Licença conferida na página `https://21st.dev/<autor>/components/<nome>.md`. O `motion` já vai no pacote final pelo BEDS, e o `Metric` do BEDS já anima números (`numericValue` + `formatValue`).
- **Contraste do laranja**: `#e8590c` dá 3,3:1 no creme e 3,6:1 com texto branco, o que reprova para texto pequeno. Para texto e para o CTA, usar `--gw-brand-ink` (`#b4430a` no claro, `#ff8a4c` no escuro).
- **Build hoje**: JS 157,4 KB gzip (linha de base do orçamento da spec 005).
- Nenhuma API paga ou com chave; nada de depoimentos ou números inventados na landing.

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
- No Edge headless, foco por código não vale enquanto a janela não tem foco: para digitar, clique com `Input.dispatchMouseEvent` e mande o Enter com `text: ''`.
- O `localStorage` é separado por porta: dados de teste em `:5180` não aparecem em `:5173`.

## Mapa rápido de arquivos novos (além do CLAUDE.md)

- `src/imageQuery.js` (+ teste): monta consultas de imagem com contexto (spec 003).
- `bench/images/`: medição das imagens (`node bench/images/run.mjs antes`); saída e cache fora do git.
- `specs/003-imagens-certeiras/medicao.md`: resultados da medição.
- `catalog/`: pipeline offline dos vídeos (`npm run catalog:check`, `npm run catalog`), `SUGESTOES.md` com 42 talks sugeridos.
- `src/dev/catalog.sample.json`: catálogo de exemplo, só no modo dev.

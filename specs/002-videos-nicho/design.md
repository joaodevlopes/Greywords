# 002 — Vídeos por nicho, no seu nível: design

Status: aprovado (2026-10-16)

## Visão geral

Duas partes independentes, ligadas por um arquivo JSON:

```
NO SEU COMPUTADOR (de vez em quando)              NO SITE (sempre)
┌──────────────────────────────────────┐          ┌─────────────────────────────────┐
│ catalog/sources.json  (lista curada) │          │ aba Vídeos                       │
│        │                             │          │   fetch('/catalog.json')         │
│        ▼                             │          │   + nichos, nível, assistidos    │
│ npm run catalog                      │          │     (localStorage)               │
│   1. lê sources.json + transcrições  │          │        │                         │
│   2. tokeniza e lematiza             │  ──────▶ │        ▼                         │
│   3. calcula palavras/min, % raras   │  public/ │   lista filtrada e ordenada      │
│   4. classifica Fácil/Médio/Difícil  │  catalog │   → player + palavras-chave      │
│   5. escolhe palavras-chave          │  .json   │   → "Assisti" conta no Progresso │
│ (transcrições ficam só em cache)     │          └─────────────────────────────────┘
└──────────────────────────────────────┘
```

O app nunca chama API de vídeo nem usa chave. Tudo que é pesado roda uma vez, no script.

## Parte 1 — Pipeline do catálogo (`catalog/`)

Node (mesma stack do app; não depende de Python instalado). Roda com `npm run catalog`.

| Arquivo | Papel |
| --- | --- |
| `catalog/sources.json` | **Lista curada à mão**: por talk, `tedSlug`, `title`, `speaker`, `durationSec`, `youtubeId`, `niches` |
| `catalog/build.mjs` | Orquestra: lê fontes locais → confere vídeo no oEmbed do YouTube → calcula → escreve `public/catalog.json` |
| `catalog/HOW-TO.md` | Passo a passo da curadoria manual (ver "Achados da T1") |
| `catalog/text.mjs` | Funções puras: tokenizar, lematizar, contar, nível, palavras-chave (testadas com `node --test`) |
| `catalog/ngsl.txt` | Lista de palavras comuns (NGSL 1.2 lematizada), com crédito |
| `catalog/transcripts/` | Transcrições coladas à mão — **no `.gitignore`, nunca publicadas** |

### Por que lista curada e não busca automática

Escolher 10–15 talks por nicho à mão garante qualidade e permite casar cada talk do TED com o vídeo do **canal oficial do TED no YouTube** (`youtubeId`), que é o que vai no player (ver "Licença e crédito"). O script avisa se um slug não existir ou não tiver transcrição.

### Métricas (R3.2)

- **Tokens**: palavras da transcrição em minúsculas, sem pontuação nem números; contrações separadas (`don't` → `do`, `not`).
- **Lema**: forma base por regras simples (plural, `-ed`, `-ing`, `-er/-est`) + exceções da própria NGSL lematizada.
- **Palavras por minuto** = tokens ÷ (duração em segundos ÷ 60).
- **% pouco comuns** = tokens cujo lema não está na NGSL ÷ tokens. Nomes próprios (palavra com maiúscula que não começa frase) não contam.

### Nível (R3.1, D2)

Regra inicial, **a calibrar** com os dados reais (o script imprime a distribuição das duas métricas para escolher os cortes):

| Nível | Regra inicial |
| --- | --- |
| Fácil | ≤ 140 palavras/min **e** ≤ 6% pouco comuns |
| Difícil | > 170 palavras/min **ou** > 12% pouco comuns |
| Médio | o resto |

Os cortes ficam numa constante em `text.mjs` e são registrados no `tasks.md` depois da calibração.

### Palavras-chave (R6)

Até 8 lemas fora da NGSL, mais frequentes no talk, ignorando nomes próprios e palavras com menos de 4 letras. São palavras isoladas, não trechos da transcrição.

### Saída: `public/catalog.json`

```js
{
  generatedAt: '2026-10-20',
  levelRule: { easy: { maxWpm: 140, maxRare: 0.06 }, hard: { minWpm: 170, minRare: 0.12 } },
  niches: [{ id: 'tech', label: 'Tecnologia' }, ...],          // ordem de exibição
  videos: [{
    id: 'ted:sir_ken_robinson_do_schools_kill_creativity',
    niches: ['science'],
    title, speaker, durationSec,
    youtubeId: 'iG9CE55wbtY',
    tedUrl: 'https://www.ted.com/talks/…',
    thumb: 'https://i.ytimg.com/vi/<youtubeId>/mqdefault.jpg',
    wpm: 152, rareRatio: 0.081, level: 'medium',
    keywords: ['creativity', 'literacy', …],
  }],
}
```

Sem transcrição no JSON (licença "sem derivados" e tamanho do arquivo).

## Parte 2 — App

### Navegação: quinta aba

Hoje as 4 abas ocupam 285 px dos 375 do celular; uma quinta não cabe com os rótulos atuais. Plano:
1. Rótulos curtos: **Busca · Palavras · Revisão · Vídeos · Progresso**. Testar em 375 px.
2. Se ainda não couber: no celular (< 600 px) a navegação vira o `Dock` do BEDS fixo embaixo; no desktop continua o `SegmentedControl`.

### Dados novos (`localStorage`, via `migrate()`)

```js
{
  ...,                                   // words, log, goals, activityDays, checkinDays
  videoNiches: ['tech', 'games'],        // R1
  userLevel: 'intermediate' | null,      // R4 — beginner | intermediate | advanced
  watchedVideos: { 'ted:…': '2026-10-16' }, // R5 — dia em que marcou
  hideWatched: false,                    // R5.4
}
```

- `migrate()` cria os campos vazios/padrão em dados antigos; teste como na spec 001.
- Marcar assistido grava o dia em `activityDays` (R5.3, D5) com `withDay`. Desfazer remove de `watchedVideos`, mas **não** tira o dia de `activityDays` (pode haver outra atividade no dia; mesma regra do check-in).
- Exportação já leva o estado inteiro (R7.2).

### Ordenação (R2.3)

Nível do usuário vira alvo: Iniciante → Fácil, Intermediário → Médio, Avançado → Difícil. Ordena por distância entre o nível do vídeo e o alvo (0, 1, 2), depois por duração (mais curtos primeiro). Sem nível escolhido, ordena por duração.

### Componentes

| Arquivo | O que faz | BEDS |
| --- | --- | --- |
| `src/components/Videos.jsx` | Carrega o catálogo, guarda filtros, lista | `EmptyState`, `Notice`, `Skeleton`, `Select` (nicho), `SegmentedControl` (nível: Todos/Fácil/Médio/Difícil), `Switch` (esconder assistidos) |
| `src/components/VideoSetup.jsx` | Primeira vez: escolher nichos (R1.1) e nível (R4) | `Checkbox` por nicho, `SegmentedControl` de nível, `Button` |
| `src/components/VideoCard.jsx` | Miniatura, título, canal, duração, nível, "assistido" | `Badge` (nível com texto, não só cor) |
| `src/components/VideoDialog.jsx` | Player, números do nível, palavras-chave, assistido | `Dialog`, `Button`, `Badge` |
| `src/videos.js` | Funções puras: ordenar, filtrar, rótulos de nível (testadas) | — |

- **Player (D4):** `iframe` de `https://www.youtube-nocookie.com/embed/<youtubeId>`, só montado quando o `Dialog` abre (nada carrega do YouTube na lista além das miniaturas). Link "Ver no TED" e "Abrir no YouTube".
- **Números do nível (R3.3, R3.4):** "152 palavras/min · 8% de palavras pouco comuns · estimativa calculada pela transcrição".
- **Palavras-chave (R6):** as que não estão no dicionário viram `Button` compactos; tocar leva para a aba Busca já pesquisando a palavra (`Search` ganha a prop `initialQuery`).
- **Estados:** carregando (`Skeleton`), falha no `fetch` (`Notice` + tentar de novo), filtro sem resultado (R2.5, `EmptyState` com "Mostrar todos os níveis").

## Licença e crédito (R7.4)

Leitura minha das regras, não é parecer jurídico:

- **TED (CC BY–NC–ND 4.0):** uso não comercial com crédito ao TED, link para o TED.com e para o talk. "Sem derivados": por isso a transcrição não é publicada nem alterada; o app mostra só números calculados e até 8 palavras soltas.
- **Player:** a política do TED autoriza o player do próprio TED em sites onde compartilhar talks não é o propósito principal, e um catálogo de talks fica perto desse limite. Por isso o player é o do YouTube, tocando o vídeo do canal oficial do TED (incorporação permitida pelo YouTube). Se isso não parecer seguro, a alternativa é só linkar (fácil de trocar).
- **Crédito na tela:** "Talks: TED (ted.com), licença CC BY–NC–ND 4.0" na aba Vídeos e em cada vídeo; crédito da NGSL na landing e no README.
- **NGSL:** confirmar a licença da lista principal antes de incluir o arquivo (T1). Se não permitir redistribuir, o script baixa a lista na hora de rodar e ela não vai para o repositório.

## Achados da T1 (2026-10-16)

**NGSL — ok.** Licença CC BY-SA 4.0 (newgeneralservicelist.com): pode ir para o repositório com crédito, e a lista (e qualquer versão alterada dela) continua CC BY-SA; o código do app não é afetado.
O arquivo "lemmatized for research" (`NGSL_12_lemmatized_for_research.csv`, 2.810 lemas, ~10 mil formas) traz cada lema com todas as formas, inclusive irregulares ("go, went, gone…", "child, children") e pedaços de contração ("isn", "aren").
Isso troca as regras de lematização por uma consulta forma → lema. Mais `SUP_lemmatized.csv` (dias e meses).

**TED: os dados estão acessíveis, mas o acesso automatizado é proibido.**
- Tecnicamente, a página de um talk tem tudo no JSON `__NEXT_DATA__`: título, palestrante, duração em segundos, tópicos, transcrição em trechos com tempo (com marcações como "(Laughter)") e até o ID do vídeo no canal oficial do TED no YouTube (`videoPlayerData.external`). O oEmbed público do YouTube confirma, sem chave, que o canal é o TED.
- Porém os **Termos de Uso do TED.com, seção 6.4**, proíbem acessar ou coletar conteúdo do TED com meios automatizados (scrapers, bots, crawlers) e baixar ou usar o conteúdo sem licença escrita, inclusive para pesquisa não comercial. A seção 6.3 também exclui do uso educacional publicar ou hospedar conteúdo do TED em sites externos.
- Conclusão: o adaptador automático `catalog/ted.mjs` (T3) **não pode** ser feito como planejado.

**Decisão (2026-10-16): curadoria manual.** O usuário abre cada talk no navegador, copia os dados e a transcrição à mão e salva localmente. O script **nunca acessa o TED.com**; a única chamada de rede é o oEmbed público do YouTube, para conferir que o vídeo é do canal TED. O resto do design vale, com as mudanças abaixo.

| Antes | Agora |
| --- | --- |
| `catalog/ted.mjs` baixa metadados e transcrição | Não existe. `catalog/sources.json` traz, digitados à mão: `tedSlug`, `title`, `speaker`, `durationSec`, `youtubeId`, `niches` |
| `catalog/.cache/` com transcrições baixadas | `catalog/transcripts/<tedSlug>.txt`, colados à mão, **no `.gitignore`** (seção 6.3 dos Termos: não hospedar conteúdo do TED fora do TED) |
| 10 a 15 talks por nicho | Cerca de 5 por nicho na v1 |
| Lematização por regras | Consulta forma → lema na NGSL; regras simples só para palavras fora da NGSL (palavras-chave) |
| — | `catalog/HOW-TO.md`: passo a passo de como escolher um talk e copiar os dados e a transcrição |

Consequência: só quem tem as transcrições locais consegue regenerar o `catalog.json`; o arquivo gerado (sem transcrição) vai para o repositório normalmente.

## Rastreabilidade

| Requisito | Onde |
| --- | --- |
| R1.1–R1.3 | `VideoSetup.jsx`, `videoNiches` |
| R2.1–R2.5 | `Videos.jsx`, `VideoCard.jsx`, `videos.js` |
| R3.1–R3.4 | `catalog/text.mjs` (cálculo), `VideoDialog.jsx` (explicação) |
| R4.1–R4.2 | `VideoSetup.jsx`, `userLevel` |
| R5.1–R5.4 | `VideoDialog.jsx`, `watchedVideos`, `hideWatched`, `withDay` |
| R6.1–R6.2 | `keywords` no catálogo, `Search initialQuery` |
| R7.1–R7.4 | `migrate()`, `serializeState`, créditos |

## Verificação planejada

- `node --test` para `catalog/text.mjs` (tokenização, contrações, lemas, nomes próprios, nível nos limites) e `src/videos.js` (ordenação, filtros).
- Rodar `npm run catalog` de verdade e conferir: todos os vídeos com números plausíveis, distribuição impressa, JSON sem transcrição, tamanho razoável (< 200 KB).
- Navegador: primeira vez (nichos + nível), filtros, vazio, falha de carregamento, player abre e fecha, assistido conta no Progresso, palavra-chave abre a Busca, 375 px, claro e escuro.
- `npm run build`, `npm test`, `npm run check:ui`.

## Riscos

| Risco | Plano |
| --- | --- |
| Curadoria manual dar trabalho demais | v1 com ~5 talks por nicho; `HOW-TO.md` curto; validação aponta exatamente o que falta |
| Poucos talks em "games" ou "cinema e séries" | O nicho fica com o que houver; `sources.json` aceita novas fontes depois |
| Cortes de nível ruins | Calibrar com a distribuição real antes de fechar |
| Quinta aba não cabe no celular | `Dock` do BEDS no celular |

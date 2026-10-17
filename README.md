# Greywords

Plataforma gratuita para aprender vocabulário em inglês **pela imagem, não pela tradução**.

- `#/` — landing page explicando o sistema
- `#/app` — o app

## Como funciona

1. **Buscar** — digite uma palavra. Aparecem fotos do Unsplash (com Openverse e Wikimedia Commons de reserva), definição em inglês, pronúncia e até 5 frases reais com a palavra (Tatoeba). A tradução fica escondida até você pedir. "Refinar imagens" troca a busca das fotos, e "Esconder" tira uma foto que não serve. Em palavras sem imagem, como "however", as frases aparecem no lugar das fotos.
2. **Escolher** — clique nas até 3 imagens que mais lembram a palavra. Elas viram a frente do flashcard. Dá para guardar até 2 frases junto.
3. **Revisar** — repetição espaçada (SM-2, mesma família do Anki). Você vê as imagens (ou, nas palavras abstratas e sem imagem, completa uma frase com lacuna), tenta lembrar a palavra e dá uma nota: Errei / Difícil / Bom / Fácil. O intervalo até a próxima revisão se ajusta.
4. **Dicionário** — todas as palavras salvas, status (nova / aprendendo / dominada), filtro, detalhe e exportação em JSON.
5. **Progresso** — meta semanal (1 a 7 dias), check-in "Estudei hoje", calendário dos dias estudados, semanas seguidas com a meta cumprida e as métricas das palavras. Revisar ou salvar uma palavra já conta o dia sozinho.
6. **Vídeos** — talks do TED nos nichos que você escolhe, ordenados pelo seu nível. O nível (Fácil / Médio / Difícil) é estimado pela transcrição: palavras por minuto e % de palavras fora da lista NGSL das mais comuns. Assistir conta o dia no Progresso, e as palavras-chave do vídeo abrem direto na busca.

Atalhos na revisão: `Enter` mostra a resposta, `1`–`4` dão a nota.

## Stack

- React + Vite, sem backend
- Interface com o design system [BEDS](https://github.com/meunomeebero/beds) `0.2.0-rc.2`, instalado pelo arquivo imutável da release (hash no `package-lock.json`)
  - Componentes do BEDS para controles (botões, campos, abas, diálogo, métricas, badges, estados vazios)
  - Layout e identidade (landing, grids, cor de marca `#e8590c`) são do app e só leem os tokens `--es-*`
- Identidade própria: paleta quente em tokens `--gw-*` (`src/brand/palette.css`, contraste AA conferido por teste) e títulos em Fraunces
- Efeitos com [Motion](https://motion.dev) e CSS próprio (`src/fx/`), reescritos a partir de componentes MIT do [21st.dev](https://21st.dev); todos respeitam `prefers-reduced-motion` e pausam fora da tela
- Dados no `localStorage` (exportáveis em JSON)
- APIs gratuitas, todas com timeout e alternativa de reserva. Só o Unsplash pede chave, e ela fica num intermediário (`server/images.js`: plugin do Vite no dev, Worker do Cloudflare em produção), nunca no navegador:

| Dado | Principal | Reserva |
| --- | --- | --- |
| Imagens | Unsplash (pelo intermediário) | Openverse (só fotos), depois Wikimedia Commons |
| Definição | dictionaryapi.dev | Wiktionary (pedido em paralelo se o primeiro demorar 1,2 s) |
| Pronúncia | áudio do dictionaryapi.dev | `speechSynthesis` do navegador |
| Tradução | MyMemory | — |
| Frases de exemplo | Tatoeba (`word_count=4-12`, tradução em português primeiro) | exemplos do próprio dicionário |

### Qualidade das imagens (medida)

20 palavras de teste, 9 imagens cada, marcadas sem ver o título ([medição completa](specs/003-imagens-certeiras/medicao.md)):

| Fonte | Certeiras | Impróprias |
| --- | --- | --- |
| Openverse + Wikimedia (antes) | 82/180 (45,6%) | 0 |
| Unsplash (depois) | 173/180 (96,1%) | 0 |

Para rodar o intermediário no `npm run dev`, crie `.env.local` com `UNSPLASH_ACCESS_KEY=...` (Access Key de um app em [unsplash.com/developers](https://unsplash.com/developers)). Sem ela, o app usa o Openverse.

### Catálogo de vídeos (pipeline offline)

O app não chama nenhuma API de vídeo. Um script roda no computador de quem faz a curadoria e gera `public/catalog.json`:

1. `catalog/sources.json`: talks escolhidos à mão (slug do TED, título, palestrante, duração, ID no YouTube, nichos)
2. `catalog/transcripts/`: transcrições coladas à mão (fora do git; os Termos do TED proíbem coleta automática e hospedagem)
3. `npm run catalog:check`: valida tudo e confere no oEmbed do YouTube que o vídeo é do canal oficial do TED
4. `npm run catalog`: tokeniza, lematiza com a NGSL, calcula palavras/min e % de palavras pouco comuns, classifica o nível, escolhe palavras-chave e mostra a distribuição para calibrar os cortes

Passo a passo em [catalog/HOW-TO.md](catalog/HOW-TO.md).

### Créditos

- Efeitos visuais, fontes e ferramentas: [CREDITS.md](CREDITS.md)
- Vídeos: [TED](https://www.ted.com), licença CC BY–NC–ND 4.0 (transcrições não são publicadas; o catálogo leva só números e palavras soltas)
- Frases de exemplo: [Tatoeba](https://tatoeba.org), licenças CC BY 2.0 FR e CC0, com o autor e o link de cada frase
- Lista de palavras comuns: [New General Service List](https://www.newgeneralservicelist.com) (Browne, Culligan e Phillips), CC BY-SA 4.0, em `catalog/ngsl/`

## Rodar

```bash
npm install
npm run dev
```

Checagem do contrato do BEDS (sem sobrescrever estilos internos do design system):

```bash
npm run check:ui
```

Capturas do app usadas na landing (`public/landing/`), com palavras de exemplo e o Edge em modo headless, com o servidor de desenvolvimento rodando:

```bash
node scripts/capture.mjs
```

Conferir efeitos sem o navegador visível (movimento reduzido, 375 px, hover): `node scripts/edge-check.mjs <url> <script.js> [reduced|mobile|hover]`.

## Próximos passos

- Completar a curadoria do catálogo de vídeos (cerca de 5 talks por nicho)
- Login + sync (Supabase) para usar em mais de um dispositivo

## Desenvolvimento

Contexto do projeto e regras: [CLAUDE.md](CLAUDE.md). Features novas seguem o método de spec: [specs/](specs/README.md).

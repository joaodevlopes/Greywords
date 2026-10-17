# Como adicionar um talk ao catálogo (curadoria manual)

## Jeito rápido: a página de curadoria (desde 2026-10-17)

Os 24 talks (3 por nicho) já estão no `sources.json`, com o vídeo conferido no canal oficial do TED. Falta só a transcrição e a duração de cada um:

1. Rode `npm run dev` e abra `http://localhost:5173/#/dev/curadoria`.
2. Em cada talk: "Abrir no TED" (ou "Procurar no TED", se o link der erro). Confira o endereço, copie a transcrição inteira, cole na página, confira a duração e clique em "Salvar".
3. Quando os 24 estiverem salvos, rode `npm run catalog:check` e `npm run catalog` (ou peça no chat).

A página grava `catalog/transcripts/<slug>.txt` (fora do git) e a duração no `sources.json`, pelo servidor de desenvolvimento. Ela não acessa o TED.com: os links só abrem o site no seu navegador.

## Jeito manual (para acrescentar talks fora da lista)

Os Termos de Uso do TED.com proíbem coletar conteúdo com programas automáticos. Por isso **você** copia os dados à mão, no navegador, e o script só lê os arquivos locais. Ver `specs/002-videos-nicho/design.md`, "Achados da T1".

## Passo a passo (uns 3 minutos por talk)

1. Escolha um talk em inglês em [ted.com/talks](https://www.ted.com/talks) (dá para filtrar por tópico). Prefira talks do palco principal do TED, porque são esses que estão no canal oficial do TED no YouTube.
2. Copie do link o **slug**: em `https://www.ted.com/talks/sir_ken_robinson_do_schools_kill_creativity`, o slug é `sir_ken_robinson_do_schools_kill_creativity`.
3. Anote **título**, **palestrante** e **duração** (ex.: 19:11 vira `1151` segundos: 19 × 60 + 11).
4. Clique em **"Read transcript"** (ou "Transcrição"), selecione o texto em inglês inteiro e cole num arquivo novo:
   `catalog/transcripts/<slug>.txt`. Pode deixar as marcações "(Laughter)" e os horários; o script ignora.
5. Ache o mesmo talk no YouTube, no canal **TED** (o oficial, não TEDx nem TED-Ed). Copie o ID que vem depois de `v=` no link (11 caracteres).
6. Acrescente em `catalog/sources.json`, dentro de `"talks"`:

```json
{
  "tedSlug": "sir_ken_robinson_do_schools_kill_creativity",
  "title": "Do schools kill creativity?",
  "speaker": "Sir Ken Robinson",
  "durationSec": 1151,
  "youtubeId": "iG9CE55wbtY",
  "niches": ["science"]
}
```

`niches` usa os ids da lista `"niches"` no topo do arquivo (tech, games, science, food, travel, sports, film, business). Um talk pode estar em mais de um nicho.

7. Rode a checagem:

```bash
npm run catalog:check
```

Ela aponta o que falta: campo vazio, transcrição faltando ou curta demais, vídeo inexistente ou de outro canal.

8. Quando todos os talks passarem, gere o catálogo:

```bash
npm run catalog
```

Ele grava `public/catalog.json` e mostra a distribuição de palavras/min e % de palavras pouco comuns, os níveis resultantes e uma sugestão de cortes pelos tercis.
Se os níveis ficarem desequilibrados (ex.: quase tudo "Difícil"), ajuste `LEVEL_RULE` em `catalog/text.mjs` e rode de novo.
Anote os cortes finais em `specs/002-videos-nicho/tasks.md` (T5).

Assim que o `public/catalog.json` existir, o app para de usar o catálogo de exemplo.

## O que vai e o que não vai para o repositório

- `catalog/sources.json` **vai** (só dados básicos e links).
- `catalog/transcripts/` **não vai** (está no `.gitignore`); a licença do TED não permite hospedar as transcrições fora do TED.
- O `public/catalog.json` gerado **vai**, e leva só números e até 8 palavras soltas por talk, nunca a transcrição.

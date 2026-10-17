# 000 — MVP: design

Status: implementado

## Arquitetura

```
index.html → main.jsx → Root.jsx (DesignSystemProvider, tema, rota por hash)
                          ├─ #/     → landing/Landing.jsx
                          └─ #/app  → App.jsx (estado + localStorage)
                                        ├─ Search.jsx      (R1)
                                        ├─ Dictionary.jsx  (R2)
                                        └─ Review.jsx      (R3)
```

- Rota por hash para funcionar em qualquer hospedagem estática (GitHub Pages, Vercel) sem configurar servidor.
- Estado único em `App.jsx`, salvo no `localStorage` a cada mudança (`storage.js`).

## Fontes de dados (`api.js`)

| Dado | Principal | Reserva | Timeout |
| --- | --- | --- | --- |
| Imagens | Openverse | Wikimedia Commons (em paralelo, completa até 12) | 5 s / 6 s |
| Definição | dictionaryapi.dev | Wiktionary (sem fonética nem áudio) | 4 s / 6 s |
| Pronúncia | áudio do dictionaryapi.dev | `speechSynthesis` en-US | — |
| Tradução | MyMemory (`en|pt-BR`) | — (mostra "indisponível") | 6 s |

Decisão: os serviços gratuitos falharam nos testes (Openverse lento, dictionaryapi.dev fora do ar), por isso todo fetch tem timeout e cada parte da tela carrega sozinha (R1.6, R1.7).

## Revisão espaçada (`srs.js`)

SM-2 com ajustes estilo Anki para as notas darem intervalos diferentes:

| Situação | Errei (1) | Difícil (3) | Bom (4) | Fácil (5) |
| --- | --- | --- | --- | --- |
| 1ª revisão | agora | 1 dia | 1 dia | 4 dias |
| 2ª revisão | agora | 4 dias | 6 dias | 8 dias |
| Depois | agora | intervalo × 1,2 | intervalo × ease | intervalo × ease × 1,3 |

- "Errei" zera a sequência, conta um erro (`lapses`) e a palavra volta na mesma sessão (R3.5).
- `ease` começa em 2,5, mínimo 1,3, ajustado pela fórmula do SM-2.
- Status: Nova (nunca revisada), Aprendendo (intervalo < 21 dias), Dominada (≥ 21 dias).

## Interface (BEDS)

| Necessidade | Componente |
| --- | --- |
| Navegação do app | `SegmentedControl` |
| Busca / filtro | `SearchField` + `Button type="submit"` |
| Ordenação | `Select variant="filter"` |
| Painel da palavra | `Surface role="panel"` |
| Estatísticas | `Metric` |
| Status e classe gramatical | `Badge` |
| Detalhe da palavra | `Dialog` com confirmação em dois passos para remover |
| Progresso da sessão | `ProgressBar tone="brand"` |
| Vazio / sessão concluída | `EmptyState` |
| Falhas | `Notice` |
| Demo da landing | `Tabs variant="settings"` |

Do app (CSS `gw-*`): grade de imagens selecionáveis, cartões do dicionário, layout do flashcard, toda a landing.

## Decisões registradas

- Tradução escondida por padrão (R1.3): é o diferencial; o usuário tenta entender pela imagem primeiro.
- Na revisão, só 2 definições aparecem, para os botões de nota caberem na tela.
- Ilustrações da landing são SVG originais; os intervalos da demo vêm do `srs.js` real (R4.3).
- Pacote `beds` instalado pela URL da release (hash no lockfile) em vez de copiar o tarball para o repositório.

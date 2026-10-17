# 002 — Vídeos por nicho, no seu nível: tarefas

Status: aprovado (2026-10-16) — em implementação

Uma tarefa por vez, nesta ordem. Cada uma termina com `npm test` e `npm run build` passando; as de interface também com `npm run check:ui` (0 violações).
"Pronto quando" é o teste que fecha a tarefa.

## Parte 1 — Pipeline do catálogo

- [x] **T1 — Licenças e fontes confirmadas**: confirmar a licença da NGSL 1.2 lematizada e decidir se o arquivo vai para o repositório ou é baixado pelo script; abrir um talk do TED à mão e descobrir de onde vêm título, palestrante, duração e transcrição.
  *Pronto quando:* licença da NGSL e forma de acesso ao TED registradas no `design.md` (seção "Licença e crédito"); se algo contradisser o design, paro e falo com você antes de seguir. — R7.4
  **Bloqueada (2026-10-16):** NGSL ok (CC BY-SA 4.0). Os Termos de Uso do TED.com (seção 6.4) proíbem acesso automatizado; ver "Achados da T1" no design. Decidido: curadoria manual (ver design). T3 e T4 reescritas abaixo.

- [x] **T2 — Funções de texto em `catalog/text.mjs`**: tokenizar, separar contrações, lematizar, ignorar nomes próprios, palavras por minuto, % pouco comuns, nível e palavras-chave.
  *Pronto quando:* testes com frases pequenas cobrem contrações, plural/-ed/-ing, nome próprio no meio da frase, números e pontuação, e cada limite de nível (exatamente 140 e 170 palavras/min, 6% e 12%). — R3.1, R3.2, R6.1

- [x] **T3 — Leitura das fontes locais**: `catalog/sources.json` (formato validado) e `catalog/transcripts/<tedSlug>.txt` (no `.gitignore`); limpeza de marcações como "(Laughter)" e "(Applause)"; conferência do `youtubeId` pelo oEmbed do YouTube (canal "TED"); `catalog/HOW-TO.md` com o passo a passo da curadoria.
  *Pronto quando:* com 2 talks de exemplo, entradas incompletas, transcrição faltando e vídeo de outro canal geram erros claros; o script não faz nenhuma requisição ao TED.com. — R2.2, R7.4

- [ ] **T4 — Curadoria (feita por você, com o HOW-TO)**: escolher cerca de 5 talks por nicho nos 8 nichos, preencher `sources.json` e colar cada transcrição. Claude pode sugerir talks por nicho, mas não acessa o TED.
  *Pronto quando:* a validação da T3 passa para todas as entradas; nichos com menos talks ficam registrados aqui. — R1.2, R2.2, D7

- [ ] **T5 — Gerar o catálogo (`catalog/build.mjs`, `npm run catalog`)**: escreve `public/catalog.json` e imprime a distribuição de palavras/min e % pouco comuns; calibrar os cortes de nível.
  *Pronto quando:* JSON com todos os vídeos válidos, sem transcrição, menor que 200 KB; cortes finais e a distribuição anotados neste arquivo; os três níveis aparecem em quantidade razoável. — R3.1, R3.2, R6.1
  *Código pronto (2026-10-16):* `catalog/catalog.mjs` (montagem pura, testada), `catalog/build.mjs` (`npm run catalog`), relatório com distribuição e sugestão pelos tercis; testado de ponta a ponta com transcrições sintéticas. **Falta:** rodar com a curadoria real (T4), calibrar `LEVEL_RULE` e anotar os cortes aqui.

## Parte 2 — App

- [x] **T6 — Dados e lógica**: campos novos em `migrate()` (`videoNiches`, `userLevel`, `watchedVideos`, `hideWatched`) com testes; `src/videos.js` com ordenação por nível e filtros, com testes.
  *Pronto quando:* estado antigo ganha os campos sem perder nada; ordenação e filtros batem com os casos de teste (sem nível, cada nível, filtro sem resultado). — R2.3, R2.4, R7.1

- [x] **T7 — Quinta aba "Vídeos"**: rótulos curtos (Busca · Palavras · Revisão · Vídeos · Progresso); se não couber em 375 px, `Dock` do BEDS no celular.
  *Pronto quando:* as cinco seções acessíveis em 375 px sem rolagem lateral e no desktop. — R2.1
  *Feito:* cinco abas com rótulos curtos cabem em 375 px (22–353 px com "Revisão · 2"); o `Dock` não foi necessário.

- [x] **T8 — Primeira vez (`VideoSetup.jsx`)**: escolher nichos e nível; botão para mudar depois.
  *Pronto quando:* sem nichos aparece a configuração; salvar mostra a lista; mudar nichos/nível atualiza a lista. — R1.1, R1.2, R1.3, R4.1, R4.2

- [x] **T9 — Lista (`Videos.jsx`, `VideoCard.jsx`)**: carregar `catalog.json`, cartões, filtros de nicho e nível, esconder assistidos, estados de carregando, erro e vazio.
  *Pronto quando:* ordem segue o nível escolhido; filtros funcionam; falha simulada no `fetch` mostra o aviso com "tentar de novo"; filtro vazio sugere afrouxar. — R2.1, R2.3, R2.4, R2.5, R5.4
  *Feito com o catálogo de exemplo* (`src/dev/catalog.sample.json`, só em `npm run dev`, fora do build): 9 talks reais do canal TED com números fictícios, até o catálogo real da T5.

- [x] **T10 — Vídeo aberto (`VideoDialog.jsx`)**: player sem cookies montado só ao abrir, números do nível com "estimativa", links para TED e YouTube, "Marquei como assistido" e desfazer.
  *Pronto quando:* player toca e para ao fechar; assistido aparece no cartão e conta o dia na aba Progresso; desfazer tira o selo sem apagar o dia. — R3.3, R3.4, R5.1, R5.2, R5.3, R7.4

- [x] **T11 — Palavras do vídeo**: palavras-chave fora do dicionário viram botões que abrem a Busca já pesquisando (`Search` com `initialQuery`).
  *Pronto quando:* palavra já salva não aparece; tocar numa palavra abre a Busca com resultado. — R6.1, R6.2

## Fechamento

- [ ] **T12 — Textos e créditos**: crédito do TED na aba e no vídeo; crédito da NGSL na landing e no README; landing tira "Vídeos do seu nicho" de "O que vem por aí" e cita a feature; atualizar `CLAUDE.md` (mapa, modelo de dados, como rodar o catálogo).
  *Pronto quando:* nenhuma referência aos vídeos como "em construção"; créditos visíveis. — R7.2, R7.4
  *Feito (2026-10-16), exceto um item:* crédito do TED na aba e em cada vídeo; crédito do TED e da NGSL no rodapé da landing e no README (com a seção do pipeline); `CLAUDE.md` com mapa, modelo de dados, comandos e a regra de nunca acessar o TED.com por script.
  **Fica para depois da T5:** a landing ainda mostra "Vídeos do seu nicho" em "O que vem por aí", o que hoje é verdade (o catálogo real não existe). Mudar quando o `public/catalog.json` for gerado.
  *Extra:* no site publicado, sem `catalog.json`, a aba mostra "Vídeos em preparação" em vez de um erro de conexão (conferido no build de produção com `vite preview`).

- [ ] **T13 — Verificação final**: `npm test`, `npm run build`, `npm run check:ui`; percorrer R1–R7 no navegador (claro, escuro, 375 px) e marcar a spec como `implementado`.
  *Pronto quando:* todos os critérios conferidos e listados abaixo, com o que não deu para verificar dito explicitamente.

## Verificação

**Parcial (2026-10-16)**, com o catálogo de exemplo do modo dev; falta repetir com o catálogo real.
`npm test` (75 testes), `npm run build` e `npm run check:ui` (30 arquivos, 0 violações) passando.

| Critério | Como foi conferido | Resultado |
| --- | --- | --- |
| R1.1–R1.3 | Sem nichos → configuração; botão desligado sem nicho; "Ajustar" reabre com a seleção atual | ok |
| R2.1 | Cartões com miniatura, título, palestrante, duração e nível | ok |
| R2.2 | Só entram talks validados (oEmbed do canal TED); o catálogo de exemplo usa 9 vídeos conferidos | ok, repetir com o real |
| R2.3 | Iniciante → fáceis primeiro, depois médios e difíceis, mais curtos antes (navegador + testes) | ok |
| R2.4 / R2.5 | Filtro Games, filtro Difícil, combinação vazia com "Mostrar todos"; nicho sem vídeos com "Ajustar nichos" | ok |
| R3.1 / R3.2 | Cálculo testado com textos sintéticos e a NGSL real | **pendente: dados reais e calibração (T5)** |
| R3.3 / R3.4 | Diálogo mostra palavras/min, % pouco comuns e o aviso de que é estimativa | ok |
| R4.1 / R4.2 | Nível escolhido na configuração e alterável em "Ajustar" | ok |
| R5.1 | Player sem cookies no diálogo, removido ao fechar | ok |
| R5.2 / R5.3 | Assistido marca o cartão e grava o dia; desfazer tira o selo sem apagar o dia | ok |
| R5.4 | "Esconder assistidos" esconde e fica salvo | ok |
| R6.1 / R6.2 | Palavra já no dicionário não aparece; tocar numa palavra abre a Busca com o resultado | ok |
| R7.1 / R7.2 | Migração com testes; exportação leva o estado inteiro | ok |
| R7.3 | Nenhuma avaliação ou contagem de visualizações na interface | ok |
| R7.4 | Crédito do TED na aba, no vídeo e na landing; links para TED e YouTube | ok |

Visual: claro, escuro e 375 px sem rolagem lateral (cinco abas cabem).

Para fechar: T4 (curadoria), T5 (gerar e calibrar), tirar os vídeos do "O que vem por aí" da landing, repetir R2.2 e R3.1–R3.2 com o catálogo real e marcar a spec como `implementado`.

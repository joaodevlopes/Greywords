# 004 — Frases de exemplo: tarefas

Status: aprovado (2026-10-17)

Uma tarefa por vez, nesta ordem. Cada uma termina com `npm test` e `npm run build` passando; as de interface também com `npm run check:ui` (0 violações).
**Ordem com a spec 003:** T1 a T3 não mexem na busca e podem ser feitas a qualquer momento. T4 em diante só **depois da T6 da spec 003**, porque as duas mexem em `Search.jsx`.

## Parte 1 — Base (não mexe nas telas existentes)

- [x] **T1 — Funções em `src/examples.js`**: `wordForms`, `findForm`, `pickExamples`, `highlight`, `cloze`, `fromDictionary`.
  *Pronto quando:* testes cobrem formas (study/studies/studied/studying, cook/cooked, box/boxes), frase sem forma descartada, filtro de 4 a 12 palavras, ordem (com PT primeiro, depois mais curta), sem repetidas, lacuna e conversão dos exemplos do dicionário. — R1.1, R1.2, R4.1
  *Feito (2026-10-17):* 11 testes em `src/examples.test.js`.
  - Formas cobertas: study/studies/studied/studying, cook/cooked (sem "cookked"), box/boxes, stop/stopped, use/used, go/goes; "went" não é adivinhado.
  - `findForm` só casa a palavra inteira ("Sunday" não conta como "sun").
  - `pickExamples` descarta frase repetida, não aprovada, sem a palavra ou fora de 4 a 12 palavras; ordem: com tradução primeiro, depois a mais curta.
  - `cloze`: "___, my shoulder hurts.". `fromDictionary` remove exemplos repetidos.
  - A frase traz `approved` para o filtro, que é tirado na saída.

- [x] **T2 — `fetchExamples` em `src/api.js`**: primeira chamada com tradução em português; segunda (sem tradução) só se faltarem frases; exata para palavras gramaticais; timeout de 6 s; cache em memória na sessão.
  *Pronto quando:* testes com `fetch` simulado cobrem o formato devolvido, a segunda chamada só quando precisa, a busca exata, a falha (devolve vazio sem quebrar) e o cache; uma chamada real a "however" devolve frases no formato esperado (avisa cedo se a API "unstable" mudou). — R1.1, R1.2, R1.5, R6.1
  *Feito (2026-10-17):*
  - `fetchExamples(word, { exact, max })` faz uma chamada com tradução em português e, só se vierem menos de 5 frases boas, uma segunda sem tradução. Busca exata (`=palavra`) quando `exact`. Timeout de 6 s por chamada, cache na sessão (falha não vai para o cache) e nunca lança erro.
  - A tradução usada é a primeira em português aprovada, de preferência a direta.
  - 6 testes com `fetch` simulado em `src/api.examples.test.js`.
  - **Chamada real:** o formato foi conferido com `curl` (`data[]` com `translations[]`, `owner`, `license`, `is_unapproved`). Ex.: "However, my shoulder hurts." → "No entanto, meu ombro dói.", de carlosalberto, CC BY 2.0 FR.
  - O teste automático com a API real fica fora do `npm test` (`LIVE_APIS=1 npm test`). Na hora do teste, o Tatoeba estava levando de 11 a mais de 25 s por chamada, então ele foi pulado; na prática, nesses momentos o app mostra os exemplos do dicionário (R1.5).
  - **Se o Tatoeba continuar lento:** passar pelo mesmo intermediário das imagens, com cache de 24 h. Fica como ideia, fora desta spec.

- [x] **T3 — Componente `src/components/Examples.jsx`**: frase com a palavra destacada, "Ver tradução" por frase, "Ouvir frase", crédito com link, modo de escolha (até 2).
  *Pronto quando:* renderizado com frases de teste numa página do modo dev, funciona no teclado, em claro, escuro e 375 px. — R1.3, R5.1, R6.3
  *Feito (2026-10-17):*
  - `Examples.jsx` recebe `word`, `sentences` e, no modo de escolha, `picked` + `onTogglePick` (até 2). Cada frase tem a palavra em `<mark>`, "Ver tradução" (`Button` com `aria-expanded`, só quando há tradução), "Ouvir a frase N" (`IconButton`, voz do navegador) e "Escolher a frase N para salvar" (`IconToggleButton`). Crédito por frase ("Tatoeba · autor", "Tatoeba" ou "Dicionário") com link em nova aba, e a legenda "Frases: Tatoeba, CC BY 2.0 FR / CC0" quando alguma frase vem do Tatoeba.
  - Funções novas em `examples.js`, testadas: `togglePicked` (a terceira escolha tira a mais antiga, como nas imagens) e `exampleCredit`.
  - Token `--gw-mark` (fundo do destaque) na paleta, com o par de contraste no teste.
  - Página de prévia só no `npm run dev`: `#/dev/examples` (`src/dev/ExamplesPreview.jsx`, frases e autores fictícios). Ela fica fora do build (conferido no `dist`).
  - **Conferido no Edge headless:** Tab passa por tradução, ouvir, escolher e crédito em ordem, com foco visível; Enter abre a tradução e Espaço escolhe. Com 3 escolhas ficam as 2 últimas, e o aviso diz "2 de 2 escolhidas". O menor contraste é 5,47:1 no claro e 6,62:1 no escuro. Em 375 px, sem rolagem lateral.

## Parte 2 — Telas (depois da T6 da spec 003)

- [x] **T4 — Busca**: exemplos em paralelo com o resto; bloco "Exemplos" no painel; palavra abstrata → exemplos no lugar da grade, com aviso e "Ver imagens mesmo assim"; salvar leva até 2 frases (sem escolha, a primeira).
  *Pronto quando:* "study" mostra frases no painel sem atrasar as imagens; "however" mostra frases no lugar das imagens; escolher e salvar grava as frases; Tatoeba fora do ar (simulado) mostra os exemplos do dicionário. — R1.1–R1.5, R2.1, R3.1, R3.2
  *Feito (2026-10-17):*
  - As frases são buscadas em paralelo, depois de esperar a definição (até os mesmos 2 s das imagens) só para saber se a palavra é gramatical (busca exata, D2). Sem frases do Tatoeba (falha, demora acima de 6 s ou nenhuma boa), entram os exemplos do dicionário (`dictionaryExamples`).
  - Palavra comum: bloco "Exemplos" no painel, **abaixo do botão de salvar**. Assim o botão não vai para o fim do painel com 5 frases; a dica do bloco diz que as escolhidas vão junto ao salvar.
  - Palavra abstrata: aviso, frases e o botão "Ver imagens mesmo assim" no lugar da grade. Ao clicar, aparecem as imagens e o "Refinar", o foco vai para o título das imagens e **nenhuma imagem vem escolhida** (as 3 automáticas seriam ruins aqui). Se as imagens nunca foram abertas, salvar não grava imagem nova.
  - Salvar grava até 2 frases (`examplesToSave`: as escolhidas, na ordem; sem escolha, a primeira; com as frases ainda carregando, mantém as já salvas). Palavra já salva: as frases dela aparecem primeiro e já marcadas (`mergeExamples`).
  - Funções novas testadas em `examples.js`: `dictionaryExamples`, `mergeExamples`, `examplesToSave`.
  - **Achado no teste:** para "study", a relevância do Tatoeba punha 30 frases de 1 a 3 palavras ("Study.", "I study law."), e o filtro de 4 a 12 palavras descartava todas. Agora a consulta pede `word_count=4-12` ao próprio Tatoeba (conferido com `curl` e em teste).
  - **Conferido no Edge headless** (servidor de desenvolvimento, Tatoeba real):
    - "study": imagens em 0,4 s e frases do Tatoeba em 2,8 s, no painel.
    - Escolher a 2ª e a 3ª frase e salvar grava as duas no `localStorage`, com id, texto, tradução, autor, licença e link.
    - "however": 5 frases no lugar da grade. "Ver imagens mesmo assim" mostra 3 imagens, nenhuma escolhida.
    - Tatoeba bloqueado (`Network.setBlockedURLs`): "study" e "however" mostram os exemplos do dicionário com o crédito "Dicionário".
    - Claro, escuro e 375 px sem rolagem lateral. Sem erros no console.

- [x] **T5 — Dados e dicionário**: `migrate()` garante `examples: []` em cada palavra (com teste); detalhe da palavra mostra as frases salvas.
  *Pronto quando:* palavras antigas carregam sem erro; o detalhe mostra frases, tradução escondida e crédito. — R2.2, R6.1, R6.2
  *Feito (2026-10-17):*
  - `migrate()` dá `examples: []` a cada palavra sem a lista e limpa listas malformadas: tira itens sem texto e deixa no máximo 2. Palavras já certas continuam sendo o mesmo objeto. Testes: palavra antiga, lista suja, estado atual sem mudança, sem alterar o objeto salvo e exportação em JSON com as frases (R6.2).
  - Detalhe da palavra no dicionário: bloco "Frases salvas" (o mesmo `Examples`, só leitura) abaixo da definição, com tradução escondida, ouvir e crédito com link. O aviso de remover agora cita as frases.
  - `src/dev/demoState.js` ganhou `examples: []` (o teste confere que os dados de exemplo já estão no formato atual).
  - **Conferido no Edge headless:**
    - Estado com "river" no formato antigo e "however" com 2 frases (uma do Tatoeba e uma do dicionário).
    - "river" abre sem erro e é gravado com `examples: []`.
    - "however" mostra as 2 frases com os créditos "Tatoeba · carlosalberto" (link para a frase) e "Dicionário". A tradução fica escondida até "Ver tradução".
    - Claro, escuro e 375 px sem rolagem lateral, sem erros no console.

- [x] **T6 — Revisão com lacuna**: frente com frase e lacuna para palavras abstratas ou sem imagem salva; dica com a tradução da frase; revelar mostra a frase completa destacada; com 2 frases, alterna.
  *Pronto quando:* revisar "however" mostra a lacuna, a dica em português e a resposta completa; palavras com imagem continuam com imagens; palpite e notas funcionam igual. — R4.1–R4.4
  *Feito (2026-10-17):*
  - `reviewSentence(card, abstract)` em `examples.js` (testada) escolhe a frase da frente:
    - só para palavra abstrata (`isAbstract`, mesmo com imagem salva) ou sem imagem;
    - só frases que contêm a palavra;
    - com 2 frases, alterna por `srs.reps % 2`;
    - sem frase, a frente continua como antes (imagens, ou a definição com a palavra escondida).
  - Frente: frase com a lacuna "_____" (leitor de tela ouve "lacuna"). A dica mostra a tradução da frase quando há; sem tradução, mostra a definição com a palavra escondida.
  - Verso: a frase completa com a palavra destacada, "Ouvir a frase" e o crédito com link, acima do bloco da palavra. Palpite e notas não mudaram.
  - **Bug antigo corrigido no caminho:** dar nota pelo teclado (1 a 4) digitava o número no campo de palpite da carta seguinte ("Você escreveu “3”"). Agora a tecla de nota usa `preventDefault`.
  - **Conferido no Edge headless** com 4 palavras para revisar:
    - "however" (abstrata, com imagem e 2 frases, `reps` 1): mostra a 2ª frase com lacuna e nenhuma imagem. A dica é a definição, porque essa frase não tem tradução. Palpite "however" + Enter dá "Acertou", e o verso destaca a palavra e mostra o crédito.
    - "river" (com imagem): continua com a imagem.
    - "blanket" (sem imagem, com frase): lacuna, e a dica "Preciso de um cobertor quente hoje.".
    - "thunder" (sem imagem e sem frase): a definição, como antes.
    - Notas pelo teclado gravam o `log` e somam `reps`.
    - Claro, escuro e 375 px sem rolagem lateral, sem erros no console.

## Fechamento

- [ ] **T7 — Textos, créditos e verificação final**: crédito do Tatoeba no rodapé da landing e no README; resposta do FAQ sobre palavras sem imagem atualizada; `CLAUDE.md` (mapa e `examples` no modelo de dados); percorrer R1–R6 no navegador (claro, escuro, 375 px) e marcar a spec como `implementado`.
  *Pronto quando:* todos os critérios conferidos e listados abaixo, com o que não deu para verificar dito explicitamente.

## Verificação

(preenchido na T7)

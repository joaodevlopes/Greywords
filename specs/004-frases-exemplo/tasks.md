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

- [ ] **T2 — `fetchExamples` em `src/api.js`**: primeira chamada com tradução em português; segunda (sem tradução) só se faltarem frases; exata para palavras gramaticais; timeout de 6 s; cache em memória na sessão.
  *Pronto quando:* testes com `fetch` simulado cobrem o formato devolvido, a segunda chamada só quando precisa, a busca exata, a falha (devolve vazio sem quebrar) e o cache; uma chamada real a "however" devolve frases no formato esperado (avisa cedo se a API "unstable" mudou). — R1.1, R1.2, R1.5, R6.1

- [ ] **T3 — Componente `src/components/Examples.jsx`**: frase com a palavra destacada, "Ver tradução" por frase, "Ouvir frase", crédito com link, modo de escolha (até 2).
  *Pronto quando:* renderizado com frases de teste numa página do modo dev, funciona no teclado, em claro, escuro e 375 px. — R1.3, R5.1, R6.3

## Parte 2 — Telas (depois da T6 da spec 003)

- [ ] **T4 — Busca**: exemplos em paralelo com o resto; bloco "Exemplos" no painel; palavra abstrata → exemplos no lugar da grade, com aviso e "Ver imagens mesmo assim"; salvar leva até 2 frases (sem escolha, a primeira).
  *Pronto quando:* "study" mostra frases no painel sem atrasar as imagens; "however" mostra frases no lugar das imagens; escolher e salvar grava as frases; Tatoeba fora do ar (simulado) mostra os exemplos do dicionário. — R1.1–R1.5, R2.1, R3.1, R3.2

- [ ] **T5 — Dados e dicionário**: `migrate()` garante `examples: []` em cada palavra (com teste); detalhe da palavra mostra as frases salvas.
  *Pronto quando:* palavras antigas carregam sem erro; o detalhe mostra frases, tradução escondida e crédito. — R2.2, R6.1, R6.2

- [ ] **T6 — Revisão com lacuna**: frente com frase e lacuna para palavras abstratas ou sem imagem salva; dica com a tradução da frase; revelar mostra a frase completa destacada; com 2 frases, alterna.
  *Pronto quando:* revisar "however" mostra a lacuna, a dica em português e a resposta completa; palavras com imagem continuam com imagens; palpite e notas funcionam igual. — R4.1–R4.4

## Fechamento

- [ ] **T7 — Textos, créditos e verificação final**: crédito do Tatoeba no rodapé da landing e no README; resposta do FAQ sobre palavras sem imagem atualizada; `CLAUDE.md` (mapa e `examples` no modelo de dados); percorrer R1–R6 no navegador (claro, escuro, 375 px) e marcar a spec como `implementado`.
  *Pronto quando:* todos os critérios conferidos e listados abaixo, com o que não deu para verificar dito explicitamente.

## Verificação

(preenchido na T7)

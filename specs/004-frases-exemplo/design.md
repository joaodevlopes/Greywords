# 004 — Frases de exemplo: design

Status: aprovado (2026-10-17)

## Visão geral

```
buscar "however"
  ├─ imagens / definição / tradução (como hoje, spec 003)
  └─ exemplos (em paralelo, R1.4)
        1. Tatoeba com tradução em português   (até 30 frases, ~9 KB)
        2. se sobrarem menos de 5 boas: Tatoeba sem tradução (até 30, ~3 KB)
        3. se falhar ou vier vazio: exemplos do próprio dicionário (R1.5)
        ▼
     src/examples.js escolhe até 5 (aprovadas, com a palavra, 4 a 12 palavras, PT primeiro, curtas primeiro)
        ▼
     bloco "Exemplos" no painel (D6); palavra abstrata → bloco vai para o lugar das imagens (R3.1)
```

## Tatoeba (testado em 2026-10-17)

`GET https://api.tatoeba.org/unstable/sentences?lang=eng&q=<consulta>&sort=relevance&limit=30&trans:lang=por&showtrans=matching`

| Achado | Consequência no design |
| --- | --- |
| Responde do navegador (`Access-Control-Allow-Origin: *`), sem chave | Chamada direta do app, como as outras APIs |
| `trans:lang=por` devolve só frases com tradução em português; resposta de ~9 KB | Primeira chamada; a segunda (`showtrans=none`, ~3 KB) só quando faltarem frases |
| `showtrans=all` pesa ~105 KB | Não usar |
| Sem "=" encontra variações ("They studied"); com "=" é exata | Variações por padrão; exata (`=however`) para palavras gramaticais (D2) |
| A relevância põe primeiro frases de 1 palavra ("Study.", "Study!") | Filtro de 4 a 12 palavras antes de ordenar |
| Campo `is_unapproved` em cada frase | Só aprovadas (D1) |
| A API se chama "unstable" | Adaptador isolado em `fetchExamples`; com falha, entram os exemplos do dicionário |

Crédito: frase em CC BY 2.0 FR → autor (`owner`) e link `https://tatoeba.org/en/sentences/show/<id>`; CC0 → link.

## Código

### Novo: `src/examples.js` (funções puras, testadas)

| Função | O que faz |
| --- | --- |
| `wordForms(word)` | Formas aceitas: a palavra, +s/+es, -y→ies, +ed/+d, gerúndio (reusa `toGerund` da spec 003). Irregulares ("went") não entram; a frase sem forma reconhecida é descartada |
| `findForm(text, word)` | Posição e tamanho da primeira forma encontrada como palavra inteira, sem diferenciar maiúsculas; `null` se não houver |
| `pickExamples(sentences, word, max = 5)` | Filtra (aprovada, contém forma, 4 a 12 palavras) e ordena (com PT primeiro, depois mais curta); remove repetidas |
| `highlight(text, word)` | Divide a frase em antes / palavra / depois, para destacar sem `innerHTML` |
| `cloze(text, word)` | Troca a forma encontrada por "___" (frente do cartão, R4.1) |
| `fromDictionary(meanings)` | Converte os exemplos do dicionário para o mesmo formato (sem tradução, sem autor) |

### `src/api.js`

`fetchExamples(word, { exact })`: as duas chamadas acima (a segunda só se precisar), timeout de 6 s, devolve `[{ id, text, translation, owner, license, link }]`. Resultado guardado em memória durante a sessão, para não repetir a chamada ao reabrir a mesma palavra.

### Novo: `src/components/Examples.jsx`

Lista de frases, usada na busca, no detalhe do dicionário e na revisão:
- Frase com a palavra destacada (`<mark>` do app, CSS `gw-ex-*`).
- `Button` "Ver tradução" por frase (R1.3); `IconButton` "Ouvir frase" (voz do navegador, D5, reusa `speak`).
- Na busca: botão de escolher (até 2, D3), no mesmo estilo da seleção de imagens.
- Crédito curto por frase ("Tatoeba · autor") com link; legenda geral "Frases: Tatoeba (tatoeba.org), CC BY 2.0 FR / CC0".

### Mudanças em arquivos existentes

| Arquivo | Mudança |
| --- | --- |
| `src/components/Search.jsx` | Busca exemplos em paralelo; bloco "Exemplos" no painel; palavra abstrata (`isAbstract`, spec 003) → exemplos no lugar da grade, com aviso e botão "Ver imagens mesmo assim" (R3.2); salvar leva até 2 frases (sem escolha, a primeira) |
| `src/components/Dictionary.jsx` | Detalhe mostra as frases salvas (R2.2) |
| `src/components/Review.jsx` | Frente com frase e lacuna quando a palavra é abstrata ou não tem imagem salva (D4); a dica mostra a tradução da frase; ao revelar, frase completa destacada. Com 2 frases salvas, alterna a cada revisão (`reps % 2`) |
| `src/storage.js` | `migrate()` garante `examples: []` em cada palavra salva; teste |

Formato salvo em cada palavra: `examples: [{ id, text, translation, owner, license, link }]`, com no máximo 2.

## Dependência com a spec 003

As duas mexem em `Search.jsx`. Para não trabalhar duas vezes na mesma área: a 004 entra **depois** da T6 da 003 (busca com contexto, "Refinar" e "Esconder" prontos). A função `isAbstract` já existe (`src/imageQuery.js`, T1 da 003).

## Rastreabilidade

| Requisito | Onde |
| --- | --- |
| R1.1–R1.5 | `fetchExamples`, `pickExamples`, `Examples.jsx`, `fromDictionary` |
| R2.1–R2.2 | Escolha na busca, `examples` salvo, detalhe no dicionário |
| R3.1–R3.2 | `Search.jsx` com `isAbstract` e "Ver imagens mesmo assim" |
| R4.1–R4.4 | `Review.jsx` + `cloze` |
| R5.1 | Botão "Ouvir frase" (`speak`) |
| R6.1–R6.3 | `migrate()`, exportação existente, crédito por frase |

## Verificação planejada

- Testes de `examples.js`: formas (study/studies/studied/studying, cook/cooked, box/boxes), frase sem forma descartada, filtro de 4 a 12 palavras, ordem (PT e tamanho), lacuna, conversão dos exemplos do dicionário.
- Teste da migração (`examples: []`).
- Navegador: "however" mostra frases no lugar das imagens; "study" mostra frases no painel; tradução escondida e revelada; ouvir; salvar com 2 frases; dicionário mostra as frases; revisão de "however" com lacuna e dica em português; Tatoeba fora do ar (simulado) usa os exemplos do dicionário; claro, escuro e 375 px.
- `npm test`, `npm run build`, `npm run check:ui`.

## Riscos

| Risco | Plano |
| --- | --- |
| API "unstable" mudar | Adaptador isolado; exemplos do dicionário como reserva; teste de formato no T1 avisa cedo |
| Limite de requisições do Tatoeba (não informado nos cabeçalhos) | No máximo 2 chamadas por palavra e cache em memória |
| Frase de voluntário com erro ou conteúdo estranho | Só aprovadas; usuário escolhe quais salvar |
| Forma irregular não reconhecida ("went") | A frase é descartada; com variações, sobram outras |

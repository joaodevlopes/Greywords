# 004 — Frases de exemplo: requisitos

Status: aprovado (2026-10-17)

## Objetivo

Mostrar a palavra **em uso**, com frases reais e curtas, principalmente nas palavras que não têm imagem ("however", "although", "freedom"), e usar essas frases na revisão.

## Por que (dados da spec 003)

Na medição do "antes", as imagens acertaram 2 de 18 nas palavras gramaticais e 5 de 18 nas abstratas. Para essas palavras, o que ensina é o contexto, não a foto.

## Fonte testada (2026-10-17)

[Tatoeba](https://tatoeba.org): banco aberto de frases escritas por voluntários, com traduções.
- A API nova (`api.tatoeba.org`) responde do navegador (libera acesso de outros sites), é grátis e não pede chave.
- "however" tem centenas de frases, e várias com tradução em português: "However, my shoulder hurts." → "No entanto, meu ombro dói."
- Licença por frase: CC BY 2.0 FR (exige crédito ao autor) ou CC0.
- Atenção: a API se chama "unstable", ou seja, pode mudar sem aviso.

## R1 — Frases na busca

**História:** Como estudante, quero ver frases reais com a palavra, para entender como ela é usada.

- R1.1 QUANDO o usuário buscar uma palavra, O SISTEMA DEVE mostrar até 5 frases de exemplo em inglês com a palavra destacada.
- R1.2 O SISTEMA DEVE priorizar frases curtas e com tradução em português (ver **D1**).
- R1.3 O SISTEMA DEVE manter a tradução de cada frase escondida até o usuário pedir, como já faz com a tradução da palavra.
- R1.4 As frases DEVEM carregar sem atrasar imagens, definição e tradução.
- R1.5 SE o Tatoeba falhar ou não tiver frases, ENTÃO O SISTEMA DEVE mostrar os exemplos que já vêm do dicionário, ou dizer que não há exemplos.

## R2 — Guardar frases

**História:** Como estudante, quero guardar as frases que me ajudaram, junto com a palavra.

- R2.1 O SISTEMA DEVE permitir escolher frases favoritas para salvar com a palavra (ver **D3**).
- R2.2 O dicionário DEVE mostrar as frases salvas no detalhe da palavra.

## R3 — Palavras sem imagem

- R3.1 QUANDO a palavra for abstrata (regra da spec 003, R5), O SISTEMA DEVE mostrar as frases no lugar das imagens, com o aviso de que ali o foco é o contexto.
- R3.2 O usuário DEVE poder pedir imagens mesmo assim (refinar, spec 003).

## R4 — Revisão com frase

**História:** Como estudante, quero lembrar a palavra completando uma frase, para treinar o uso.

- R4.1 O SISTEMA DEVE mostrar na frente do cartão uma frase salva com a palavra trocada por uma lacuna ("___, my shoulder hurts.") nos casos definidos na **D4**.
- R4.2 A dica DEVE poder mostrar a tradução da frase.
- R4.3 Ao revelar, O SISTEMA DEVE mostrar a frase completa, com a palavra destacada.
- R4.4 O palpite e as notas (Errei / Difícil / Bom / Fácil) continuam como hoje.

## R5 — Ouvir a frase (ver **D5**)

- R5.1 O SISTEMA DEVE permitir ouvir cada frase.

## R6 — Dados e crédito

- R6.1 Frases salvas DEVEM guardar texto, tradução, id, autor e licença; com migração (`migrate()`) e teste.
- R6.2 A exportação em JSON DEVE incluir as frases salvas.
- R6.3 O SISTEMA DEVE dar crédito ao Tatoeba e ao autor de cada frase, com link para a frase original.

## Decisões das dúvidas

| Dúvida | Decisão |
| --- | --- |
| D1 — Quais frases | Até 5, só aprovadas; com tradução em português primeiro; mais curtas primeiro (até ~12 palavras); se faltar, completa com frases sem tradução |
| D2 — Exata ou variações | Com variações, conferindo que a frase contém uma forma da palavra; exata para palavras gramaticais |
| D3 — Guardar | Até 2 frases favoritas; sem escolha, salva a primeira automaticamente |
| D4 — Frente do cartão | Frase com lacuna para palavras abstratas e palavras salvas sem imagem; as outras continuam com imagens |
| D5 — Áudio | Voz do navegador lendo a frase |
| D6 — Lugar na tela | Bloco "Exemplos" no painel da palavra, abaixo das definições |

## Fora do escopo

Gerar frases com IA (exigiria chave paga), traduzir automaticamente as frases sem tradução, outras línguas além de português.

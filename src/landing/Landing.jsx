import { Fragment, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Badge, Icon, ThemeToggle } from 'beds'
import GreyhoundMark from '../brand/GreyhoundMark.jsx'
import Wordmark from '../brand/Wordmark.jsx'
import AnimatedBeam from '../fx/AnimatedBeam.jsx'
import BrowserFrame from '../fx/BrowserFrame.jsx'
import DotPattern from '../fx/DotPattern.jsx'
import Marquee from '../fx/Marquee.jsx'
import NumberTicker from '../fx/NumberTicker.jsx'
import { formatPercent } from '../fx/number.js'
import { EASE_OUT } from '../fx/variants.js'
import Reveal from '../fx/Reveal.jsx'
import SpotlightCard from '../fx/SpotlightCard.jsx'
import TextEffect from '../fx/TextEffect.jsx'
import WordRotate from '../fx/WordRotate.jsx'
import { useOnScreen } from '../fx/useOnScreen.js'
import '../fx/fx.css'
import ProductDemo from './ProductDemo.jsx'
import { BeachUmbrella, Lamp, NightMoon, SunnyField, SunRays, SunsetSea } from './Scenes.jsx'
import './landing.css'

const APP_HREF = '#/app'

const NAV = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#por-dentro', label: 'Por dentro' },
  { href: '#diferenciais', label: 'Diferenciais' },
  { href: '#perguntas', label: 'Perguntas' },
]

const STEPS = [
  {
    id: 'buscar',
    title: 'Busque a palavra',
    text: 'Aparecem imagens, a definição em inglês, exemplos e a pronúncia. A tradução fica escondida até você pedir.',
  },
  {
    id: 'escolher',
    title: 'Escolha suas imagens',
    text: 'Marque até 3 imagens que fazem sentido para você. Elas viram a frente do seu flashcard.',
  },
  {
    id: 'revisar',
    title: 'Revise no dia certo',
    text: 'Você vê as imagens, tenta lembrar e dá uma nota. O Greywords calcula quando aquela palavra deve voltar.',
  },
]

const BENEFITS = [
  {
    id: 'imagem',
    icon: 'Image',
    title: 'Imagem antes da tradução',
    text: 'Você liga “sun” direto à ideia de sol, sem passar pelo português. A tradução continua a um clique, só não vem primeiro.',
  },
  {
    id: 'espacada',
    icon: 'CalendarDays',
    title: 'Revisão espaçada',
    text: 'A palavra que você acerta volta em intervalos cada vez maiores. A que você erra volta na mesma sessão. É o mesmo princípio do Anki (algoritmo SM-2).',
  },
  {
    id: 'ingles',
    icon: 'Globe',
    title: 'Inglês de verdade',
    text: 'Definições e frases de exemplo em inglês, com áudio da pronúncia. Você aprende a palavra no contexto em que ela aparece.',
  },
  {
    id: 'dados',
    icon: 'ChartColumn',
    title: 'Seu progresso, seus dados',
    text: 'Sem cadastro. Meta semanal que você define, calendário dos dias estudados e taxa de acerto dos últimos 30 dias, tudo no seu navegador, com exportação em JSON.',
  },
]

const ROADMAP = [
  {
    id: 'frases',
    title: 'Frases de exemplo',
    text: 'Frases reais e curtas com a palavra, com tradução escondida, principalmente para palavras sem imagem como "however". Elas também viram revisão com lacuna.',
  },
  {
    id: 'sync',
    title: 'Usar em mais de um aparelho',
    text: 'Conta opcional para levar suas palavras e seu progresso do computador para o celular.',
  },
  {
    id: 'videos',
    title: 'Vídeos do seu nicho, no seu nível',
    text: 'Recomendação de vídeos com legenda sobre assuntos que você curte, com dificuldade estimada pelas próprias legendas.',
  },
]

const FAQ = [
  {
    id: 'gratis',
    q: 'É grátis mesmo?',
    a: 'Sim. O Greywords usa só serviços públicos e gratuitos: Openverse e Wikimedia Commons para imagens, Free Dictionary e Wiktionary para definições, MyMemory para tradução.',
  },
  {
    id: 'conta',
    q: 'Preciso criar conta?',
    a: 'Não. Você abre e já usa.',
  },
  {
    id: 'dados',
    q: 'Onde ficam as minhas palavras?',
    a: 'No navegador deste dispositivo. Se você limpar os dados do navegador, elas somem. Use “Exportar JSON” no dicionário para guardar uma cópia.',
  },
  {
    id: 'dia-estudado',
    q: 'O que conta como dia estudado?',
    a: 'Qualquer dia em que você revisar ou salvar uma palavra conta sozinho. Estudou fora do app, com série, vídeo ou aula? Marque “Estudei hoje” na aba Progresso.',
  },
  {
    id: 'traducao',
    q: 'Por que a tradução fica escondida?',
    a: 'Para você tentar entender pela imagem e pela definição primeiro. Quando quiser conferir, um clique mostra a tradução.',
  },
  {
    id: 'abstratas',
    q: 'E palavras sem imagem, como “however”?',
    a: 'Nelas as imagens ajudam pouco. O Greywords mostra a definição e exemplos em inglês, e na revisão a dica usa a definição com a palavra escondida.',
  },
  {
    id: 'imagens',
    q: 'De onde vêm as imagens?',
    a: 'De bancos com licenças abertas. Às vezes vem algo fora de contexto, e por isso você escolhe quais ficam. O autor aparece ao passar o mouse.',
  },
]

// English words shown in the headline; each one has an illustration in Scenes.jsx.
const HERO_WORDS = ['sun', 'moon', 'beach', 'lamp', 'sea']

const WORD_STRIP = [
  { id: 'sun', word: 'sun', Scene: SunRays },
  { id: 'sunset', word: 'sunset', Scene: SunsetSea },
  { id: 'moon', word: 'moon', Scene: NightMoon },
  { id: 'beach', word: 'beach', Scene: BeachUmbrella },
  { id: 'field', word: 'field', Scene: SunnyField },
  { id: 'lamp', word: 'lamp', Scene: Lamp },
]

// Screenshots of the real app with example words (scripts/capture.mjs). No "Vídeos" capture until
// a real catalog exists: the sample catalog has made-up numbers.
const SHOT = { width: 1600, height: 1013 }
const shot = (name, theme) => `${import.meta.env.BASE_URL}landing/${name}-${theme}.webp`
const INSIDE = [
  {
    id: 'review',
    title: 'Revise no dia certo',
    text: 'A frente do cartão são as imagens que você escolheu. Você tenta lembrar, confere a resposta e dá uma nota.',
    url: 'Greywords · Revisão',
    alt: 'Tela de revisão: cartão com a ilustração de um sol, campo para escrever a palavra e botão Mostrar resposta.',
  },
  {
    id: 'progress',
    title: 'Meta da semana e calendário',
    text: 'Os dias com revisão contam sozinhos. Estudou fora do app? Marque o check-in.',
    url: 'Greywords · Progresso',
    alt: 'Tela de progresso: meta da semana cumprida, semanas seguidas e calendário do mês com os dias estudados.',
  },
  {
    id: 'words',
    title: 'Seu dicionário visual',
    text: 'Cada palavra com as imagens que você escolheu e o dia em que ela volta.',
    url: 'Greywords · Palavras',
    alt: 'Tela de palavras: cartões de beach, lamp, moon, sun, sunset e field, cada um com sua ilustração e próxima revisão.',
  },
]

// "Por que funciona": each claim with its original source (checked 2026-10-17 via Crossref / the
// York University psychology classics site). They explain the method; they are not a promise.
const SCIENCE = [
  {
    id: 'esquecimento',
    title: 'A gente esquece rápido, e depois devagar',
    text: 'Em 1885, Hermann Ebbinghaus mediu a própria memória decorando listas de sílabas sem sentido. Boa parte se perdia já no primeiro dia; depois, o esquecimento desacelerava. Por isso o Greywords traz a palavra de volta antes que ela suma.',
    sources: [{ label: 'Ebbinghaus, 1885 (tradução inglesa de 1913, cap. 7)', href: 'https://psychclassics.yorku.ca/Ebbinghaus/memory7.htm' }],
  },
  {
    id: 'espacada',
    title: 'Espaçar guarda mais do que repetir de uma vez',
    text: 'Uma revisão de 317 experimentos concluiu que estudar em sessões espaçadas guarda mais do que concentrar tudo num dia só, e que o melhor intervalo cresce com o tempo que você quer lembrar. É o que o SM-2 faz: cada acerto aumenta o intervalo.',
    sources: [{ label: 'Cepeda, Pashler, Vul, Wixted e Rohrer, 2006 (Psychological Bulletin)', href: 'https://doi.org/10.1037/0033-2909.132.3.354' }],
  },
  {
    id: 'imagem',
    title: 'Imagem e palavra, dois caminhos',
    text: 'A teoria da dupla codificação descreve dois sistemas na memória, um verbal e um de imagens. E figuras costumam ser lembradas melhor que palavras soltas (o efeito de superioridade da imagem). Ligar "sun" a uma imagem usa os dois caminhos.',
    sources: [
      { label: 'Paivio, 1991', href: 'https://doi.org/10.1037/h0084295' },
      { label: 'Nelson, Reed e Walling, 1976', href: 'https://doi.org/10.1037/0278-7393.2.5.523' },
    ],
  },
]

// "Como foi feito": every outside service the app talks to (positions in a 100×56 box).
const SERVICES = [
  { id: 'openverse', label: 'Openverse', detail: 'imagens', x: 13, y: 8 },
  { id: 'wikimedia', label: 'Wikimedia Commons', detail: 'imagens (reserva)', x: 13, y: 21 },
  { id: 'dictionary', label: 'Free Dictionary', detail: 'definições e áudio', x: 13, y: 35 },
  { id: 'wiktionary', label: 'Wiktionary', detail: 'definições (reserva)', x: 13, y: 48 },
  { id: 'mymemory', label: 'MyMemory', detail: 'tradução', x: 87, y: 12 },
  { id: 'youtube', label: 'YouTube', detail: 'vídeos do TED', x: 87, y: 28 },
  { id: 'browser', label: 'Seu navegador', detail: 'onde ficam seus dados', x: 87, y: 44 },
]

const STACK = [
  'React 19 e Vite, sem servidor',
  'Design system BEDS',
  'Revisão espaçada SM-2, com ajustes estilo Anki',
  'Dados em localStorage, com exportação em JSON',
  'Testes automáticos da lógica (node:test)',
]

// Image relevance measured in spec 003 (specs/003-imagens-certeiras/medicao.md, "antes"):
// 20 words × 9 images, marked without seeing the title.
const IMAGE_BENCH = { hits: 82, total: 180, improper: 0 }
const IMAGE_GROUPS = [
  { id: 'verbos', label: 'Verbos', hits: 30, total: 45 },
  { id: 'concretos', label: 'Substantivos concretos', hits: 25, total: 45 },
  { id: 'adjetivos', label: 'Adjetivos', hits: 14, total: 36 },
  { id: 'ambiguas', label: 'Palavras ambíguas', hits: 6, total: 18 },
  { id: 'abstratos', label: 'Abstratas', hits: 5, total: 18 },
  { id: 'gramaticais', label: 'Gramaticais', hits: 2, total: 18 },
]
// Only verifiable numbers (landing honesta). Where each one comes from:
const NUMBERS = [
  // src/api.js: Openverse, Wikimedia Commons, Free Dictionary, Wiktionary, MyMemory; VideoDialog.jsx: YouTube.
  // Becomes 7 when Tatoeba lands (spec 004).
  { id: 'servicos', value: 6, label: 'serviços públicos e gratuitos para imagens, definições, tradução e vídeos' },
  // No backend, no account: data lives in localStorage (src/storage.js).
  { id: 'cadastro', value: 0, label: 'cadastros e servidores: suas palavras ficam no seu navegador' },
  // MAX_PICK in src/components/Search.jsx.
  { id: 'imagens', value: 3, label: 'imagens por palavra, no máximo, escolhidas por você' },
  // Lemmas in catalog/ngsl/NGSL_12_lemmatized_for_research.csv (non-empty lines that are not "##" notes).
  { id: 'ngsl', value: 2809, label: 'palavras comuns da lista NGSL, que medem o nível dos vídeos (em preparação)' },
]

// A14: the greyhound runs in from the left and stops above the closing title. It follows the
// surrounding Reveal (variant inheritance); with less motion it simply appears in place.
function GreyhoundRun() {
  const reduced = useReducedMotion()
  const variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { x: '-45vw', opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { duration: 1.1, ease: EASE_OUT } },
      }
  return (
    <motion.span className="gw-closing-mark" variants={variants} aria-hidden="true">
      <GreyhoundMark height={36} />
    </motion.span>
  )
}

function PrimaryCta({ children = 'Buscar minha primeira palavra' }) {
  const ref = useRef(null)
  const onScreen = useOnScreen(ref)
  return (
    <a
      ref={ref}
      className="gw-cta gw-fx-shimmer gw-fx-loop"
      href={APP_HREF}
      data-fx-paused={onScreen ? undefined : 'true'}
    >
      {children}
      <Icon name="ArrowRight" purpose="action" />
    </a>
  )
}

export default function Landing() {
  const heroRef = useRef(null)
  const heroOnScreen = useOnScreen(heroRef)

  return (
    <div className="gw-landing">
      <a className="gw-skip" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className="gw-landing-header">
        <div className="gw-landing-header-inner">
          <a className="gw-wordmark" href="#/" aria-label="Greywords, página inicial">
            <Wordmark />
          </a>
          <nav className="gw-landing-nav" aria-label="Seções da página">
            {NAV.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="gw-landing-account">
            <ThemeToggle label="Tema" lightLabel="Claro" darkLabel="Escuro" />
            <a className="gw-open-app" href={APP_HREF}>
              Abrir o app
            </a>
          </div>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1}>
        <section
          ref={heroRef}
          className="gw-hero"
          aria-labelledby="gw-hero-title"
          data-fx-paused={heroOnScreen ? undefined : 'true'}
        >
          <div className="gw-hero-bg" aria-hidden="true">
            <span className="gw-fx-loop" />
            <span className="gw-fx-loop" />
            <span className="gw-fx-loop" />
          </div>
          <div className="gw-hero-copy">
            <span className="gw-hero-mark">
              <GreyhoundMark height={44} />
            </span>
            <p className="gw-eyebrow">Vocabulário em inglês · grátis · sem cadastro</p>
            <h1 id="gw-hero-title">
              <span className="gw-visually-hidden">Aprenda palavras em inglês vendo, não traduzindo.</span>
              <span aria-hidden="true">
                <TextEffect
                  items={[
                    'Aprenda',
                    <span key="w" className="gw-hero-accent">
                      <WordRotate words={HERO_WORDS} paused={!heroOnScreen} />
                    </span>,
                    'vendo,',
                    'não',
                    'traduzindo.',
                  ]}
                />
              </span>
            </h1>
            <p className="gw-hero-description">
              Busque uma palavra, escolha as imagens que fazem sentido para você e revise no dia certo. O Greywords guarda
              suas palavras e lembra quando cada uma precisa voltar.
            </p>
            <div className="gw-hero-actions">
              <PrimaryCta />
              <a className="gw-secondary" href="#como-funciona">
                Ver como funciona
              </a>
            </div>
            <p className="gw-note">Suas palavras ficam salvas neste navegador. Nada de e-mail ou senha.</p>
          </div>
          <div className="gw-hero-proof">
            <ProductDemo />
          </div>
        </section>

        <section className="gw-strip" aria-labelledby="gw-strip-title">
          <h2 id="gw-strip-title" className="gw-strip-title">
            Cada palavra, ligada a uma imagem
          </h2>
          <Marquee
            items={WORD_STRIP}
            label="Exemplos de palavras com imagem"
            renderItem={({ word, Scene }) => (
              <figure className="gw-strip-card">
                <span className="gw-strip-art">
                  <Scene />
                </span>
                <figcaption lang="en">{word}</figcaption>
              </figure>
            )}
          />
        </section>

        <section className="gw-section gw-numbers" aria-labelledby="gw-numbers-title">
          <DotPattern />
          <Reveal className="gw-numbers-inner">
            <h2 id="gw-numbers-title">
              <TextEffect items="Em números, sem exagero" inherit />
            </h2>
            <ul role="list">
              {NUMBERS.map((n) => (
                <li key={n.id}>
                  <strong>
                    <NumberTicker value={n.value} />
                  </strong>
                  <span>{n.label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section id="como-funciona" className="gw-section" aria-labelledby="gw-steps-title" tabIndex={-1}>
          <Reveal className="gw-steps">
            <header>
              <h2 id="gw-steps-title">
                <TextEffect items="Três passos por palavra" inherit />
              </h2>
              <p>Buscar, escolher, revisar. O resto, como lembrar quando cada palavra volta, fica com o Greywords.</p>
            </header>
            <ol role="list">
              {STEPS.map((s, i) => (
                <SpotlightCard key={s.id}>
                  <span className="gw-step-number" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </SpotlightCard>
              ))}
            </ol>
          </Reveal>
        </section>

        <section id="por-dentro" className="gw-section" aria-labelledby="gw-inside-title" tabIndex={-1}>
          <Reveal className="gw-inside">
            <header>
              <h2 id="gw-inside-title">
                <TextEffect items="Por dentro do app" inherit />
              </h2>
              <p>Capturas do Greywords de verdade, com palavras de exemplo.</p>
            </header>
            <ul role="list" className="gw-bento">
              {INSIDE.map((item) => (
                <SpotlightCard key={item.id} className={`gw-bento-${item.id}`}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <BrowserFrame
                    label={item.url}
                    light={shot(item.id, 'light')}
                    dark={shot(item.id, 'dark')}
                    alt={item.alt}
                    width={SHOT.width}
                    height={SHOT.height}
                  />
                </SpotlightCard>
              ))}
            </ul>
          </Reveal>
        </section>

        <section id="por-que" className="gw-section" aria-labelledby="gw-science-title" tabIndex={-1}>
          <Reveal className="gw-science">
            <header>
              <h2 id="gw-science-title">
                <TextEffect items="Por que funciona" inherit />
              </h2>
              <p>O método se apoia em pesquisa sobre memória. Os estudos explicam a ideia; não são promessa de resultado.</p>
            </header>
            <ol role="list">
              {SCIENCE.map((s) => (
                <SpotlightCard key={s.id}>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <p className="gw-source">
                    {s.sources.length > 1 ? 'Fontes: ' : 'Fonte: '}
                    {s.sources.map((src, i) => (
                      <Fragment key={src.href}>
                        {i > 0 && ' · '}
                        <a href={src.href} target="_blank" rel="noreferrer">
                          {src.label}
                        </a>
                      </Fragment>
                    ))}
                  </p>
                </SpotlightCard>
              ))}
            </ol>
          </Reveal>
        </section>

        <section id="como-foi-feito" className="gw-section" aria-labelledby="gw-built-title" tabIndex={-1}>
          <Reveal className="gw-built">
            <header>
              <h2 id="gw-built-title">
                <TextEffect items="Como foi feito" inherit />
              </h2>
              <p>Um projeto pessoal, aberto e gratuito, que roda inteiro no seu navegador e conversa só com serviços públicos.</p>
            </header>
            <figure className="gw-built-diagram">
              <AnimatedBeam
                label="Serviços que o Greywords usa"
                nodes={SERVICES}
                center={
                  <span className="gw-built-hub">
                    <GreyhoundMark height={28} />
                    <span>Greywords</span>
                  </span>
                }
              />
              <figcaption>Tudo o que o app consulta fora do seu navegador. Nenhum pede chave ou cadastro.</figcaption>
            </figure>
            <div className="gw-built-grid">
              <div className="gw-built-stack">
                <h3>Por baixo</h3>
                <ul role="list">
                  {STACK.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <figure className="gw-bench" aria-labelledby="gw-bench-title">
                <h3 id="gw-bench-title">Medindo a qualidade das imagens</h3>
                <p className="gw-bench-hero">
                  <strong>{formatPercent(IMAGE_BENCH.hits, IMAGE_BENCH.total, 1)}</strong>
                  <span>
                    das imagens certeiras ({IMAGE_BENCH.hits} de {IMAGE_BENCH.total}) e{' '}
                    {IMAGE_BENCH.improper === 0 ? 'nenhuma imprópria' : `${IMAGE_BENCH.improper} impróprias`}, em 20 palavras com 9 imagens
                    cada, marcadas sem ver o título.
                  </span>
                </p>
                <ul role="list" className="gw-bench-bars">
                  {IMAGE_GROUPS.map((g) => (
                    <li key={g.id}>
                      <span className="gw-bench-label">{g.label}</span>
                      <span className="gw-bench-track" aria-hidden="true">
                        <span className="gw-bench-bar" style={{ width: `${(g.hits / g.total) * 100}%` }} />
                      </span>
                      <span className="gw-bench-value">
                        {formatPercent(g.hits, g.total)}
                        <span className="gw-visually-hidden">
                          {' '}
                          ({g.hits} de {g.total})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <figcaption>
                  Palavras abstratas e gramaticais quase não têm imagem que ajude. Por isso vêm aí as frases de exemplo.
                </figcaption>
              </figure>
            </div>
          </Reveal>
        </section>

        <section id="diferenciais" className="gw-section" aria-labelledby="gw-benefits-title" tabIndex={-1}>
          <Reveal className="gw-benefits">
            <header>
              <h2 id="gw-benefits-title">
                <TextEffect items="Feito para a palavra ficar" inherit />
              </h2>
              <p>Ver a palavra uma vez não basta. O Greywords junta imagem, contexto e revisão no momento certo.</p>
            </header>
            <ul role="list">
              {BENEFITS.map((b) => (
                <SpotlightCard key={b.id}>
                  <span className="gw-benefit-icon" aria-hidden="true">
                    <Icon name={b.icon} purpose="feature" />
                  </span>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </SpotlightCard>
              ))}
            </ul>
          </Reveal>
        </section>

        <section className="gw-section" aria-labelledby="gw-roadmap-title">
          <Reveal className="gw-roadmap">
            <header>
              <Badge label="Em construção" tone="info" purpose="status" />
              <h2 id="gw-roadmap-title">
                <TextEffect items="O que vem por aí" inherit />
              </h2>
            </header>
            <ul role="list">
              {ROADMAP.map((r) => (
                <li key={r.id}>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section id="perguntas" className="gw-section" aria-labelledby="gw-faq-title" tabIndex={-1}>
          <Reveal className="gw-faq">
            <header>
              <h2 id="gw-faq-title">
                <TextEffect items="Perguntas frequentes" inherit />
              </h2>
              <p>O que dá para saber antes de começar.</p>
            </header>
            <div>
              {FAQ.map((f) => (
                <details key={f.id}>
                  <summary>
                    {f.q}
                    <Icon name="Plus" purpose="action" />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="gw-section gw-closing" aria-labelledby="gw-closing-title">
          <Reveal className="gw-closing-inner">
            <GreyhoundRun />
            <h2 id="gw-closing-title">
              <TextEffect items="Comece pela primeira palavra." inherit />
            </h2>
            <p>Escolha uma palavra que você viu hoje, em uma série, música ou no trabalho.</p>
            <PrimaryCta />
          </Reveal>
        </section>
      </main>

      <footer className="gw-footer">
        <div className="gw-footer-inner">
          <span className="gw-wordmark" aria-hidden="true">
            <Wordmark />
          </span>
          <nav aria-label="Rodapé">
            <a href={APP_HREF}>Abrir o app</a>
            {NAV.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <p>
            Projeto pessoal e gratuito. Imagens e definições de serviços abertos; créditos dentro do app. Vídeos: TED
            (ted.com), licença CC BY–NC–ND 4.0. Lista de palavras comuns: New General Service List (Browne, Culligan e
            Phillips), licença CC BY-SA 4.0.
          </p>
          <p>
            Efeitos visuais reescritos a partir de componentes MIT do 21st.dev (Magic UI e Motion Primitives); o fundo
            do topo se inspira na Aceternity UI. Títulos em Fraunces, licença OFL. Lista completa no arquivo CREDITS.md
            do projeto.
          </p>
        </div>
      </footer>
    </div>
  )
}

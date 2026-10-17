// Image search queries built from the word and its definition (spec 003). Pure functions, tested.
// Image banks match words in titles and tags, not meaning, so context goes into the query itself.

export const VARIANTS = ['class', 'definition', 'both']
export const DEFAULT_VARIANT = 'both' // provisional; the measurement in T7 picks the winner

const ABSTRACT_POS = new Set(['conjunction', 'preposition', 'pronoun', 'determiner', 'interjection', 'article'])
const LINKING_ADVERBS = new Set([
  'however', 'therefore', 'although', 'though', 'moreover', 'furthermore', 'nevertheless', 'nonetheless',
  'meanwhile', 'otherwise', 'hence', 'thus', 'besides', 'instead', 'indeed', 'whereas', 'consequently', 'anyway',
])

// Function words and very generic words that say nothing visual.
const STOPWORDS = new Set(
  `a about above after again against all also although always among an and another any anyone anything are
  around as at away back be because been before being below between both but by can cannot could did does
  doing done down during each either else especially even ever every from further get gets getting give given
  go goes had has have having he her here hers him his how into its it itself just kind like made make makes
  making many may might more most much must near need neither never often only onto other others our out over
  own part particular people perhaps place quite rather really same seem several shall she should since some
  someone something sometimes sort still such sure take than that their them then there these they thing
  things this those through thus together too toward towards type under until upon used using usually very was
  way well were what when where whether which while who whom whose will with within without would your order
  state quality act action process manner means form forms make become becomes certain usual typically`
    .split(/\s+/)
    .filter(Boolean),
)

const norm = (w) => String(w ?? '').trim().toLowerCase()
// Wiktionary lists inflection-only senses first ("tired: simple past and past participle of tire").
// They say nothing about the meaning, so they never decide the class or the context words, unless
// they are all there is.
const FORM_OF = /^(simple past|past participle|present participle|third-person singular|plural of|(alternative|obsolete|archaic) (form|spelling) of)/i
const meanings = (def) => {
  const all = def?.meanings ?? []
  const real = all.filter((m) => !FORM_OF.test(m.definition?.trim() ?? ''))
  return real.length ? real : all
}

/** Part of speech of the first meaning, lowercased, or null. */
export function primaryPos(def) {
  return meanings(def)[0]?.pos?.toLowerCase() ?? null
}

// Noun senses that describe an action ("whisper: The act of speaking in a quiet voice").
const ACTION_NOUN = /^(the|an?) (act|action|instance|process) of /i

/**
 * Class used to build the query: the first meaning's, except that a noun describing an action
 * counts as a verb, since the action is what a photo shows. A minor verb sense listed second
 * does not count ("sun" must not become "person sunning").
 */
export function mainClass(def) {
  const first = meanings(def)[0]
  const pos = first?.pos?.toLowerCase() ?? null
  if (pos === 'verb') return 'verb'
  if ((pos === 'noun' || pos === 'proper noun') && ACTION_NOUN.test(first.definition ?? '')) return 'verb'
  if (pos === 'proper noun') return 'noun'
  return pos
}

/** Words that barely have a picture: grammar words and linking adverbs (D5). */
export function isAbstract(def, word) {
  return LINKING_ADVERBS.has(norm(word)) || ABSTRACT_POS.has(primaryPos(def))
}

/** study → studying, make → making, run → running, die → dying, see → seeing, visit → visiting. */
export function toGerund(verb) {
  const v = norm(verb)
  if (v === 'be') return 'being'
  if (v.endsWith('ie')) return `${v.slice(0, -2)}ying`
  if (/(ee|ye|oe)$/.test(v)) return `${v}ing`
  if (v.length > 2 && v.endsWith('e')) return `${v.slice(0, -1)}ing`
  // one-syllable consonant-vowel-consonant doubles the last letter (run, swim, stop)
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v)) return `${v}${v.at(-1)}ing`
  return `${v}ing`
}

const ARTICLES = new Set(['a', 'an', 'the'])

/**
 * Up to `n` content words from the first definition (e.g. sun → star, earth).
 * Words right after "a/an/the" come first: they are usually the nouns ("the star", "the Earth").
 */
export function definitionWords(def, word, n = 2) {
  const w = norm(word)
  const tokens = (meanings(def)[0]?.definition ?? '').toLowerCase().match(/[a-z]+/g) ?? []
  const afterArticle = []
  const rest = []
  tokens.forEach((token, i) => {
    if (token.length < 4 || STOPWORDS.has(token) || token.endsWith('ly')) return
    if (token === w || token === `${w}s` || (w.length >= 5 && token.startsWith(w.slice(0, 5)))) return
    const bucket = ARTICLES.has(tokens[i - 1]) ? afterArticle : rest
    if (!afterArticle.includes(token) && !rest.includes(token)) bucket.push(token)
  })
  return [...afterArticle, ...rest].slice(0, n)
}

function contextQuery(w, def, variant) {
  const cls = mainClass(def)
  const [first] = definitionWords(def, w)
  const gerund = cls === 'verb' ? toGerund(w) : null

  if (variant === 'class') {
    if (cls === 'verb') return `person ${gerund}`
    if (cls === 'adjective') return `${w} person`
    return w
  }
  if (variant === 'definition') {
    return [w, ...definitionWords(def, w)].join(' ')
  }
  // both
  if (cls === 'verb') return first ? `person ${gerund} ${first}` : `person ${gerund}`
  if (cls === 'adjective') return first ? `${w} ${first}` : `${w} person`
  return first ? `${w} ${first}` : w
}

/**
 * Queries to run, most specific first; the bare word is always the last one (R2.4).
 * Abstract words or a missing definition give only the bare word.
 */
export function buildQueries(word, def, variant = DEFAULT_VARIANT) {
  const w = norm(word)
  if (!w) return []
  if (!def || isAbstract(def, w)) return [w]
  if (!VARIANTS.includes(variant)) throw new RangeError(`unknown variant: ${variant}`)
  const ctx = contextQuery(w, def, variant)
  return ctx === w ? [w] : [ctx, w]
}

/** 2 to 4 ready-made refinements for the "Refinar imagens" field (R3.1). */
export function refineSuggestions(word, def) {
  const w = norm(word)
  if (!w) return []
  const cls = mainClass(def)
  const words = definitionWords(def, w, 3)
  const list = []
  const add = (q) => {
    if (q && q !== w && !list.includes(q)) list.push(q)
  }
  if (cls === 'verb') {
    const g = toGerund(w)
    add(`person ${g}`)
    add(`people ${g}`)
  }
  if (cls === 'adjective') add(`${w} person`)
  for (const d of words) add(`${w} ${d}`)
  add(`${w} photo`)
  add(`${w} close up`)
  return list.slice(0, 4)
}

/**
 * Grid after "Refinar imagens" (R3.2, R3.3): the images already chosen stay first, in their chosen
 * order, then the new results without repeats. Nothing chosen yet: just the new results.
 */
export function mergeRefined(current, picked, found) {
  const byId = new Map(current.map((img) => [img.id, img]))
  const kept = picked.map((id) => byId.get(id)).filter(Boolean)
  const keptIds = new Set(kept.map((img) => img.id))
  return [...kept, ...found.filter((img) => !keptIds.has(img.id))]
}

export const UNSPLASH_HOME = 'https://unsplash.com/?utm_source=greywords&utm_medium=referral'

/** Tooltip/label credit for an image (R1.6): Unsplash photos name the photographer and Unsplash. */
export function imageCredit(img) {
  if (img?.source === 'unsplash') return `Foto de ${img.credit} no Unsplash`
  return [img?.title, img?.credit].filter(Boolean).join(' — ')
}

/**
 * Photographers to credit for the Unsplash photos on screen (Unsplash API guidelines: name the photographer,
 * link to their Unsplash profile and to Unsplash). One entry per photographer, in the order shown.
 */
export function unsplashCredits(images) {
  const seen = new Set()
  const out = []
  for (const img of images ?? []) {
    if (img?.source !== 'unsplash' || !img.credit) continue
    const id = img.creditLink || img.credit
    if (seen.has(id)) continue
    seen.add(id)
    out.push({ name: img.credit, link: img.creditLink || null })
  }
  return out
}

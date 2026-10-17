// Example data for the landing screenshots (spec 005, T6). Never imported by the app, so it stays
// out of the build: scripts/capture.mjs injects it into localStorage of a throwaway headless profile.
// Deterministic and relative to `now`, so the screenshots always show a believable "this week".
// Definitions and examples are written for this file (not copied from a dictionary).
import { addDays, dayKey, mondayOf } from '../progress.js'
import { DAY, startOfDay } from '../srs.js'

const WORDS = [
  {
    word: 'sun',
    phonetic: '/sʌn/',
    definition: 'The star at the centre of our solar system that gives the Earth light and heat.',
    example: 'The sun rises in the east.',
    translation: { main: 'sol', alts: ['luz do sol'] },
    srs: { ease: 2.5, interval: 6, reps: 2, lapses: 0, dueIn: 0 },
    addedDaysAgo: 12,
  },
  {
    word: 'moon',
    phonetic: '/muːn/',
    definition: 'The large round object that moves around the Earth and shines at night.',
    example: 'The moon is full tonight.',
    translation: { main: 'lua', alts: [] },
    srs: { ease: 2.36, interval: 1, reps: 1, lapses: 1, dueIn: 0 },
    addedDaysAgo: 9,
  },
  {
    word: 'beach',
    phonetic: '/biːtʃ/',
    definition: 'An area of sand or small stones next to the sea.',
    example: 'The kids played on the beach all day.',
    translation: { main: 'praia', alts: [] },
    srs: { ease: 2.5, interval: 0, reps: 0, lapses: 0, dueIn: 0 },
    addedDaysAgo: 1,
  },
  {
    word: 'sunset',
    phonetic: '/ˈsʌnˌsɛt/',
    definition: 'The time in the evening when the sun goes down.',
    example: 'We walked along the sea at sunset.',
    translation: { main: 'pôr do sol', alts: ['entardecer'] },
    srs: { ease: 2.6, interval: 9, reps: 3, lapses: 0, dueIn: 3 },
    addedDaysAgo: 20,
  },
  {
    word: 'field',
    phonetic: '/fiːld/',
    definition: 'An area of open land, often used for growing crops or keeping animals.',
    example: 'Cows were eating grass in the field.',
    translation: { main: 'campo', alts: ['lavoura'] },
    srs: { ease: 2.7, interval: 24, reps: 5, lapses: 0, dueIn: 10 },
    addedDaysAgo: 26,
  },
  {
    word: 'lamp',
    phonetic: '/læmp/',
    definition: 'A device that gives light, usually with a cover called a shade.',
    example: 'She turned on the lamp to read.',
    translation: { main: 'luminária', alts: ['abajur'] },
    srs: { ease: 2.5, interval: 4, reps: 2, lapses: 0, dueIn: 1 },
    addedDaysAgo: 6,
  },
]

// Review grades over the last 28 days: mostly "bom", a few "difícil", "errei" and "fácil".
const GRADE_PATTERN = [4, 4, 3, 4, 5, 4, 1, 4, 4, 3, 4, 5]

/**
 * @param {{ images: Record<string, string>, now?: number }} options
 *   images: word -> image URL (the capture script passes data: URIs of the landing illustrations)
 */
export function buildDemoState({ images, now = Date.now() }) {
  const today = dayKey(now)
  const monday = mondayOf(today)

  const words = {}
  for (const w of WORDS) {
    const { dueIn, ...srs } = w.srs
    words[w.word] = {
      key: w.word,
      word: w.word,
      phonetic: w.phonetic,
      audio: '',
      meanings: [{ pos: 'noun', definition: w.definition, example: w.example }],
      translation: w.translation,
      images: images[w.word] ? [{ id: `demo-${w.word}`, thumb: images[w.word], title: w.word, credit: 'Greywords', link: '' }] : [],
      addedAt: now - w.addedDaysAgo * DAY,
      srs: { ...srs, due: dueIn === 0 ? startOfDay(now) : startOfDay(now) + dueIn * DAY },
    }
  }

  // Studied days: 4–5 days in each of the 3 previous weeks, and every day so far this week but one.
  const activity = new Set()
  for (let week = 1; week <= 3; week++) {
    const start = addDays(monday, -7 * week)
    for (const offset of week === 2 ? [0, 1, 3, 4, 6] : [0, 2, 3, 5]) activity.add(addDays(start, offset))
  }
  for (let d = monday; d <= today; d = addDays(d, 1)) if (d !== addDays(monday, 1) || d === today) activity.add(d)
  const activityDays = [...activity].filter((d) => d <= today).sort()

  // One review line per studied day (up to two words), timestamped at 20:00 of that day.
  const log = []
  const keys = Object.keys(words)
  activityDays.forEach((day, i) => {
    const [y, m, dd] = day.split('-').map(Number)
    const t = new Date(y, m - 1, dd, 20).getTime()
    if (t > now) return
    for (let j = 0; j < 2; j++) log.push({ t: t + j * 60_000, word: keys[(i + j) % keys.length], q: GRADE_PATTERN[(i * 2 + j) % GRADE_PATTERN.length] })
  })

  return {
    words,
    log,
    goals: [{ from: addDays(monday, -21), days: 4 }],
    activityDays,
    checkinDays: [addDays(monday, -12)].filter((d) => d <= today),
    videoNiches: [],
    userLevel: null,
    watchedVideos: {},
    hideWatched: false,
    hiddenImages: {},
  }
}

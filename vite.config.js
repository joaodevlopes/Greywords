import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { handle } from './server/images.js'
import { applyCuration } from './catalog/curation.mjs'
import { cleanTranscript, tokenize } from './catalog/text.mjs'

// Dev-only image intermediary (spec 003, R1.5): serves /api/images/* with the Unsplash key from .env.local.
// The key is read here, in Node, and has no VITE_ prefix, so it never reaches the browser bundle.
// Successful searches are kept in memory for their cache time, to save the demo quota (50/hour).
function imagesApi(key) {
  const cache = new Map()
  return {
    name: 'greywords-images-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/images', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const cacheKey = url.pathname + url.search
        const hit = url.pathname === '/search' && cache.get(cacheKey)
        let result = hit && hit.until > Date.now() ? hit.result : null
        if (!result) {
          result = await handle(url.pathname, url.searchParams, { key })
          if (result.cacheSeconds) cache.set(cacheKey, { result, until: Date.now() + result.cacheSeconds * 1000 })
        }
        res.statusCode = result.status
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(result.body))
      })
    },
  }
}

// Dev-only curation endpoint (spec 002, T4) for the #/dev/curadoria page: lists the talks of
// catalog/sources.json and saves a transcript the user pasted (copied by hand from TED.com in their own
// browser) to catalog/transcripts/<slug>.txt, plus its duration. Never requests TED.com. Writes only accept
// JSON from the dev server's own page (same Origin), so another site cannot post to it.
function curationApi() {
  const sourcesPath = fileURLToPath(new URL('./catalog/sources.json', import.meta.url))
  const transcript = (slug) => fileURLToPath(new URL(`./catalog/transcripts/${slug}.txt`, import.meta.url))
  const countWords = async (slug) => {
    try {
      return tokenize(cleanTranscript(await readFile(transcript(slug), 'utf8'))).length
    } catch {
      return 0
    }
  }
  const send = (res, status, body) => {
    res.statusCode = status
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(body))
  }
  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let size = 0
      const chunks = []
      req.on('data', (c) => {
        size += c.length
        if (size > 2_000_000) reject(new Error('too large'))
        else chunks.push(c)
      })
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      req.on('error', reject)
    })
  return {
    name: 'greywords-curation-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/curation', async (req, res) => {
        try {
          const data = JSON.parse(await readFile(sourcesPath, 'utf8'))
          if (req.method === 'GET' && req.url.startsWith('/talks')) {
            const talks = await Promise.all(data.talks.map(async (t) => ({ ...t, words: await countWords(t.tedSlug) })))
            return send(res, 200, { niches: data.niches, talks })
          }
          if (req.method === 'POST' && req.url.startsWith('/transcript')) {
            const sameOrigin = !req.headers.origin || req.headers.origin === `http://${req.headers.host}`
            if (!sameOrigin || !String(req.headers['content-type']).startsWith('application/json'))
              return send(res, 403, { error: 'origem não permitida' })
            const body = JSON.parse(await readBody(req))
            const result = applyCuration(data, body)
            if (result.error) return send(res, 400, { error: result.error })
            await writeFile(transcript(result.slug), String(body.text), 'utf8')
            if (result.renamedFrom) await rm(transcript(result.renamedFrom), { force: true })
            await writeFile(sourcesPath, JSON.stringify(result.data, null, 2) + '\n', 'utf8')
            return send(res, 200, { slug: result.slug, words: await countWords(result.slug) })
          }
          send(res, 404, { error: 'rota desconhecida' })
        } catch (e) {
          send(res, 500, { error: `erro ao salvar: ${e.message}` })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), imagesApi(env.UNSPLASH_ACCESS_KEY), curationApi()],
  }
})

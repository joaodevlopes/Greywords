import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handle } from './server/images.js'

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), imagesApi(env.UNSPLASH_ACCESS_KEY)],
  }
})

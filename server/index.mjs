#!/usr/bin/env node
/**
 * RB Meta server: serves the built frontend (dist/) and a small JSON API.
 *
 *   GET /api/events        -> TournamentEvent[]
 *   PUT /api/events        -> replace all events (body: TournamentEvent[])
 *   GET /api/pa/*          -> proxy to https://piltoverarchive.com/api/external/*
 *
 * SQLite storage via node:sqlite (no native deps).
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 8787)
const DB_PATH = process.env.RB_DB_PATH ?? path.join(__dirname, '..', 'data', 'rbmeta.db')
const DIST_DIR = path.join(__dirname, '..', 'dist')
const PA_ORIGIN = 'https://piltoverarchive.com'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const MAX_BODY = 5 * 1024 * 1024

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new DatabaseSync(DB_PATH)
db.exec(`CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  ord INTEGER NOT NULL,
  name TEXT NOT NULL,
  date TEXT,
  type TEXT,
  data TEXT NOT NULL
)`)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers)
  res.end(body)
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8' })
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function getEvents() {
  const rows = db.prepare('SELECT data FROM events ORDER BY ord').all()
  return rows.map((r) => JSON.parse(r.data))
}

function putEvents(list) {
  if (!Array.isArray(list)) throw new Error('expected an array of events')
  db.exec('BEGIN')
  try {
    db.prepare('DELETE FROM events').run()
    const stmt = db.prepare('INSERT INTO events (id, ord, name, date, type, data) VALUES (?, ?, ?, ?, ?, ?)')
    list.forEach((ev, i) => {
      if (!ev || typeof ev.id !== 'string' || !Array.isArray(ev.stages)) {
        throw new Error(`invalid event at index ${i}`)
      }
      stmt.run(ev.id, i, String(ev.name ?? ''), String(ev.date ?? ''), String(ev.type ?? ''), JSON.stringify(ev))
    })
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

async function proxyPa(req, res, pathname, search) {
  const rest = pathname.replace(/^\/api\/pa\/?/, '')
  const target = `${PA_ORIGIN}/api/external/${rest}${search}`
  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    })
    const body = Buffer.from(await upstream.arrayBuffer())
    send(res, upstream.status, body, {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    })
  } catch (e) {
    sendJson(res, 502, { error: 'PA_UPSTREAM_FAILED', message: String(e) })
  }
}

function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? '/index.html' : pathname
  const file = path.normalize(path.join(DIST_DIR, rel))
  if (file.startsWith(DIST_DIR) && fs.existsSync(file) && fs.statSync(file).isFile()) {
    const ext = path.extname(file).toLowerCase()
    send(res, 200, fs.readFileSync(file), { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
    return
  }
  // SPA fallback
  const index = path.join(DIST_DIR, 'index.html')
  if (fs.existsSync(index)) {
    send(res, 200, fs.readFileSync(index), { 'Content-Type': MIME['.html'] })
    return
  }
  send(res, 404, 'Not found. Run `pnpm build` first.')
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const { pathname, search } = url

  try {
    if (pathname.startsWith('/api/pa/')) {
      await proxyPa(req, res, pathname, search)
      return
    }

    if (pathname === '/api/events') {
      if (req.method === 'GET') {
        sendJson(res, 200, getEvents())
        return
      }
      if (req.method === 'PUT') {
        const body = await readBody(req)
        const list = JSON.parse(body)
        putEvents(list)
        sendJson(res, 200, { ok: true, count: list.length })
        return
      }
      sendJson(res, 405, { error: 'method not allowed' })
      return
    }

    if (pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: 'not found' })
      return
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, 'method not allowed')
      return
    }
    serveStatic(req, res, pathname)
  } catch (e) {
    sendJson(res, 500, { error: 'SERVER_ERROR', message: String((e && e.message) || e) })
  }
})

server.listen(PORT, () => {
  console.log(`RB Meta server on http://localhost:${PORT} (db: ${DB_PATH})`)
})

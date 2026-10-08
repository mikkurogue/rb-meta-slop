#!/usr/bin/env node
/**
 * Downloads Riftbound Legend card images (standard + overnumbered variants)
 * and domain (rune) icons from Piltover Archive into public/assets.
 *
 * Usage: pnpm fetch:assets
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const ORIGIN = 'https://piltoverarchive.com'
const CDN = 'https://cdn.piltoverarchive.com'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const WIDTH = 640

const ROOT = process.cwd()
const LEGEND_DIR = path.join(ROOT, 'public', 'assets', 'legends')
const COLOR_DIR = path.join(ROOT, 'public', 'assets', 'colors')
const OUT_JSON = path.join(ROOT, 'public', 'assets', 'legends.json')

const COLORS = ['Fury', 'Calm', 'Mind', 'Body', 'Order', 'Chaos']

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

async function fetchAllPages(query) {
  const out = []
  let page = 1
  for (;;) {
    const sep = query ? '&' : ''
    const json = await fetchJson(`${ORIGIN}/api/external/v1/cards?${query}${sep}page=${page}`)
    out.push(...json.data)
    if (!json.pagination?.hasNext) break
    page = json.pagination.page + 1
  }
  return out
}

const seen = new Map()
let inflight = 0
let done = 0
let failed = 0

async function download(url, file) {
  try {
    await fs.access(file)
    return // already downloaded
  } catch {
    // not present yet
  }
  const key = url
  if (seen.has(key)) return seen.get(key)
  const p = Promise.withResolvers()
  seen.set(key, p.promise)
  const run = async () => {
    while (inflight > 10) await new Promise((r) => setTimeout(r, 100))
    inflight++
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!res.ok) throw new Error(`${url} -> ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      await fs.writeFile(file, buf)
      done++
      if (done % 25 === 0) console.log(`  downloaded ${done} images...`)
    } catch (e) {
      failed++
      console.error(`  FAILED ${e.message}`)
      seen.delete(key)
      throw e
    } finally {
      inflight--
    }
  }
  p.promise = run()
  return p.promise
}

async function main() {
  await fs.mkdir(LEGEND_DIR, { recursive: true })
  await fs.mkdir(COLOR_DIR, { recursive: true })

  console.log('Fetching legend cards (standard)...')
  const standard = await fetchAllPages('types=legend&variants=standard')
  console.log('Fetching legend cards (overnumbered)...')
  const overnum = await fetchAllPages('types=legend&variants=overnumbered')

  console.log(`standard: ${standard.length}, overnumbered: ${overnum.length}`)

  // Index standard printings by card id
  const stdByCardId = new Map(standard.map((v) => [v.card.id, v]))
  void stdByCardId

  // Merge: attach overnumbered image urls to their base legend
  const legends = new Map()
  for (const v of standard) {
    const c = v.card
    legends.set(c.id, {
      cardId: c.id,
      name: c.name,
      champion: c.super === 'Champion',
      types: c.types,
      energy: c.energy,
      might: c.might,
      power: c.power,
      tags: c.tags,
      colors: (c.colors ?? []).map((x) => x.name),
      set: v.set?.prefix ?? '',
      setName: v.set?.name ?? '',
      number: v.variantNumber,
      image: null,
      overnumbered: [],
    })
  }

  const downloads = []

  for (const v of standard) {
    const entry = legends.get(v.card.id)
    const file = `${v.variantNumber.replace('*', '')}.webp`
    entry.image = `/assets/legends/${file}`
    downloads.push(
      download(`${v.imageUrl}?width=${WIDTH}`, path.join(LEGEND_DIR, file))
        .catch(() => {}),
    )
  }

  for (const v of overnum) {
    const entry = legends.get(v.card.id)
    if (!entry) {
      console.warn(`overnumbered without standard base: ${v.variantNumber} (${v.card.name})`)
      continue
    }
    const file = `${v.variantNumber.replace('*', '')}ov.webp`
    entry.overnumbered.push({ number: v.variantNumber, image: `/assets/legends/${file}` })
    downloads.push(
      download(`${v.imageUrl}?width=${WIDTH}`, path.join(LEGEND_DIR, file))
        .catch(() => {}),
    )
  }

  // Domain (rune) icons
  for (const color of COLORS) {
    const file = `${color}.webp`
    downloads.push(
      download(`${CDN}/colors/${file}`, path.join(COLOR_DIR, file))
        .catch(() => {}),
    )
  }

  await Promise.all(downloads)
  console.log(`done: ${done} downloaded, ${failed} failed`)

  const list = [...legends.values()].sort((a, b) =>
    a.set === b.set ? a.number.localeCompare(b.number) : a.set.localeCompare(b.set),
  )
  await fs.writeFile(OUT_JSON, JSON.stringify({ fetchedAt: new Date().toISOString(), legends: list }, null, 2))
  console.log(`wrote ${OUT_JSON} with ${list.length} legends`)

  await fs.writeFile(
    path.join(ROOT, 'src', 'data', 'legends.gen.json'),
    JSON.stringify(list, null, 2),
  )
  console.log(`wrote src/data/legends.gen.json`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

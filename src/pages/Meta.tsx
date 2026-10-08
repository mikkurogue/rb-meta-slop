import { useState } from 'react'
import { Link } from 'react-router-dom'
import { metaBreakdown, metaToCsv, metaToMarkdown, totalDecksCount } from '@/data/events'
import { useEvents } from '@/data/eventsStore'
import type { LegendMetaRow } from '@/data/events'
import type { TournamentEvent } from '@/data/types'
import { exportRowsPng } from '@/data/pngExport'
import type { PngRow } from '@/data/pngExport'
import LegendMetaTable from '@/components/LegendMetaTable'
import { Section, buttonClass, inputClass, primaryButtonClass } from '@/components/Layout'

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function metaRowsToPng(rows: LegendMetaRow[]): PngRow[] {
  return rows.map((r) => ({
    rank: String(r.decks),
    title: r.legend.name,
    subtitle: `${r.legend.number} · ${r.legend.setName}`,
    image: r.legend.image,
    domains: r.legend.colors,
    record: { w: r.matchWins, l: r.matchLosses, d: r.matchDraws },
    extra: `${(r.share * 100).toFixed(1)}%`,
  }))
}

export default function Meta() {
  const [copied, setCopied] = useState(false)
  const [scope, setScope] = useState<string>('all')
  const { events, loading } = useEvents()
  const scopedEvents: TournamentEvent[] = scope === 'all' ? events : events.filter((e) => e.id === scope)
  const rows = metaBreakdown(scopedEvents)
  const totalDecks = totalDecksCount(scopedEvents)

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading events…</p>
  }

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Meta Breakdown</h1>
        <p className="text-sm text-zinc-400">
          No events yet.{' '}
          <Link to="/events" className="text-app-accent hover:underline">
            Record an event
          </Link>{' '}
          to build the meta.
        </p>
      </div>
    )
  }

  const scopeLabel = scope === 'all' ? 'All events' : (events.find((e) => e.id === scope)?.name ?? 'Event')

  const onCopy = async () => {
    await navigator.clipboard.writeText(metaToMarkdown(rows, totalDecks, scopedEvents))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const onExportPng = () => {
    void exportRowsPng({
      filename: `${scopeLabel.toLowerCase().replace(/\s+/g, '-')}-meta.png`,
      title: `Riftbound Meta — ${scopeLabel}`,
      subtitle: `${scope === 'all' ? `${scopedEvents.length} events` : (events.find((e) => e.id === scope)?.date ?? '')} · ${totalDecks} decks`,
      rankLabel: 'Decks',
      extraLabel: 'Share',
      rows: metaRowsToPng(rows),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Meta Breakdown</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {scope === 'all' ? `${scopedEvents.length} event${scopedEvents.length === 1 ? '' : 's'} · ` : ''}
            {totalDecks} decks played · legends sorted by play rate
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <select value={scope} onChange={(e) => setScope(e.target.value)} className={inputClass}>
            <option value="all">All events</option>
            {[...events].reverse().map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
          <button type="button" className={buttonClass} onClick={onCopy}>
            {copied ? 'Copied' : 'Copy Markdown'}
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => download(metaToCsv(rows, totalDecks), 'riftbound-meta.csv', 'text/csv')}
          >
            Download CSV
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => download(metaToMarkdown(rows, totalDecks, scopedEvents), 'riftbound-meta.md', 'text/markdown')}
          >
            Download Markdown
          </button>
          <button type="button" className={primaryButtonClass} onClick={onExportPng}>
            Export PNG
          </button>
        </div>
      </div>

      <Section title={`Legends played — ${scopeLabel}`}>
        <LegendMetaTable rows={rows} showBracketColumns />
      </Section>

      {scope === 'all' && (
        <Section title="Events included">
          <ul className="space-y-1 text-sm">
            {[...events].reverse().map((ev) => (
              <li key={ev.id} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-app-surface-2/60">
                <Link to={`/events/${ev.id}`} className="text-zinc-200 hover:text-app-accent">
                  {ev.name}
                </Link>
                <span className="text-xs text-zinc-500">
                  {ev.date} · {ev.stages.map((s) => s.standings.length > 0 ? STAGE_LABELS[s.key] : null).filter(Boolean).length} stages filled
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

const STAGE_LABELS = { swiss: 'Swiss', top8: 'Top 8', top4: 'Top 4', finals: 'Finals', winner: 'Winner' } as const

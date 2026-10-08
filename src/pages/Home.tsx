import { Link } from 'react-router-dom'
import { LEGENDS } from '@/data/legends'
import { totalDecksCount } from '@/data/events'
import { useEvents } from '@/data/eventsStore'
import { Section } from '@/components/Layout'

export default function Home() {
  const { events, loading } = useEvents()
  const decks = totalDecksCount(events)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Riftbound Meta Generator</h1>
        <p className="mt-1 text-zinc-400">
          Deck analysis, skirmish tracking and meta breakdowns for the Riftbound TCG.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/deck" className="group rounded-xl border border-app-border bg-app-surface p-5 transition-colors hover:border-app-accent">
          <div className="text-2xl font-bold text-white">Decks</div>
          <p className="mt-1 text-sm text-zinc-400 group-hover:text-zinc-300">
            Paste a Piltover Archive text list, analyze it and export it back out.
          </p>
        </Link>
        <Link to="/events" className="group rounded-xl border border-app-border bg-app-surface p-5 transition-colors hover:border-app-accent">
          <div className="text-2xl font-bold text-white">Events</div>
          <p className="mt-1 text-sm text-zinc-400 group-hover:text-zinc-300">
            Run a skirmish: standings, swiss → top 8 → top 4 → finals → winner.
          </p>
        </Link>
        <Link to="/meta" className="group rounded-xl border border-app-border bg-app-surface p-5 transition-colors hover:border-app-accent">
          <div className="text-2xl font-bold text-white">Meta</div>
          <p className="mt-1 text-sm text-zinc-400 group-hover:text-zinc-300">
            Legend play rates across all your events, with CSV / Markdown export.
          </p>
        </Link>
      </div>

      <Section title="At a glance">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-white">{LEGENDS.length}</div>
            <div className="text-xs text-zinc-500">Legends tracked</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{loading ? '…' : events.length}</div>
            <div className="text-xs text-zinc-500">Events recorded</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{loading ? '…' : decks}</div>
            <div className="text-xs text-zinc-500">Decks played</div>
          </div>
        </div>
      </Section>
    </div>
  )
}

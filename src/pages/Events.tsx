import { useState } from 'react'
import { Link } from 'react-router-dom'
import { makeEvent } from '@/data/events'
import { useEvents } from '@/data/eventsStore'
import type { TournamentEvent } from '@/data/types'
import { LegendThumb } from '@/components/LegendPicker'
import { buttonClass, inputClass, primaryButtonClass, Section } from '@/components/Layout'

export default function Events() {
  const { events, loading, save } = useEvents()
  const [name, setName] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [type, setType] = useState('Skirmish')

  const create = () => {
    if (!name.trim()) return
    const ev = makeEvent(name.trim(), date, type.trim() || 'Skirmish')
    save([...events, ev])
    setName('')
  }

  const remove = (id: string) => {
    save(events.filter((e) => e.id !== id))
  }

  const playerCount = (ev: TournamentEvent) => (ev.stages[0]?.standings.length ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Events</h1>
        <p className="mt-1 text-sm text-zinc-400">Skirmishes, regionals — every event feeds the meta breakdown.</p>
      </div>

      <Section title="New event">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            create()
          }}
        >
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Name
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Friday Night Skirmish" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Date
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Type
            <input className={inputClass} value={type} onChange={(e) => setType(e.target.value)} placeholder="Skirmish" />
          </label>
          <button type="submit" className={primaryButtonClass} disabled={!name.trim()}>
            Create
          </button>
        </form>
      </Section>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-zinc-500">No events yet — create one above.</p>
      ) : (
        <div className="space-y-3">
          {[...events].reverse().map((ev) => (
            <div key={ev.id} className="flex items-center gap-4 rounded-xl border border-app-border bg-app-surface p-4">
              <div className="flex -space-x-2">
                {(ev.stages[0]?.standings ?? [])
                  .slice(0, 4)
                  .map((s) => (
                    <LegendThumb key={s.id} legendNumber={s.legendNumber} size={32} />
                  ))}
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/events/${ev.id}`} className="font-semibold text-white hover:text-app-accent">
                  {ev.name}
                </Link>
                <div className="text-xs text-zinc-500">
                  {ev.date} · {ev.type} · {playerCount(ev)} players · {ev.stages.map((s) => s.standings.length > 0 ? s.key : null).filter(Boolean).length} stages filled
                </div>
              </div>
              <Link to={`/events/${ev.id}`} className={buttonClass}>
                Open
              </Link>
              <button type="button" className={buttonClass} onClick={() => remove(ev.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

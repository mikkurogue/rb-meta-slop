import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  advanceStage,
  makeStanding,
  metaBreakdown,
  stagesUpTo,
  totalDecksCount,
} from '@/data/events'
import { useEvents } from '@/data/eventsStore'
import type { StageKey, Standing, TournamentEvent } from '@/data/types'
import { NEXT_STAGE, STAGE_LABEL, STAGE_ORDER, STAGE_SIZE } from '@/data/types'
import { legendByNumber } from '@/data/legends'
import { exportRowsPng } from '@/data/pngExport'
import type { PngRow } from '@/data/pngExport'
import LegendPicker from '@/components/LegendPicker'
import RecordStepper from '@/components/RecordStepper'
import LegendMetaTable from '@/components/LegendMetaTable'
import { Section, buttonClass, primaryButtonClass } from '@/components/Layout'

function standingsToPngRows(standings: Standing[]): PngRow[] {
  return standings.map((s, i) => {
    const legend = legendByNumber(s.legendNumber)
    return {
      rank: String(i + 1),
      title: s.player || 'Unknown player',
      subtitle: legend ? `${legend.name} · ${legend.number}` : 'no legend set',
      image: legend?.image,
      domains: legend?.colors ?? [],
      record: { w: s.wins, l: s.losses, d: s.draws },
    }
  })
}

export default function EventDetail() {
  const { id } = useParams()
  const { events, loading, save } = useEvents()
  const event = events.find((e) => e.id === id)
  const [activeTab, setActiveTab] = useState<StageKey | 'meta'>('swiss')

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading event…</p>
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">Event not found.</p>
        <Link to="/events" className={buttonClass}>
          Back to events
        </Link>
      </div>
    )
  }

  const persist = (next: TournamentEvent) => {
    save(events.map((e) => (e.id === next.id ? next : e)))
  }

  const isMetaTab = activeTab === 'meta'
  const stage = isMetaTab ? event.stages[0]! : (event.stages.find((s) => s.key === activeTab) ?? event.stages[0]!)
  const nextKey = NEXT_STAGE[stage.key]

  const updateStandings = (standings: typeof stage.standings) => {
    persist({
      ...event,
      stages: event.stages.map((s) => (s.key === stage.key ? { ...s, standings } : s)),
    })
  }

  const onAdvance = () => {
    if (!nextKey) return
    const nextStage = advanceStage(stage, nextKey, STAGE_SIZE[nextKey] ?? stage.standings.length)
    const stages = [...event.stages]
    const existingIndex = stages.findIndex((s) => s.key === nextKey)
    if (existingIndex >= 0) stages[existingIndex] = nextStage
    else stages.push(nextStage)
    stages.sort((a, b) => STAGE_ORDER.indexOf(a.key) - STAGE_ORDER.indexOf(b.key))
    persist({ ...event, stages })
    setActiveTab(nextKey)
  }

  const moveRow = (index: number, delta: number) => {
    const standings = [...stage.standings]
    const target = index + delta
    if (target < 0 || target >= standings.length) return
    const [row] = standings.splice(index, 1)
    standings.splice(target, 0, row!)
    updateStandings(standings)
  }

  const exportStagePng = () => {
    void exportRowsPng({
      filename: `${event.name}-${stage.key}-standings.png`.replace(/\s+/g, '-'),
      title: `${event.name} — ${STAGE_LABEL[stage.key]} standings`,
      subtitle: `${event.date} · ${event.type} · ${stage.standings.length} players`,
      rankLabel: 'Place',
      rows: standingsToPngRows(stage.standings),
    })
  }

  const metaRows = metaBreakdown([event])
  const exportEventMetaPng = () => {
    void exportRowsPng({
      filename: `${event.name}-meta.png`.replace(/\s+/g, '-'),
      title: `${event.name} — meta`,
      subtitle: `${event.date} · ${event.type} · ${totalDecksCount([event])} decks`,
      rankLabel: 'Decks',
      extraLabel: 'Share',
      rows: metaRows.map((r) => ({
        rank: String(r.decks),
        title: r.legend.name,
        subtitle: `${r.legend.number} · ${r.legend.setName}`,
        image: r.legend.image,
        domains: r.legend.colors,
        record: { w: r.matchWins, l: r.matchLosses, d: r.matchDraws },
        extra: `${(r.share * 100).toFixed(1)}%`,
      })),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{event.name}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {event.date} · {event.type}
          </p>
        </div>
        <Link to="/events" className={buttonClass}>
          All events
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {stagesUpTo(event.stages[event.stages.length - 1]!.key).map((key) => {
          const filled = event.stages.some((s) => s.key === key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                activeTab === key
                  ? 'border-app-accent bg-app-accent/15 text-white'
                  : filled
                    ? 'border-app-border bg-app-surface-2 text-zinc-300 hover:border-app-accent'
                    : 'border-dashed border-app-border text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {STAGE_LABEL[key]}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setActiveTab('meta')}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            isMetaTab ? 'border-app-accent bg-app-accent/15 text-white' : 'border-app-border bg-app-surface-2 text-zinc-300 hover:border-app-accent'
          }`}
        >
          Meta
        </button>
      </div>

      {isMetaTab ? (
        <Section
          title="Event meta"
          actions={
            metaRows.length > 0 && (
              <button type="button" className={primaryButtonClass} onClick={exportEventMetaPng}>
                Export PNG
              </button>
            )
          }
        >
          <LegendMetaTable rows={metaRows} />
          <p className="mt-3 text-xs text-zinc-500">
            Decks counted from the Swiss stage. Records (W-L-D) are summed across all stages of this event.
          </p>
        </Section>
      ) : (
        <Section
          title={`${STAGE_LABEL[stage.key]} standings`}
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                className={buttonClass}
                onClick={() => updateStandings([...stage.standings, makeStanding()])}
              >
                + Add player
              </button>
              {stage.standings.length > 0 && (
                <button type="button" className={buttonClass} onClick={exportStagePng}>
                  Export PNG
                </button>
              )}
              {nextKey && (
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={onAdvance}
                  disabled={stage.standings.length < (STAGE_SIZE[nextKey] ?? 1)}
                  title={
                    stage.standings.length < (STAGE_SIZE[nextKey] ?? 1)
                      ? `Needs at least ${STAGE_SIZE[nextKey]} players`
                      : `Advance top ${STAGE_SIZE[nextKey]} to ${STAGE_LABEL[nextKey]}`
                  }
                >
                  Advance → {STAGE_LABEL[nextKey]}
                </button>
              )}
            </div>
          }
        >
          {stage.standings.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {stage.key === 'swiss'
                ? 'Add the players and their legends.'
                : `Advance players from ${STAGE_LABEL[STAGE_ORDER[STAGE_ORDER.indexOf(stage.key) - 1]] ?? 'the previous stage'} to fill this bracket.`}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-app-border text-left text-xs text-zinc-500 uppercase">
                    <th className="w-10 py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Player</th>
                    <th className="py-2 pr-2">Legend</th>
                    {stage.key === 'swiss' && <th className="w-20 py-2 pr-2">Points</th>}
                    <th className="py-2 pr-2" title="Wins · Losses · Draws">
                      Record <span className="text-emerald-400">W</span>·<span className="text-red-400">L</span>·
                      <span className="text-zinc-300">D</span>
                    </th>
                    <th className="w-36 py-2 pr-2">Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border/60">
                  {stage.standings.map((s, i) => (
                    <tr key={s.id} className="align-middle">
                      <td className="py-1.5 pr-2 font-mono text-zinc-400">{i + 1}</td>
                      <td className="py-1.5 pr-2">
                        <input
                          value={s.player}
                          onChange={(e) =>
                            updateStandings(stage.standings.map((x) => (x.id === s.id ? { ...x, player: e.target.value } : x)))
                          }
                          placeholder="Player name"
                          className="w-44 rounded-md border border-transparent bg-transparent px-2 py-1 hover:border-app-border focus:border-app-accent"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <LegendPicker
                          legendNumber={s.legendNumber}
                          useOvernumbered={s.useOvernumbered}
                          onChange={(legendNumber, useOvernumbered) =>
                            updateStandings(
                              stage.standings.map((x) => (x.id === s.id ? { ...x, legendNumber, useOvernumbered } : x)),
                            )
                          }
                        />
                      </td>
                      {stage.key === 'swiss' && (
                        <td className="py-1.5 pr-2">
                          <input
                            type="number"
                            min={0}
                            value={s.points}
                            onChange={(e) =>
                              updateStandings(
                                stage.standings.map((x) => (x.id === s.id ? { ...x, points: Number(e.target.value) || 0 } : x)),
                              )
                            }
                            className="w-16 rounded-md border border-app-border bg-app-surface-2 px-2 py-1"
                          />
                        </td>
                      )}
                      <td className="py-1.5 pr-3">
                        <RecordStepper
                          standing={s}
                          onChange={(patch) =>
                            updateStandings(stage.standings.map((x) => (x.id === s.id ? { ...x, ...patch } : x)))
                          }
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <div className="flex gap-1">
                          <button type="button" className={buttonClass} onClick={() => moveRow(i, -1)} disabled={i === 0}>
                            ↑
                          </button>
                          <button
                            type="button"
                            className={buttonClass}
                            onClick={() => moveRow(i, 1)}
                            disabled={i === stage.standings.length - 1}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className={buttonClass}
                            onClick={() => updateStandings(stage.standings.filter((x) => x.id !== s.id))}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {!isMetaTab && (
        <p className="text-xs text-zinc-500">
          Row order is placement.{' '}
          {nextKey
            ? `“Advance” carries the top ${STAGE_SIZE[nextKey] ?? 1}${stage.key === 'swiss' ? ' (by points)' : ''} into ${STAGE_LABEL[nextKey]}.`
            : 'The winner takes it all.'}
        </p>
      )}
    </div>
  )
}

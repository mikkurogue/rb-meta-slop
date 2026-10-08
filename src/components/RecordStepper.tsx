import type { Standing } from '@/data/types'

const BTN =
  'flex h-5 w-5 items-center justify-center rounded border border-app-border bg-app-surface-2 text-[11px] leading-none text-zinc-400 hover:border-app-accent hover:text-white'

function Step({
  letter,
  title,
  value,
  color,
  onChange,
}: {
  letter: string
  title: string
  value: number
  color: string
  onChange: (v: number) => void
}) {
  const v = Number.isFinite(value) ? value : 0
  return (
    <div className="flex items-center gap-1" title={title}>
      <span className={`w-3 text-[11px] font-bold ${color}`}>{letter}</span>
      <button type="button" aria-label={`${title} minus`} title={`Less ${title.toLowerCase()}`} className={BTN} onClick={() => onChange(Math.max(0, v - 1))}>
        −
      </button>
      <span className={`w-5 text-center font-mono text-sm ${color}`}>{v}</span>
      <button type="button" aria-label={`${title} plus`} title={`More ${title.toLowerCase()}`} className={BTN} onClick={() => onChange(v + 1)}>
        +
      </button>
    </div>
  )
}

export default function RecordStepper({
  standing,
  onChange,
}: {
  standing: Standing
  onChange: (patch: Partial<Pick<Standing, 'wins' | 'losses' | 'draws'>>) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Step letter="W" title="Wins" value={standing.wins} color="text-emerald-400" onChange={(wins) => onChange({ wins })} />
      <Step letter="L" title="Losses" value={standing.losses} color="text-red-400" onChange={(losses) => onChange({ losses })} />
      <Step letter="D" title="Draws" value={standing.draws} color="text-zinc-300" onChange={(draws) => onChange({ draws })} />
    </div>
  )
}

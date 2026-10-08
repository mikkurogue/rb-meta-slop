import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { legendByNumber, searchLegends } from '@/data/legends'
import { DomainList } from './Layout'

export function LegendThumb({
  legendNumber,
  useOvernumbered,
  size = 40,
}: {
  legendNumber: string | null
  useOvernumbered?: boolean
  size?: number
}) {
  const legend = legendByNumber(legendNumber)
  if (!legend) {
    return <div style={{ width: size, height: size * 1.4 }} className="rounded-md border border-app-border bg-app-surface-2" />
  }
  const src =
    useOvernumbered && legend.overnumbered.length > 0 ? legend.overnumbered[0]!.image : legend.image
  return (
    <img
      src={src}
      alt={legend.name}
      width={size}
      height={size * 1.4}
      style={{ width: size, height: size * 1.4 }}
      className="rounded-md border border-app-border object-cover"
    />
  )
}

const PANEL_WIDTH = 352
const PANEL_MAX_HEIGHT = 340

export default function LegendPicker({
  legendNumber,
  useOvernumbered,
  onChange,
}: {
  legendNumber: string | null
  useOvernumbered: boolean
  onChange: (legendNumber: string | null, useOvernumbered: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const results = useMemo(() => searchLegends(query).slice(0, 60), [query])
  const selected = legendByNumber(legendNumber)

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 8))
    const below = rect.bottom + 4
    const openUpwards = below + PANEL_MAX_HEIGHT > window.innerHeight - 8 && rect.top - PANEL_MAX_HEIGHT > 8
    const top = openUpwards ? Math.max(8, rect.top - PANEL_MAX_HEIGHT - 8) : below
    setPos({ top, left })
  }, [])

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    place()

    const onScroll = () => place()
    const onResize = () => place()
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, place])

  return (
    <div className="flex items-center gap-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false)
            return
          }
          setQuery('')
          setOpen(true)
        }}
        className="flex w-64 items-center gap-2 rounded-lg border border-app-border bg-app-surface-2 px-2 py-1.5 text-left text-sm hover:border-app-accent"
      >
        <LegendThumb legendNumber={legendNumber} size={24} />
        <span className="min-w-0 flex-1 truncate">
          {selected ? selected.name : <span className="text-zinc-500">Pick legend…</span>}
        </span>
        {selected && <DomainList domains={selected.colors} size={14} />}
      </button>
      {selected && selected.overnumbered.length > 0 && (
        <button
          type="button"
          onClick={() => onChange(selected.number, !useOvernumbered)}
          title={`Overnumbered printings: ${selected.overnumbered.map((o) => o.number).join(', ')}`}
          className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${
            useOvernumbered ? 'border-app-accent bg-app-accent text-white' : 'border-app-border bg-app-surface-2 text-zinc-400'
          }`}
        >
          OV
        </button>
      )}
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: PANEL_WIDTH }}
            className="z-50 rounded-xl border border-app-border bg-app-surface shadow-2xl shadow-black/70"
          >
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search legends…"
              className="w-full border-b border-app-border bg-transparent px-3 py-2 text-sm placeholder-zinc-500"
            />
            <div className="overflow-y-auto p-1" style={{ maxHeight: PANEL_MAX_HEIGHT - 44 }}>
              {results.map((l) => (
                <button
                  key={l.cardId}
                  type="button"
                  onClick={() => {
                    onChange(l.number, false)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-app-surface-2"
                >
                  <img src={l.image} alt="" className="h-9 w-7 rounded border border-app-border object-cover" />
                  <span className="min-w-0 flex-1 truncate">{l.name}</span>
                  <span className="text-xs text-zinc-500">{l.number}</span>
                  <DomainList domains={l.colors} size={13} />
                </button>
              ))}
              {results.length === 0 && <div className="px-3 py-4 text-sm text-zinc-500">No legends found</div>}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

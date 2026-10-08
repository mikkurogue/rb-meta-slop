import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { resolveCard } from '@/data/cardImages'

const CARD_W = 252
const CARD_H = 252 * 1.4

export default function CardHover({
  name,
  setCode,
  children,
  className,
}: {
  name: string
  setCode?: string
  children: ReactNode
  className?: string
}) {
  const [preview, setPreview] = useState<{ url: string; caption: string } | null>(null)
  const [pending, setPending] = useState(false)
  const posRef = useRef({ x: 0, y: 0 })
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const timerRef = useRef<number | undefined>(undefined)

  const hide = () => {
    window.clearTimeout(timerRef.current)
    setPending(false)
    setPreview(null)
  }

  useEffect(() => {
    if (!preview && !pending) return
    const onScroll = () => hide()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [preview, pending])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const clampPos = (x: number, y: number) => ({
    x: Math.max(8, Math.min(x + 18, window.innerWidth - CARD_W - 12)),
    y: Math.max(8, Math.min(y - CARD_H / 2, window.innerHeight - CARD_H - 40)),
  })

  return (
    <>
      <span
        className={className}
        onMouseEnter={(e) => {
          posRef.current = { x: e.clientX, y: e.clientY }
          setPos(clampPos(e.clientX, e.clientY))
          window.clearTimeout(timerRef.current)
          timerRef.current = window.setTimeout(async () => {
            setPending(true)
            const card = await resolveCard(name, setCode)
            setPending(false)
            if (card) setPreview({ url: card.imageUrl, caption: `${card.name} · ${card.variantNumber}` })
          }, 180)
        }}
        onMouseLeave={hide}
        onMouseMove={(e) => {
          posRef.current = { x: e.clientX, y: e.clientY }
          setPos((prev) => {
            const next = clampPos(e.clientX, e.clientY)
            return Math.abs(next.x - prev.x) > 2 || Math.abs(next.y - prev.y) > 2 ? next : prev
          })
        }}
      >
        {children}
      </span>
      {(preview || pending) &&
        createPortal(
          <div
            className="pointer-events-none z-[60]"
            style={{ position: 'fixed', left: pos.x, top: pos.y, width: CARD_W }}
          >
            {preview ? (
              <div className="rounded-xl border border-app-border bg-app-surface shadow-2xl shadow-black/70">
                <img src={preview.url} alt={name} width={CARD_W} height={CARD_H} className="w-full rounded-xl" />
                <div className="truncate px-2 py-1 text-center font-mono text-[10px] text-zinc-400">{preview.caption}</div>
              </div>
            ) : (
              <div
                style={{ height: CARD_H }}
                className="flex items-center justify-center rounded-xl border border-app-border bg-app-surface text-xs text-zinc-500"
              >
                loading…
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

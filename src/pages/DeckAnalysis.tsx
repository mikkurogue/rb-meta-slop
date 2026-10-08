import { useMemo, useState } from 'react'
import { parseDeckText, SECTION_LABEL, SECTION_ORDER, sectionCardCount, serializeDeck } from '@/data/deckText'
import { legendByName } from '@/data/legends'
import CardHover from '@/components/CardHover'
import { Section, buttonClass, primaryButtonClass } from '@/components/Layout'
import { LegendThumb } from '@/components/LegendPicker'

const SAMPLE = `# Ziggs Go Boom

## Legend
1 Ziggs, Hexplosives Expert (RAD-169)

## Battlefields
3 Minefield (OGN-302)

## Runes
2 Fury Rune (OGN-007)
1 Chaos Rune (OGN-008)

## Main Deck
4 Ziggs, Short-Fused (RAD-023)
3 Absorb (OGN-044)
2 Ravenous Flock (OGN-090)
`

export default function DeckAnalysis() {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const deck = useMemo(() => parseDeckText(text), [text])

  const hasContent = text.trim().length > 0
  const totalMain = sectionCardCount(deck.sections.maindeck)

  const domainCounts = new Map<string, number>()
  for (const line of deck.sections.legend ?? []) {
    const legend = legendByName(line.name)
    if (!legend) continue
    for (const domain of legend.colors) {
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + line.count)
    }
  }

  const onCopy = async () => {
    await navigator.clipboard.writeText(serializeDeck(deck))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const onDownload = () => {
    const blob = new Blob([serializeDeck(deck)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${deck.name ?? 'deck'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Deck Analysis</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Paste a Piltover Archive text list below. Sections, counts and your legend are detected automatically.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Deck list"
          actions={
            <button type="button" className={buttonClass} onClick={() => setText(SAMPLE)}>
              Load sample
            </button>
          }
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={18}
            spellCheck={false}
            placeholder="# Deck name&#10;&#10;## Legend&#10;1 Jinx, Demolitionist (OGN-030)&#10;&#10;## Main Deck&#10;3x Card Name (OGN-044)"
            className="w-full rounded-lg border border-app-border bg-app-surface-2 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-app-accent"
          />
        </Section>

        <Section
          title="Analysis"
          actions={
            hasContent && (
              <div className="flex gap-2">
                <button type="button" className={buttonClass} onClick={onCopy}>
                  {copied ? 'Copied' : 'Copy text'}
                </button>
                <button type="button" className={primaryButtonClass} onClick={onDownload}>
                  Download .txt
                </button>
              </div>
            )
          }
        >
          {!hasContent ? (
            <p className="text-sm text-zinc-500">Paste a deck list to see the analysis.</p>
          ) : (
            <div className="space-y-4">
              {deck.name && <div className="text-lg font-semibold text-white">{deck.name}</div>}

              {deck.sections.legend && deck.sections.legend.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {deck.sections.legend.map((line) => (
                    <CardHover key={line.id} name={line.name} setCode={line.setCode}>
                      <LegendResult name={line.name} count={line.count} />
                    </CardHover>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label="Main deck" value={totalMain} />
                <Stat label="Battlefields" value={sectionCardCount(deck.sections.battlefields)} />
                <Stat label="Sideboard" value={sectionCardCount(deck.sections.sideboard)} />
              </div>

              {domainCounts.size > 0 && (
                <div>
                  <div className="mb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Domains (from legend)</div>
                  <div className="flex gap-2">
                    {[...domainCounts.entries()].map(([domain, n]) => (
                      <span key={domain} className="rounded-md border border-app-border bg-app-surface-2 px-2 py-1 text-xs">
                        {domain} ×{n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {SECTION_ORDER.map((section) => {
                if (section === 'legend') return null
                const lines = deck.sections[section]
                if (!lines || lines.length === 0) return null
                return (
                  <div key={section}>
                    <div className="mb-1 flex items-baseline justify-between">
                      <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">{SECTION_LABEL[section]}</div>
                      <div className="text-xs text-zinc-500">{sectionCardCount(lines)} cards</div>
                    </div>
                    <ul className="divide-y divide-app-border/60 rounded-lg border border-app-border/60">
                      {lines.map((line) => (
                        <li key={line.id} className="text-sm">
                          <CardHover name={line.name} setCode={line.setCode} className="flex items-center gap-3 px-3 py-1.5">
                            <span className="w-8 text-right font-mono text-zinc-400">{line.count}×</span>
                            <span className="flex-1 truncate">{line.name}</span>
                            {line.setCode && <span className="font-mono text-xs text-zinc-500">{line.setCode}</span>}
                          </CardHover>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-surface-2 px-3 py-2">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  )
}

function LegendResult({ name, count }: { name: string; count: number }) {
  const legend = legendByName(name)
  return (
    <div className="flex w-40 flex-col items-center gap-1 rounded-lg border border-app-border bg-app-surface-2 p-2 text-center">
      <LegendThumb legendNumber={legend?.number ?? null} size={72} />
      <div className="text-xs leading-tight text-zinc-200">{name}</div>
      <div className="font-mono text-[10px] text-zinc-500">{legend ? legend.number : `×${count} · unresolved`}</div>
    </div>
  )
}

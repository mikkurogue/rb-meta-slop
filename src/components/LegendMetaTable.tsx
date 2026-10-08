import type { LegendMetaRow } from '@/data/events'
import { DomainList } from '@/components/Layout'
import { LegendThumb } from '@/components/LegendPicker'

export default function LegendMetaTable({ rows, showBracketColumns }: { rows: LegendMetaRow[]; showBracketColumns?: boolean }) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No decks recorded yet.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-app-border text-left text-xs text-zinc-500 uppercase">
            <th className="py-2 pr-3">Legend</th>
            <th className="py-2 pr-3">Domains</th>
            <th className="py-2 pr-3 text-right">Decks</th>
            <th className="py-2 pr-3 text-right">Share</th>
            <th className="py-2 pr-3 text-right">Record (W-L-D)</th>
            {showBracketColumns && (
              <>
                <th className="py-2 pr-3 text-right">Top 8s</th>
                <th className="py-2 pr-3 text-right">Top 4s</th>
                <th className="py-2 pr-3 text-right">Finals</th>
                <th className="py-2 pr-3 text-right">Wins</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border/60">
          {rows.map((row) => (
            <tr key={row.legend.cardId}>
              <td className="py-2 pr-3">
                <div className="flex items-center gap-2">
                  <LegendThumb legendNumber={row.legend.number} size={28} />
                  <div>
                    <div className="font-medium text-zinc-100">{row.legend.name}</div>
                    <div className="font-mono text-xs text-zinc-500">{row.legend.number}</div>
                  </div>
                </div>
              </td>
              <td className="py-2 pr-3">
                <DomainList domains={row.legend.colors} size={14} />
              </td>
              <td className="py-2 pr-3 text-right font-mono">{row.decks}</td>
              <td className="py-2 pr-3 text-right font-mono text-zinc-300">{(row.share * 100).toFixed(1)}%</td>
              <td className="py-2 pr-3 text-right font-mono">
                <span className="text-emerald-400">{row.matchWins}</span>
                <span className="text-zinc-600">-</span>
                <span className="text-red-400">{row.matchLosses}</span>
                <span className="text-zinc-600">-</span>
                <span className="text-zinc-400">{row.matchDraws}</span>
              </td>
              {showBracketColumns && (
                <>
                  <td className="py-2 pr-3 text-right font-mono text-zinc-400">{row.top8 || '–'}</td>
                  <td className="py-2 pr-3 text-right font-mono text-zinc-400">{row.top4 || '–'}</td>
                  <td className="py-2 pr-3 text-right font-mono text-zinc-400">{row.finals || '–'}</td>
                  <td className="py-2 pr-3 text-right font-mono text-amber-300">{row.wins || '–'}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { domainIcon, DOMAINS } from '@/data/legends'
import type { DomainName } from '@/data/types'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/deck', label: 'Deck Analysis' },
  { to: '/events', label: 'Events' },
  { to: '/meta', label: 'Meta' },
]

export function DomainIcon({ domain, size = 16, title }: { domain: DomainName; size?: number; title?: string }) {
  return (
    <img
      src={domainIcon(domain)}
      alt={domain}
      title={title ?? domain}
      width={size}
      height={size}
      className="inline-block rounded-full bg-black/30"
      style={{ width: size, height: size }}
    />
  )
}

export function DomainList({ domains, size = 16 }: { domains: DomainName[]; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {domains.map((d) => (
        <DomainIcon key={d} domain={d} size={size} />
      ))}
    </span>
  )
}

export function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-app-border bg-app-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

export const inputClass =
  'rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-app-accent'

export const buttonClass =
  'rounded-lg border border-app-border bg-app-surface-2 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-app-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40'

export const primaryButtonClass =
  'rounded-lg bg-app-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40'

export default function Layout() {
  return (
    <div className="flex min-h-full">
      <aside className="w-56 shrink-0 border-r border-app-border bg-app-surface/60 p-4">
        <div className="mb-8 px-2">
          <div className="text-lg font-bold tracking-tight text-white">
            RB <span className="text-app-accent">Meta</span>
          </div>
          <div className="text-xs text-zinc-500">Riftbound meta tools</div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-app-surface-2 text-white' : 'text-zinc-400 hover:bg-app-surface-2/60 hover:text-zinc-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-10 flex flex-wrap gap-2 border-t border-app-border pt-6">
          {DOMAINS.map((d) => (
            <DomainIcon key={d} domain={d} size={18} />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

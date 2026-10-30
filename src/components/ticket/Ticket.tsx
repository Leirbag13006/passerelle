import type { ComponentType, ReactNode, SVGProps } from 'react'
import { Arrow, Spark } from '../icons'
import SmartLink from '../SmartLink'

// Le « billet Passerelle » : motif récurrent du site (verre translucide sur le ciel de nuit).
const s = {
  card: 'ring-1 ring-inset ring-paper/20 bg-[rgb(237_195_196/0.05)] backdrop-blur-md text-paper',
  label: 'text-paper/80',
  key: 'text-paper/60',
  value: 'text-paper',
  arrow: 'text-paper/60',
  chip: 'border border-paper/20 text-paper/85',
  link: 'bg-paper/25',
  pill: 'bg-[rgb(237_195_196/0.07)] text-paper hover:bg-[rgb(237_195_196/0.14)]',
  pillPrimary: 'bg-paper text-navy hover:bg-paper/85',
  stub: 'border-paper/25',
  bars: 'text-paper/45',
}

// Code-barres vertical déterministe (pas de hasard → pas de saut au rendu)
const bars = Array.from({ length: 46 }, (_, i) => {
  const r = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1)
  return { h: r > 0.72 ? 3 : r > 0.4 ? 2 : 1, gap: r > 0.55 ? 2 : 1.5 }
})
let cursor = 0
const barRects = bars.map((b) => {
  const rect = { y: cursor, h: b.h }
  cursor += b.h + b.gap
  return rect
})
const barsHeight = cursor

// Encoches réellement découpées (masque) au niveau du talon : le billet marche sur n'importe quel fond
const notchMask = {
  WebkitMaskImage:
    'radial-gradient(circle at calc(100% - 56px) 0, transparent 12px, #000 12.5px), radial-gradient(circle at calc(100% - 56px) 100%, transparent 12px, #000 12.5px)',
  WebkitMaskComposite: 'source-in',
  maskImage:
    'radial-gradient(circle at calc(100% - 56px) 0, transparent 12px, #000 12.5px), radial-gradient(circle at calc(100% - 56px) 100%, transparent 12px, #000 12.5px)',
  maskComposite: 'intersect',
} as const

export function Ticket({
  stub,
  stamp,
  stampOn = 'stub',
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}: {
  /** contenu du talon (par défaut un code-barres) */
  stub?: ReactNode
  /** tampon de compostage, posé à cheval sur le talon */
  stamp?: ReactNode
  /** 'stub' : sur le talon ; 'perforation' : centré sur la ligne de découpe (plus visible) */
  stampOn?: 'stub' | 'perforation'
  as?: 'div' | 'aside' | 'article' | 'li'
  className?: string
  children: ReactNode
  'aria-label'?: string
}) {
  return (
    <Tag className={`ticket relative flex overflow-hidden rounded-card ${s.card} ${className}`} style={notchMask} {...rest}>
      <div className="min-w-0 flex-1 p-7 md:p-8 xl:p-10">{children}</div>
      {/* talon détachable */}
      <div aria-hidden="true" className={`relative flex w-14 shrink-0 flex-col items-center justify-center gap-4 border-l border-dashed py-8 ${s.stub}`}>
        {stub ?? <Barcode className="h-full max-h-[340px]" />}
      </div>
      {stamp && (
        <div className={`pointer-events-none absolute ${stampOn === 'stub' ? 'right-[-10px] bottom-6' : 'right-14 bottom-5 translate-x-1/2'}`}>{stamp}</div>
      )}
    </Tag>
  )
}

export function Barcode({ className = 'h-full' }: { className?: string }) {
  return (
    <svg width="18" height="100%" viewBox={`0 0 22 ${barsHeight}`} preserveAspectRatio="none" className={`${className} ${s.bars}`}>
      {barRects.map((b, i) => (
        <rect key={i} x="0" y={b.y} width="22" height={b.h} fill="currentColor" />
      ))}
    </svg>
  )
}

export function TicketLabel({ children }: { children: ReactNode }) {
  return (
    <p className={`flex items-center gap-2 text-[0.8125rem] uppercase tracking-[0.07em] ${s.label}`}>
      <Spark width={14} height={14} />
      {children}
    </p>
  )
}

export function TicketRoute({ from, to, fromKey = 'Départ', toKey = 'Arrivée', large = false }: { from: string; to: string; fromKey?: string; toKey?: string; large?: boolean }) {
  const v = large ? 'text-[1.1875rem]' : 'text-[0.9375rem]'
  return (
    <dl className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3 font-mono uppercase">
      <div>
        <dt className={`text-[0.6875rem] tracking-[0.18em] ${s.key}`}>{fromKey}</dt>
        <dd className={`mt-1 tracking-[0.1em] ${v} ${s.value}`}>{from}</dd>
      </div>
      <Arrow width={16} height={16} className={`mb-1.5 ${s.arrow}`} />
      <div>
        <dt className={`text-[0.6875rem] tracking-[0.18em] ${s.key}`}>{toKey}</dt>
        <dd className={`mt-1 tracking-[0.1em] ${v} ${s.value}`}>{to}</dd>
      </div>
    </dl>
  )
}

export function TicketModes({ modes, label = 'Modes de déplacement combinés' }: { modes: { Icon: ComponentType<SVGProps<SVGSVGElement>>; label: string }[]; label?: string }) {
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label={label}>
      {modes.map(({ Icon, label: l }, i) => (
        <li key={l} className="flex items-center gap-2">
          <span title={l} className={`grid size-10 place-items-center rounded-full ${s.chip}`}>
            <Icon width={18} height={18} />
            <span className="sr-only">{l}</span>
          </span>
          {i < modes.length - 1 && <span aria-hidden="true" className={`h-px w-2.5 ${s.link}`} />}
        </li>
      ))}
    </ul>
  )
}

export function TicketButton({ href, children, primary = false }: { href: string; children: ReactNode; primary?: boolean }) {
  return (
    <SmartLink href={href} className={`flex min-h-14 items-center justify-between gap-4 rounded-pill px-7 py-4 text-[1rem] transition-colors ${primary ? s.pillPrimary : s.pill}`}>
      {children}
      <Arrow width={16} height={16} />
    </SmartLink>
  )
}

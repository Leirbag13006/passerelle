import type { ComponentType, ReactNode, SVGProps } from 'react'
import StopMarker, { railPosition } from '../route/StopMarker'

// En-tête de section = un arrêt du trajet : pastille sur le rail, « Arrêt n · nom », titre, chapô
export default function SectionHeading({
  id,
  kicker,
  stop,
  children,
  lead,
}: {
  id: string
  kicker: string
  stop?: { n: number; Icon: ComponentType<SVGProps<SVGSVGElement>> }
  children: ReactNode
  lead?: string
}) {
  return (
    <div className="max-w-[760px]">
      <p className="relative flex items-center gap-3 text-[0.9375rem] font-medium text-accent">
        {stop ? <StopMarker Icon={stop.Icon} className={railPosition} /> : <span aria-hidden="true" className="size-2 rounded-full bg-accent-2" />}
        {stop && <span className="font-mono text-[0.8125rem] tracking-[0.14em] text-paper/60 uppercase">Arrêt {stop.n}</span>}
        {stop && <span aria-hidden="true" className="text-paper/30">·</span>}
        {kicker}
      </p>
      <h2 id={id} className="mt-4 text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.02] font-medium tracking-[-0.035em] text-paper">
        {children}
      </h2>
      {lead && <p className="mt-5 text-[1.1875rem] leading-[1.6] text-mist">{lead}</p>}
    </div>
  )
}

export const Accent = ({ children }: { children: ReactNode }) => (
  <span className="font-serif font-normal tracking-[-0.02em] italic text-accent">{children}</span>
)

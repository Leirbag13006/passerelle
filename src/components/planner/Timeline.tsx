import { Check, Spark, Walk } from '../icons'
import { fmtTime, type Itinerary, type Leg } from '../../planner/engine'
import LineBadge, { modeIcon } from './LineBadge'

// Frise d'un itinéraire, étape par étape (site et application)
export const nowHHMM = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}


export function legSpeech(l: Leg) {
  if (l.kind === 'walk') return `Marchez ${l.minutes} minutes jusqu’à ${l.to}.`
  return `À ${fmtTime(l.depart)}, prenez ${l.line.long} direction ${l.direction} à ${l.from.name}. Descendez à ${l.to.name}, ${l.stopsCount} arrêt${l.stopsCount > 1 ? 's' : ''} plus loin.`
}

export default function Timeline({ it, destName }: { it: Itinerary; destName: string }) {
  return (
    <ol className="mt-6 flex flex-col">
      {it.legs.map((l, i) => (
        <li key={i} className="relative flex gap-4 pb-7">
          <span aria-hidden="true" className="absolute top-12 bottom-1 left-[21px] w-px border-l border-dashed border-paper/30" />
          <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-full ${l.kind === 'walk' ? 'ring-1 ring-paper/30' : 'bg-paper/10 ring-1 ring-accent/50'}`}>
            {l.kind === 'walk' ? <Walk width={19} height={19} /> : (() => { const I = modeIcon[l.line.mode]; return <I width={19} height={19} /> })()}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            {l.kind === 'walk' ? (
              <>
                <p className="text-[1.0625rem] font-medium">
                  <span className="font-mono text-[0.875rem] text-paper/70">{fmtTime(l.depart)}</span> · À pied, {l.minutes} min{' '}
                  {l.meters >= 50 && <span className="font-normal text-mist">({l.meters} m)</span>}
                </p>
                <p className="mt-1 text-[1rem] text-mist">
                  {l.from} <span aria-label="jusqu’à">→</span> {l.to}
                </p>
              </>
            ) : (
              <>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[1.0625rem] font-medium">
                  <span className="font-mono text-[0.875rem] text-paper/70">{fmtTime(l.depart)}</span>
                  <LineBadge mode={l.line.mode} name={l.line.name} />
                  <span>direction {l.direction}</span>
                </p>
                <p className="mt-2 text-[1rem] leading-[1.6] text-mist">
                  Montée à <strong className="font-medium text-paper">{l.from.name}</strong>
                  {l.wait > 0 && ` (attente ${l.wait} min)`}, descente à <strong className="font-medium text-paper">{l.to.name}</strong> à {fmtTime(l.arrive)}, après{' '}
                  {l.stopsCount} arrêt{l.stopsCount > 1 ? 's' : ''}.
                </p>
                <p className="mt-2 flex flex-wrap gap-2 text-[0.875rem]">
                  <span className="rounded-full px-3 py-1 ring-1 ring-paper/25">{l.line.long}</span>
                  <span className={`rounded-full px-3 py-1 ring-1 ${l.crowd === 'forte' ? 'ring-[#ffb4c4]/60 text-[#ffd3dd]' : 'ring-paper/25'}`}>Affluence {l.crowd}</span>
                </p>
              </>
            )}
            {(l.kind === 'ride' ? [l.line.vehicle, ...l.notes] : l.notes).length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {(l.kind === 'ride' ? [...l.notes, l.line.vehicle] : l.notes).map((n) => (
                  <li key={n} className="flex items-start gap-2.5 text-[0.9375rem] leading-[1.5] text-paper/90">
                    <Spark width={13} height={13} className="mt-1.5 shrink-0 text-accent-2" />
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
      <li className="flex gap-4">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-navy">
          <Check width={19} height={19} strokeWidth={2.4} />
        </span>
        <p className="pt-2.5 text-[1.0625rem] font-medium">
          <span className="font-mono text-[0.875rem] text-paper/70">{fmtTime(it.arrive)}</span> · Arrivée à {destName}
        </p>
      </li>
    </ol>
  )
}


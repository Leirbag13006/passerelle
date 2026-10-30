import type { ComponentType, SVGProps } from 'react'

// Pastille d'arrêt sur le rail du trajet. Le composant <Route> la repère via data-stop
// et passe data-reached à true quand la tête du trajet l'atteint.
// Sur grand écran elle se place dans la gouttière gauche (rail), sinon en ligne avec le texte.
export default function StopMarker({ Icon, className = '' }: { Icon: ComponentType<SVGProps<SVGSVGElement>>; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-stop
      data-reached="false"
      className={`grid size-8 shrink-0 place-items-center rounded-full bg-navy text-paper/60 ring-1 ring-paper/30 transition-colors duration-500 data-[reached=true]:bg-accent data-[reached=true]:text-navy data-[reached=true]:ring-accent lg:size-10 ${className}`}
    >
      <Icon width={18} height={18} />
    </span>
  )
}

// Position commune dans la gouttière : le centre de la pastille tombe sur le rail
export const railPosition = 'lg:absolute lg:-left-[66px] lg:top-1/2 lg:-translate-y-1/2'

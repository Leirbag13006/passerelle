import type { Mode } from '../../planner/data'
import { Bus, Train } from '../icons'

export const modeIcon: Record<Mode, typeof Bus> = { metro: Train, tram: Bus, bus: Bus, navette: Bus, ter: Train, 'grandes-lignes': Train }
export const modeName: Record<Mode, string> = { metro: 'Métro', tram: 'Tram', bus: 'Bus', navette: 'Navette', ter: 'Train régional', 'grandes-lignes': 'Grande ligne' }

// Pastille de ligne : picto + nom, jamais la couleur seule
export default function LineBadge({ mode, name }: { mode: Mode; name: string }) {
  const Icon = modeIcon[mode]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1 text-[0.875rem] font-semibold text-navy">
      <Icon width={15} height={15} strokeWidth={2} />
      <span className="sr-only">{modeName[mode]} </span>
      {name}
    </span>
  )
}

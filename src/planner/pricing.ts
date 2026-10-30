// Tarification du billet unique Passerelle. Tarifs INDICATIFS de démonstration,
// inspirés des grilles réelles (ticket urbain 1 h, TER au kilomètre, grandes lignes réservées).
import type { Itinerary, RideLeg } from './engine'

export type Passengers = {
  adults: number
  youths: number // 12-25 ans
  children: number // 4-11 ans
  /** accompagnant·e d'une personne titulaire de la carte mobilité inclusion */
  companion: boolean
  /** carte mobilité inclusion (CMI) mention invalidité ou priorité */
  cmi: boolean
}

export type Options = { assistance: boolean; pmrSeat: boolean; bike: boolean; dog: boolean }

export type PriceLine = { network: string; detail: string; amount: number }

function networkOf(r: RideLeg) {
  const l = r.line
  if (l.id === 'LOCAL') return 'Bus local'
  if (l.id === 'CAR') return 'Car régional'
  if (l.mode === 'ter' || l.id === 'N-AVI') return 'TER Région Sud'
  if (l.mode === 'grandes-lignes') return 'Grandes lignes'
  if (l.id === 'B91') return 'Navette aéroport'
  if (l.id === 'N-AIX' || l.id === 'N-CASSIS') return 'Navettes régionales'
  if (r.from.city === 'Nice') return 'Réseau urbain de Nice'
  if (r.from.city === 'Toulon') return 'Réseau urbain de Toulon'
  return 'Réseau urbain de Marseille'
}

const URBAN: Record<string, number> = { 'Réseau urbain de Marseille': 2.1, 'Réseau urbain de Nice': 1.7, 'Réseau urbain de Toulon': 1.4 }

/** prix plein tarif pour un adulte, par réseau, avec correspondances urbaines incluses pendant 1 h */
function baseLines(it: Itinerary): PriceLine[] {
  const rides = it.legs.filter((l): l is RideLeg => l.kind === 'ride')
  const out: PriceLine[] = []
  let urbanStart: { net: string; t: number } | null = null
  for (const r of rides) {
    const net = networkOf(r)
    if (URBAN[net]) {
      // un ticket urbain couvre toutes les correspondances du même réseau pendant 1 h
      if (urbanStart && urbanStart.net === net && r.depart - urbanStart.t <= 60) {
        const last = out[out.length - 1]
        last.detail += ` + ${r.line.name}`
        continue
      }
      urbanStart = { net, t: r.depart }
      out.push({ network: net, detail: `Ticket 1 h · ${r.line.name}`, amount: URBAN[net] })
      continue
    }
    urbanStart = null
    if (net === 'TER Région Sud') out.push({ network: net, detail: `${r.from.name} → ${r.to.name} (${Math.round(r.km)} km)`, amount: Math.max(1.6, 1.5 + r.km * 0.15) })
    else if (net === 'Grandes lignes') out.push({ network: net, detail: `${r.line.name} ${r.from.name} → ${r.to.name}, place réservée`, amount: 5 + r.km * 0.17 })
    else if (net === 'Navette aéroport') out.push({ network: net, detail: 'Aller simple', amount: 10.9 })
    else if (net === 'Navettes régionales') out.push({ network: net, detail: r.line.long, amount: r.line.id === 'N-AIX' ? 5 : 1.5 })
    else if (net === 'Car régional') out.push({ network: net, detail: `${r.from.name} → ${r.to.name} (${Math.round(r.km)} km)`, amount: Math.min(20, 3 + r.km * 0.08) })
    else out.push({ network: net, detail: `${r.from.name} → ${r.to.name}`, amount: 3 })
  }
  return out
}

export function price(it: Itinerary, p: Passengers, o: Options) {
  const base = baseLines(it)
  const perAdult = base.reduce((s, l) => s + l.amount, 0)
  const rail = base.filter((l) => l.network === 'TER Région Sud' || l.network === 'Grandes lignes').reduce((s, l) => s + l.amount, 0)
  const lines: PriceLine[] = base.map((l) => ({ ...l, amount: l.amount * (p.adults + p.youths + p.children) }))

  const discounts: PriceLine[] = []
  if (p.youths) discounts.push({ network: 'Réduction', detail: `${p.youths} jeune${p.youths > 1 ? 's' : ''} 12-25 ans : −30 % sur le train`, amount: -rail * 0.3 * p.youths })
  if (p.children) discounts.push({ network: 'Réduction', detail: `${p.children} enfant${p.children > 1 ? 's' : ''} 4-11 ans : −50 %`, amount: -perAdult * 0.5 * p.children })
  if (p.cmi) discounts.push({ network: 'Réduction', detail: 'Carte mobilité inclusion : tarif solidaire −50 % (titulaire)', amount: -perAdult * 0.5 })
  if (p.companion) lines.push({ network: 'Accompagnant·e', detail: p.cmi ? 'Gratuit avec la carte mobilité inclusion' : 'Plein tarif', amount: p.cmi ? 0 : perAdult })

  const services: PriceLine[] = []
  if (o.assistance) services.push({ network: 'Service', detail: 'Assistance en gare Accès Plus (réservation transmise)', amount: 0 })
  if (o.dog) services.push({ network: 'Service', detail: 'Chien d’assistance : gratuit sur tous les transports', amount: 0 })
  if (o.pmrSeat) services.push({ network: 'Service', detail: 'Place PMR réservée à bord', amount: 0 })
  if (o.bike) {
    const needsResa = it.legs.some((l) => l.kind === 'ride' && l.line.bikes === 'reservation')
    services.push({ network: 'Service', detail: needsResa ? 'Emplacement vélo réservé (grandes lignes)' : 'Vélo à bord (TER, gratuit)', amount: needsResa ? 10 : 0 })
  }

  const total = Math.max(0, [...lines, ...discounts, ...services].reduce((s, l) => s + l.amount, 0))
  return { lines, discounts, services, total: Math.round(total * 100) / 100 }
}

export const euros = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

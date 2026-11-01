import { travelNeeds } from './derive'
import type { Profile } from './types'

// Ce que Passerelle fera concrètement pour cette personne, en phrases simples
export function promises(p: Profile) {
  const n = travelNeeds(p)
  const out: string[] = []
  if (n.wheelchair) out.push('Des itinéraires praticables en fauteuil, de bout en bout.')
  else if (n.stepFree) out.push('Des itinéraires sans marches : ascenseurs, rampes et accès de plain-pied.')
  if (n.maxWalkMinutes) out.push(`Jamais plus de ${n.maxWalkMinutes} minutes de marche d’affilée.`)
  if (n.audioGuidance) out.push('Un guidage vocal pas à pas, compatible avec votre lecteur d’écran.')
  if (n.visualAlerts) out.push('Les annonces et perturbations en texte, avec alertes visuelles.')
  if (n.deaf) out.push('Votre surdité signalée aux agents d’assistance, pour des échanges par écrit.')
  if (n.assistanceDog) out.push('Votre chien d’assistance voyage gratuitement, et nous le signalons à chaque réservation.')
  if (n.calmRoutes) out.push('Les trajets les plus calmes et les heures creuses en priorité.')
  if (n.fewTransfers) out.push('Le moins de correspondances possible, avec des marges confortables.')
  if (n.detailedGuidance) out.push('Un guidage détaillé à chaque étape : direction, quai, porte et sortie.')
  else out.push('L’essentiel en un coup d’œil : vous connaissez vos trajets, on ne vous encombre pas.')
  if (n.reminders) out.push('Un rappel avant chaque étape : descente, changement, sortie.')
  if (n.stationAssistance) out.push('L’assistance en gare proposée pour chacun de vos trajets en train.')
  if (n.bike) out.push('Des trajets qui acceptent votre vélo, à bord comme en station.')
  if (p.colorBlind) out.push('Des lignes toujours identifiées par un nom et un pictogramme, jamais par la couleur seule.')
  if (!out.length) out.push('Des trajets transmodaux clairs, recalculés en cas d’imprévu.')
  return out
}


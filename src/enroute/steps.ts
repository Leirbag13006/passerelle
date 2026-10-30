// Découpage d'un itinéraire en étapes du mode « En route », adapté au profil.
// Deux niveaux de détail (pas à pas / essentiel) et des couches d'accessibilité qui se combinent.
import type { Line } from '../planner/data'
import { fmtTime, type Itinerary, type Needs, type RideLeg } from '../planner/engine'
import type { InterfacePrefs, Profile } from '../profile/types'

export type Detail = 'pas-a-pas' | 'essentiel'

export type Adapt = {
  detail: Detail
  /** guidage audio en priorité (vue) ou lecture à voix haute choisie */
  audio: boolean
  /** tout passe par l'écran et la vibration (audition) */
  visual: boolean
  stepFree: boolean
  wheelchair: boolean
  /** messages rassurants, alertes formulées calmement */
  calm: boolean
  /** pauses, places assises */
  tired: boolean
  dog: boolean
  bike: boolean
  assistance: boolean
  /** une phrase par étape, détails repliés */
  simplified: boolean
}

export function adaptationFor(profile: Profile | null, needs: Needs | null, prefs: InterfacePrefs): Adapt {
  return {
    detail: !needs || needs.detailedGuidance ? 'pas-a-pas' : 'essentiel',
    audio: (profile?.vision ?? 'ok') !== 'ok' || prefs.readAloud,
    visual: (profile?.hearing ?? 'ok') !== 'ok',
    stepFree: !!needs?.stepFree,
    wheelchair: !!needs?.wheelchair,
    calm: !!needs?.calmRoutes,
    tired: !!needs?.fewTransfers || (needs?.maxWalkMinutes ?? 99) <= 10 || !!profile?.mobility.includes('canne'),
    dog: !!needs?.assistanceDog,
    bike: !!needs?.bike,
    assistance: !!needs?.wheelchair || !!needs?.stationAssistance,
    simplified: prefs.simplified,
  }
}

/** pastilles « accompagnement actif », affichées en haut de l'écran */
export function adaptationLabels(a: Adapt) {
  return [
    a.detail === 'pas-a-pas' ? 'Pas à pas' : 'L’essentiel',
    a.audio && 'Guidage vocal',
    a.visual && 'Annonces en texte',
    a.wheelchair ? 'En fauteuil' : a.stepFree && 'Sans marches',
    a.assistance && 'Assistance en gare',
    a.calm && 'Rassurant',
    a.tired && 'Pauses et places assises',
    a.simplified && 'Simplifié',
  ].filter(Boolean) as string[]
}

export type StepKind = 'walk' | 'enter' | 'meet' | 'board' | 'ride' | 'prepare' | 'alight' | 'arrive'

export type Step = {
  kind: StepKind
  title: string
  detail: string
  time: number
  notes: string[]
  /** information d'accès (ascenseur, porte, rampe) mise en avant */
  access?: string
  /** phrase rassurante */
  reassure?: string
  /** annonce sonore de la gare, transcrite en texte */
  announce?: string
  line?: Line
  /** lieu où l'on se trouve au début de l'étape (pour recalculer depuis ici) */
  at?: { id?: string; name: string; lat: number; lon: number }
  ride?: RideLeg
}

export const primaryLabel: Record<StepKind, string> = {
  walk: 'J’y suis',
  enter: 'Je suis entré·e',
  meet: 'L’agent est avec moi',
  board: 'Je suis à bord',
  ride: 'Je suis descendu·e',
  prepare: 'Je suis prêt·e',
  alight: 'Je suis descendu·e',
  arrive: 'Terminer',
}

const RAIL = ['ter', 'grandes-lignes']
const vehicleWord = (l: Line) => (l.mode === 'metro' ? 'le métro' : l.mode === 'tram' ? 'le tram' : l.mode === 'bus' ? 'le bus' : l.mode === 'navette' ? 'la navette' : 'le train')

function boardingAccess(l: Line, a: Adapt) {
  if (!a.wheelchair) return undefined
  if (RAIL.includes(l.mode)) return 'Montez avec la rampe de l’agent, dans la voiture marquée du pictogramme fauteuil'
  if (l.mode === 'bus' || l.mode === 'navette') return 'Demandez la palette au conducteur, montez par la porte du milieu'
  return 'Montez par la porte marquée du pictogramme fauteuil, au milieu de la rame'
}

export function buildSteps(it: Itinerary, destName: string, origin: Step['at'], a: Adapt): Step[] {
  const steps: Step[] = []
  const pas = a.detail === 'pas-a-pas'
  let at = origin

  for (const l of it.legs) {
    if (l.kind === 'walk') {
      const notes = pas ? [...l.notes] : l.slope ? ['Attention : forte pente'] : []
      if (a.tired && l.minutes > 5) notes.push('Prenez votre temps : des bancs permettent de faire une pause en chemin')
      steps.push({
        kind: 'walk',
        title: pas ? `Marchez jusqu’à ${l.to}` : `À pied jusqu’à ${l.to}`,
        detail: `${l.minutes} min${pas && l.meters >= 50 ? ` · ${l.meters} m` : ''}`,
        time: l.depart,
        notes,
        access: a.stepFree ? 'Cheminement sans marche' : undefined,
        at,
      })
      continue
    }

    const rail = RAIL.includes(l.line.mode)
    const fromAt = { id: l.from.id, name: l.from.name, lat: l.from.lat, lon: l.from.lon }
    const toAt = { id: l.to.id, name: l.to.name, lat: l.to.lat, lon: l.to.lon }
    // consignes du moteur, hors celles que les étapes expriment déjà
    const engineNotes = l.notes.filter((n) => !n.startsWith('Descendez') && !n.startsWith('Rappel') && !n.startsWith('Ascenseur') && !n.startsWith('Suivez') && !n.startsWith('Quai affiché') && !n.startsWith('Montez à l’avant'))
    const extra: string[] = []
    if (a.dog) extra.push('Votre chien : installez-le à vos pieds, hors de l’allée')
    if (a.tired) extra.push('Places assises prioritaires près des portes : n’hésitez pas à les demander')
    if (l.crowd === 'forte') extra.push(a.calm ? 'Il y a du monde à cette heure. Restez près des portes, tout va bien se passer' : 'Affluence forte à cette heure')
    const elevatorFrom = a.stepFree && l.from.elevator === 'ok' ? `Ascenseur en service à ${l.from.name}` : a.stepFree ? 'Accès de plain-pied' : undefined
    const elevatorTo = a.stepFree && l.to.elevator === 'ok' ? `Ascenseur en service à ${l.to.name} : suivez le pictogramme fauteuil` : undefined

    if (!pas) {
      // l'essentiel : une étape par transport, seulement l'indispensable
      steps.push({
        kind: 'ride',
        title: `${l.line.name} direction ${l.direction}`,
        detail: `${l.from.name} ${fmtTime(l.depart)} → ${l.to.name} ${fmtTime(l.arrive)} · ${l.stopsCount} arrêt${l.stopsCount > 1 ? 's' : ''}`,
        time: l.depart,
        notes: [...l.notes.filter((n) => n.includes('Assistance') || n.startsWith('Réservation')), ...(a.dog ? [extra[0]] : [])],
        access: a.stepFree ? [elevatorFrom, elevatorTo && `ascenseur à ${l.to.name}`].filter(Boolean).join(', ') : undefined,
        announce: a.visual ? `Descente à ${l.to.name} : l’arrêt s’affiche sur l’écran à bord` : undefined,
        line: l.line,
        at: fromAt,
        ride: l,
      })
      at = toAt
      continue
    }

    // pas à pas
    steps.push({
      kind: 'enter',
      title: rail ? `Entrez dans la gare ${l.from.name}` : l.line.mode === 'bus' || l.line.mode === 'navette' ? `Rejoignez l’arrêt ${l.from.name}` : `Entrez dans la station ${l.from.name}`,
      detail: rail
        ? 'Le quai s’affiche sur les écrans 20 minutes avant le départ'
        : l.line.mode === 'bus' || l.line.mode === 'navette'
          ? 'Vous validerez votre billet Passerelle en montant, à l’avant'
          : 'Validez votre billet Passerelle (QR code) aux portiques',
      time: l.depart - Math.max(2, l.wait),
      notes: [],
      access: elevatorFrom,
      line: l.line,
      at: fromAt,
      ride: l,
    })
    if (rail && (a.wheelchair || (a.assistance && l.from.assistance))) {
      steps.push({
        kind: 'meet',
        title: 'Rejoignez le point d’accueil Accès Plus',
        detail: `Présentez-vous 30 min avant le départ : un agent vous accompagne jusqu’au train${a.wheelchair ? ', avec la rampe' : ''}`,
        time: l.depart - 30,
        notes: a.visual ? ['Votre surdité est signalée : l’agent échangera avec vous par écrit'] : [],
        reassure: a.calm ? 'Vous n’avez rien d’autre à faire : l’agent s’occupe de tout' : undefined,
        line: l.line,
        at: fromAt,
        ride: l,
      })
    }
    steps.push({
      kind: 'board',
      title: `Attendez ${vehicleWord(l.line)} ${l.line.name} direction ${l.direction}`,
      detail: `${rail ? 'Quai affiché sur les écrans' : `Quai direction ${l.direction}`} · départ ${fmtTime(l.depart)}`,
      time: l.depart,
      notes: [...engineNotes, ...extra],
      access: boardingAccess(l.line, a),
      reassure: a.calm || pas ? `Si vous le manquez, pas de souci : le suivant passe environ ${l.line.headway} min plus tard${rail ? ', et votre billet reste valable' : ''}.` : undefined,
      announce: a.visual ? `« ${l.line.long}, direction ${l.direction} : arrivée à quai dans 2 minutes. »` : undefined,
      line: l.line,
      at: fromAt,
      ride: l,
    })
    if (l.stopsCount > 1 || a.calm) {
      steps.push({
        kind: 'prepare',
        title: `Préparez-vous : prochain arrêt ${l.to.name}`,
        detail: 'Rassemblez vos affaires et approchez-vous de la porte',
        time: l.arrive - 2,
        notes: [],
        announce: a.visual ? `« Prochain arrêt : ${l.to.name}. »` : undefined,
        line: l.line,
        ride: l,
      })
    }
    steps.push({
      kind: 'alight',
      title: `Descendez à ${l.to.name}`,
      detail: `Arrivée ${fmtTime(l.arrive)}`,
      time: l.arrive,
      notes: [],
      access: a.wheelchair && rail ? 'L’agent Accès Plus vous attend avec la rampe à la descente' : elevatorTo,
      line: l.line,
      at: toAt,
      ride: l,
    })
    at = toAt
  }

  steps.push({
    kind: 'arrive',
    title: 'Vous êtes arrivé·e',
    detail: destName,
    time: it.arrive,
    notes: [a.calm ? 'Bravo, vous y êtes. Bonne journée, l’esprit léger !' : 'Bonne journée, l’esprit léger !'],
  })
  return steps
}

/** texte lu à voix haute pour une étape */
export const stepSpeech = (s: Step) => [s.title, s.detail, s.access, s.reassure].filter(Boolean).join('. ') + '.'

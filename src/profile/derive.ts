import { defaultInterface, type Answers, type InterfacePrefs, type Profile } from './types'

// Réglages d'interface proposés à partir des réponses. La personne garde toujours la main :
// ce ne sont que des valeurs de départ, modifiables à la dernière étape et dans l'espace perso.
export function suggestInterface(a: Answers): InterfacePrefs {
  const p = { ...defaultInterface }
  if (a.vision === 'basse-vision') {
    p.textScale = 1.5
    p.contrast = 'eleve'
    p.legibleFont = true
  }
  if (a.vision === 'aveugle') {
    p.readAloud = true
    p.motion = 'reduit'
    p.simplified = true
  }
  if (a.difficulties.includes('lecture')) {
    p.legibleFont = true
    p.readAloud = true
    p.textScale = Math.max(p.textScale, 1.25) as InterfacePrefs['textScale']
  }
  if (a.difficulties.includes('stress') || a.difficulties.includes('fatigue')) {
    p.motion = 'reduit'
    p.simplified = true
  }
  if (a.difficulties.includes('reperage')) p.simplified = true
  return p
}

// Contraintes de trajet tirées du profil, réutilisées par le planificateur
export function travelNeeds(p: Answers) {
  const wheel = p.mobility.some((m) => m.startsWith('fauteuil'))
  // guidage détaillé pour qui voyage peu, ou a du mal à se repérer ; l'essentiel pour les habitués
  const habitue = p.frequency === 'quotidien' || p.frequency === 'hebdo'
  const detailedGuidance = !habitue || p.difficulties.includes('reperage') || p.vision === 'aveugle'
  return {
    detailedGuidance,
    stepFree: wheel || p.avoidStairs || p.companions.includes('poussette'),
    wheelchair: wheel,
    maxWalkMinutes: wheel ? null : p.walkLimit,
    audioGuidance: p.vision !== 'ok',
    visualAlerts: p.hearing !== 'ok',
    /** surdité : échanges écrits avec les agents */
    deaf: p.hearing === 'sourd',
    assistanceDog: p.companions.includes('chien'),
    calmRoutes: p.difficulties.includes('stress') || p.difficulties.includes('foule'),
    fewTransfers: p.difficulties.includes('correspondances') || p.difficulties.includes('fatigue'),
    reminders: p.difficulties.includes('reperage') || p.difficulties.includes('stress') || p.vision === 'aveugle' || p.frequency === 'rare',
    stationAssistance: p.stationAssistance,
    bike: p.mobility.includes('velo') || p.companions.includes('velo'),
  }
}

export function createProfile(a: Answers, prefs: InterfacePrefs, previous?: Profile | null): Profile {
  const now = new Date().toISOString()
  return { version: 1, createdAt: previous?.createdAt ?? now, updatedAt: now, ...a, interface: prefs }
}

// Libellés lisibles, pour le récapitulatif et l'espace perso
export const labels = {
  mobility: {
    marche: 'À pied',
    canne: 'Avec une canne ou un déambulateur',
    'fauteuil-manuel': 'En fauteuil manuel',
    'fauteuil-electrique': 'En fauteuil électrique',
    velo: 'À vélo',
    trottinette: 'En trottinette',
  },
  vision: { ok: 'Je vois bien', 'basse-vision': 'Je vois mal', aveugle: 'Je suis aveugle' },
  hearing: { ok: "J'entends bien", malentendant: "J'entends mal", sourd: 'Je suis sourd·e' },
  difficulties: {
    foule: 'La foule',
    correspondances: 'Les correspondances',
    imprevus: 'Les imprévus',
    reperage: 'Se repérer',
    lecture: 'Lire les informations',
    fatigue: 'La fatigue',
    stress: 'Le stress',
  },
  companions: {
    poussette: 'Une poussette',
    bagages: 'Des bagages',
    velo: 'Un vélo',
    chien: "Un chien d'assistance",
    enfants: 'Des enfants',
    accompagnant: 'Un·e accompagnant·e',
  },
  frequency: {
    quotidien: 'Tous les jours',
    hebdo: 'Chaque semaine',
    occasionnel: 'De temps en temps',
    rare: 'Rarement',
  },
  transports: {
    bus: 'Bus',
    tram: 'Tram',
    metro: 'Métro',
    ter: 'TER',
    'grandes-lignes': 'TGV et Intercités',
    'velo-libre-service': 'Vélo en libre-service',
    covoiturage: 'Covoiturage',
    tpmr: 'Transport à la demande (TPMR)',
  },
} as const

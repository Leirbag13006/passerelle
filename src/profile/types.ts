// Profil Passerelle : ce que la personne nous dit d'elle, et les réglages d'interface qui en découlent.
// Tout reste dans le navigateur (localStorage) ; rien n'est envoyé à un serveur.

export type Mobility = 'marche' | 'canne' | 'fauteuil-manuel' | 'fauteuil-electrique' | 'velo' | 'trottinette'
export type WalkLimit = 5 | 10 | 20 | 30 | 60
export type Vision = 'ok' | 'basse-vision' | 'aveugle'
export type Hearing = 'ok' | 'malentendant' | 'sourd'
export type Difficulty = 'foule' | 'correspondances' | 'imprevus' | 'reperage' | 'lecture' | 'fatigue' | 'stress'
export type Companion = 'poussette' | 'bagages' | 'velo' | 'chien' | 'enfants' | 'accompagnant'
/** fréquence des déplacements : règle le niveau de guidage (quai, direction, sortie…) */
export type Frequency = 'quotidien' | 'hebdo' | 'occasionnel' | 'rare'
export type Transport = 'bus' | 'tram' | 'metro' | 'ter' | 'grandes-lignes' | 'velo-libre-service' | 'covoiturage' | 'tpmr'

export type InterfacePrefs = {
  /** taille du texte : 1 = 100 %, jusqu'à 2 = 200 % */
  textScale: 1 | 1.25 | 1.5 | 1.75 | 2
  contrast: 'standard' | 'eleve'
  motion: 'normal' | 'reduit'
  /** moins d'éléments décoratifs, consignes plus courtes */
  simplified: boolean
  /** boutons « écouter » et lecture des étapes */
  readAloud: boolean
  /** police conçue pour la lisibilité (Atkinson Hyperlegible) */
  legibleFont: boolean
}

export type Profile = {
  version: 1
  createdAt: string
  updatedAt: string
  firstName: string
  mobility: Mobility[]
  walkLimit: WalkLimit | null
  avoidStairs: boolean
  vision: Vision
  colorBlind: boolean
  hearing: Hearing
  difficulties: Difficulty[]
  companions: Companion[]
  transports: Transport[]
  frequency: Frequency | null
  /** assistance en gare (Accès Plus SNCF, aide à l'embarquement) */
  stationAssistance: boolean
  interface: InterfacePrefs
}

export const defaultInterface: InterfacePrefs = {
  textScale: 1,
  contrast: 'standard',
  motion: 'normal',
  simplified: false,
  readAloud: false,
  legibleFont: false,
}

export type Answers = Omit<Profile, 'version' | 'createdAt' | 'updatedAt' | 'interface'>

export const emptyAnswers: Answers = {
  firstName: '',
  mobility: [],
  walkLimit: null,
  avoidStairs: false,
  vision: 'ok',
  colorBlind: false,
  hearing: 'ok',
  difficulties: [],
  companions: [],
  transports: [],
  frequency: null,
  stationAssistance: false,
}

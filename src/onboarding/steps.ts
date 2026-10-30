import type { ComponentType, SVGProps } from 'react'
import { Bike, Bus, Calm, Cane, Clock, Ear, Eye, Stroller, Train, Walk, Wheelchair } from '../components/icons'
import type { Answers } from '../profile/types'

type Icon = ComponentType<SVGProps<SVGSVGElement>>
export type Option = { value: string; label: string; help?: string; Icon?: Icon }

// Case à cocher complémentaire affichée sous les options d'une question
export type Extra = { field: 'avoidStairs' | 'colorBlind' | 'stationAssistance'; label: string; help?: string; when?: (a: Answers) => boolean }

export type Step =
  | { id: string; kind: 'intro'; title: string; help: string }
  | { id: string; kind: 'single' | 'multi'; field: keyof Answers; title: string; help: string; options: Option[]; extras?: Extra[]; when?: (a: Answers) => boolean }
  | { id: string; kind: 'interface'; title: string; help: string }
  | { id: string; kind: 'recap'; title: string; help: string }

const walks = (a: Answers) => a.mobility.includes('marche') || a.mobility.includes('canne') || a.mobility.length === 0
const train = (a: Answers) => a.transports.includes('ter') || a.transports.includes('grandes-lignes')

export const steps: Step[] = [
  {
    id: 'bienvenue',
    kind: 'intro',
    title: 'Faisons connaissance',
    help: 'Quelques questions pour adapter Passerelle à votre façon de vous déplacer. Environ deux minutes. Vous pouvez passer n’importe quelle question et tout modifier ensuite.',
  },
  {
    id: 'deplacement',
    kind: 'multi',
    field: 'mobility',
    title: 'Comment vous déplacez-vous ?',
    help: 'Plusieurs réponses possibles.',
    options: [
      { value: 'marche', label: 'À pied', Icon: Walk },
      { value: 'canne', label: 'Avec une canne ou un déambulateur', Icon: Cane },
      { value: 'fauteuil-manuel', label: 'En fauteuil manuel', Icon: Wheelchair },
      { value: 'fauteuil-electrique', label: 'En fauteuil électrique', Icon: Wheelchair },
      { value: 'velo', label: 'À vélo', Icon: Bike },
      { value: 'trottinette', label: 'En trottinette', Icon: Walk },
    ],
  },
  {
    id: 'marche',
    kind: 'single',
    field: 'walkLimit',
    when: walks,
    title: 'Combien de temps pouvez-vous marcher sans pause ?',
    help: 'Nous éviterons les trajets qui vous demandent davantage.',
    options: [
      { value: '5', label: 'Moins de 5 minutes', Icon: Clock },
      { value: '10', label: 'Environ 10 minutes', Icon: Clock },
      { value: '20', label: 'Environ 20 minutes', Icon: Clock },
      { value: '30', label: 'Une demi-heure', Icon: Clock },
      { value: '60', label: 'Une heure ou plus', Icon: Clock },
    ],
    extras: [{ field: 'avoidStairs', label: 'Je préfère éviter les escaliers', help: 'Ascenseurs, rampes et escalators en priorité.' }],
  },
  {
    id: 'vue',
    kind: 'single',
    field: 'vision',
    title: 'Et votre vue ?',
    help: 'Pour adapter l’affichage et le guidage.',
    options: [
      { value: 'ok', label: 'Je vois bien', Icon: Eye },
      { value: 'basse-vision', label: 'Je vois mal', help: 'Même avec des lunettes', Icon: Eye },
      { value: 'aveugle', label: 'Je suis aveugle', help: 'Ou presque', Icon: Eye },
    ],
    extras: [{ field: 'colorBlind', label: 'Je distingue mal certaines couleurs', help: 'Les lignes ne seront jamais identifiées par la couleur seule.' }],
  },
  {
    id: 'ouie',
    kind: 'single',
    field: 'hearing',
    title: 'Et votre audition ?',
    help: 'Pour les annonces en gare et les alertes.',
    options: [
      { value: 'ok', label: 'J’entends bien', Icon: Ear },
      { value: 'malentendant', label: 'J’entends mal', Icon: Ear },
      { value: 'sourd', label: 'Je suis sourd·e', Icon: Ear },
    ],
  },
  {
    id: 'difficultes',
    kind: 'multi',
    field: 'difficulties',
    title: 'Qu’est-ce qui vous complique un trajet ?',
    help: 'Plusieurs réponses possibles. Aucune n’est obligatoire.',
    options: [
      { value: 'foule', label: 'La foule', Icon: Calm },
      { value: 'correspondances', label: 'Les correspondances', Icon: Bus },
      { value: 'imprevus', label: 'Les imprévus', help: 'Retards, travaux, pannes', Icon: Clock },
      { value: 'reperage', label: 'Se repérer', help: 'Trouver le bon quai, la bonne sortie', Icon: Eye },
      { value: 'lecture', label: 'Lire les informations', help: 'Panneaux, horaires, textes longs', Icon: Eye },
      { value: 'fatigue', label: 'La fatigue', Icon: Calm },
      { value: 'stress', label: 'Le stress', Icon: Calm },
    ],
  },
  {
    id: 'avec-moi',
    kind: 'multi',
    field: 'companions',
    title: 'Vous voyagez souvent avec…',
    help: 'Plusieurs réponses possibles.',
    options: [
      { value: 'poussette', label: 'Une poussette', Icon: Stroller },
      { value: 'bagages', label: 'Des bagages', Icon: Stroller },
      { value: 'velo', label: 'Un vélo', Icon: Bike },
      { value: 'chien', label: 'Un chien d’assistance', Icon: Walk },
      { value: 'enfants', label: 'Des enfants', Icon: Walk },
      { value: 'accompagnant', label: 'Un·e accompagnant·e', Icon: Walk },
    ],
  },
  {
    id: 'transports',
    kind: 'multi',
    field: 'transports',
    title: 'Quels transports utilisez-vous ?',
    help: 'En ville comme dans la région. Plusieurs réponses possibles.',
    options: [
      { value: 'bus', label: 'Bus', Icon: Bus },
      { value: 'tram', label: 'Tram', Icon: Bus },
      { value: 'metro', label: 'Métro', Icon: Train },
      { value: 'ter', label: 'TER', help: 'Trains régionaux', Icon: Train },
      { value: 'grandes-lignes', label: 'TGV et Intercités', Icon: Train },
      { value: 'velo-libre-service', label: 'Vélo en libre-service', Icon: Bike },
      { value: 'covoiturage', label: 'Covoiturage', Icon: Bus },
      { value: 'tpmr', label: 'Transport à la demande', help: 'Service pour personnes à mobilité réduite', Icon: Wheelchair },
    ],
    extras: [
      {
        field: 'stationAssistance',
        label: 'J’aimerais une assistance en gare',
        help: 'Accueil, aide à l’embarquement et au changement de train (service Accès Plus).',
        when: train,
      },
    ],
  },
  {
    id: 'frequence',
    kind: 'single',
    field: 'frequency',
    title: 'À quelle fréquence prenez-vous les transports ?',
    help: 'Plus vous voyagez rarement, plus nous vous guidons : direction, quai, porte, sortie.',
    options: [
      { value: 'quotidien', label: 'Tous les jours', help: 'Je connais mes trajets par cœur', Icon: Clock },
      { value: 'hebdo', label: 'Chaque semaine', Icon: Clock },
      { value: 'occasionnel', label: 'De temps en temps', Icon: Clock },
      { value: 'rare', label: 'Rarement', help: 'Chaque trajet est un peu nouveau pour moi', Icon: Clock },
    ],
  },
  {
    id: 'interface',
    kind: 'interface',
    title: 'Votre interface',
    help: 'Nous avons préparé ces réglages d’après vos réponses. Ils s’appliquent tout de suite : essayez !',
  },
  {
    id: 'recap',
    kind: 'recap',
    title: 'Votre billet est prêt',
    help: 'Vérifiez votre profil. Vous pourrez le modifier ou le supprimer à tout moment depuis votre espace.',
  },
]

export const visibleSteps = (a: Answers) => steps.filter((s) => !('when' in s) || !s.when || s.when(a))

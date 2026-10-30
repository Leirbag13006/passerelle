import { useMemo, useState, type ComponentType, type SVGProps } from 'react'
import { Link } from 'react-router'
import { Arrow, Bike, Bus, Check, Clock, Spark, Train, Walk, Wheelchair } from '../icons'
import SectionHeading, { Accent } from './SectionHeading'
import CloudBank from '../CloudBank'
import Stamp from '../ticket/Stamp'
import { Ticket, TicketLabel, TicketRoute } from '../ticket/Ticket'

type Need = 'fauteuil' | 'vue' | 'calme' | 'poussette' | 'velo'

const needs: { id: Need; label: string }[] = [
  { id: 'fauteuil', label: 'Je me déplace en fauteuil' },
  { id: 'vue', label: 'Je vois mal' },
  { id: 'calme', label: 'Les transports me stressent' },
  { id: 'poussette', label: 'Poussette ou bagages' },
  { id: 'velo', label: 'Je préfère le vélo' },
]

type Step = { Icon: ComponentType<SVGProps<SVGSVGElement>>; title: string; detail: string; min: number; tag?: string }

// Itinéraire démo Gare Saint-Charles → Vieux-Port, réécrit selon le profil
function buildRoute(p: Set<Need>): { steps: Step[]; notes: string[] } {
  const noStairs = p.has('fauteuil') || p.has('poussette')
  const notes: string[] = []
  let steps: Step[]

  if (p.has('velo') && !noStairs) {
    steps = [
      { Icon: Walk, title: 'Marche jusqu’à la station vélo', detail: 'Parvis de la gare, 120 m', min: 2 },
      { Icon: Bike, title: 'Vélo en libre-service', detail: 'Piste cyclable continue par le boulevard', min: 9, tag: '3 vélos dispo' },
      { Icon: Walk, title: 'Dépôt et marche', detail: 'Station Quai des Belges', min: 1 },
    ]
  } else if (noStairs) {
    steps = [
      { Icon: Wheelchair, title: 'Ascenseur, sortie A', detail: 'Rampe d’accès, sans marche', min: 3, tag: 'En service' },
      { Icon: Bus, title: 'Tram T2, plancher bas', detail: 'Accès de plain-pied, 4 arrêts', min: 9 },
      { Icon: Wheelchair, title: 'Trottoir abaissé jusqu’au port', detail: 'Pente < 4 %, 180 m', min: 3 },
    ]
  } else {
    steps = [
      { Icon: Walk, title: 'Escaliers vers le métro', detail: 'Accès direct depuis le hall', min: 2 },
      { Icon: Train, title: 'Métro M1', detail: 'Direction La Fourragère, 2 arrêts', min: 6 },
      { Icon: Walk, title: 'Marche jusqu’au port', detail: 'Sortie Vieux-Port, 200 m', min: 3 },
    ]
  }

  if (p.has('calme')) {
    notes.push('Itinéraire le plus calme : une seule correspondance')
    notes.push('Départ conseillé à 10 h 20, heure creuse')
    steps = steps.map((s) => (s.Icon === Train || s.Icon === Bus ? { ...s, tag: 'Rappel 1 arrêt avant' } : s))
  }
  if (p.has('vue')) notes.push('Guidage vocal pas à pas activé')
  if (noStairs) notes.push('Ascenseurs vérifiés il y a 4 minutes')
  return { steps, notes }
}

export default function ProfileDemo() {
  const [profile, setProfile] = useState<Set<Need>>(new Set())
  const { steps, notes } = useMemo(() => buildRoute(profile), [profile])
  const total = steps.reduce((t, s) => t + s.min, 0)
  const big = profile.has('vue')
  // signature du profil : chaque changement recomposte le billet
  const signature = [...profile].sort().join('+')

  const toggle = (id: Need) =>
    setProfile((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <section id="demo" aria-labelledby="demo-title" className="relative isolate mx-auto max-w-[1280px] px-4 py-28 md:px-10 lg:pl-[104px]">
      <CloudBank bank="left" side="right" top="20px" width="min(44rem, 54vw)" opacity={0.75} flip duration={64} />
      <SectionHeading
        id="demo-title"
        kicker="Essayez · exemple à Marseille"
        stop={{ n: 3, Icon: Bus }}
        lead="Cochez ce qui vous ressemble : le même trajet se réécrit en direct."
      >
        Un trajet, <Accent>autant de versions que de voyageurs</Accent>
      </SectionHeading>

      <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <fieldset>
          <legend className="text-[1.0625rem] font-medium text-paper">Votre profil</legend>
          <div className="mt-4 flex flex-col gap-3">
            {needs.map((n) => {
              const on = profile.has(n.id)
              return (
                <button
                  key={n.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(n.id)}
                  className={`flex min-h-14 items-center gap-4 rounded-2xl px-5 py-3 text-left text-[1.0625rem] transition-colors duration-300 ${
                    on ? 'bg-paper text-navy' : 'bg-paper/[0.04] text-paper ring-1 ring-line hover:ring-paper/45'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid size-6 shrink-0 place-items-center rounded-md transition-colors ${on ? 'bg-navy text-paper' : 'ring-2 ring-paper/40'}`}
                  >
                    {on && <Check width={16} height={16} strokeWidth={2.6} />}
                  </span>
                  {n.label}
                </button>
              )
            })}
          </div>
          {profile.size > 0 && (
            <button type="button" onClick={() => setProfile(new Set())} className="mt-5 min-h-11 text-[1rem] text-accent underline underline-offset-4">
              Tout décocher
            </button>
          )}
          <div className="mt-8 rounded-2xl bg-paper/[0.04] p-5 ring-1 ring-line">
            <p className="text-[1rem] leading-[1.55] text-mist">Ceci est un aperçu. Le vrai planificateur calcule n’importe quel trajet de la Région Sud, selon votre profil complet.</p>
            <Link to="/trajets?de=saint-charles&a=vieux-port" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-6 text-[1rem] font-medium text-navy hover:bg-paper/85">
              Calculer ce trajet pour de vrai
              <Arrow width={16} height={16} />
            </Link>
          </div>
        </fieldset>

        <div aria-live="polite">
          <Ticket
            key={signature || 'vide'}
            className={profile.size > 0 ? 'thud' : ''}
            stampOn="perforation"
            stamp={profile.size > 0 ? <Stamp text="VALIDÉ" word="SUR MESURE" size={112} /> : null}
          >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
            <div className="min-w-0 flex-1">
              <TicketLabel>Votre trajet</TicketLabel>
              <TicketRoute from="St-Charles" to="Vieux-Port" large={big} />
            </div>
            <p className="flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-navy">
              <Clock width={18} height={18} />
              <span className={`font-medium ${big ? 'text-[1.5rem]' : 'text-[1.1875rem]'}`}>{total} min</span>
            </p>
          </div>

          <ol className="mt-7 flex flex-col">
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-5 pb-7 last:pb-0">
                {i < steps.length - 1 && <span aria-hidden="true" className="absolute top-12 bottom-1 left-[21px] w-px border-l border-dashed border-paper/30" />}
                <span className="grid size-11 shrink-0 place-items-center rounded-full text-paper ring-1 ring-paper/25">
                  <s.Icon width={20} height={20} />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className={`leading-[1.3] font-medium text-paper ${big ? 'text-[1.4375rem]' : 'text-[1.125rem]'}`}>
                    {s.title}
                    {s.tag && (
                      <span className="ml-2.5 inline-block rounded-full bg-[#1d4a37] px-3 py-1 align-middle text-[0.8125rem] font-medium text-[#c4f1d4]">{s.tag}</span>
                    )}
                  </p>
                  <p className={`mt-1 text-mist ${big ? 'text-[1.1875rem]' : 'text-[1rem]'}`}>
                    {s.detail} · {s.min} min
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {notes.length > 0 && (
            <ul className="mt-7 flex flex-col gap-2.5 rounded-2xl bg-paper/[0.06] p-5">
              {notes.map((n) => (
                <li key={n} className={`flex items-start gap-3 text-paper ${big ? 'text-[1.1875rem]' : 'text-[1rem]'}`}>
                  <Spark width={16} height={16} className="mt-1 shrink-0 text-accent-2" />
                  {n}
                </li>
              ))}
            </ul>
          )}
          </Ticket>
        </div>
      </div>
    </section>
  )
}

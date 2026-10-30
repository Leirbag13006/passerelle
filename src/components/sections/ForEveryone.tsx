import { Bike, Calm, Cane, Ear, Eye, Stroller, Wheelchair } from '../icons'
import CloudBank from '../CloudBank'
import SectionHeading, { Accent } from './SectionHeading'

const people = [
  { Icon: Wheelchair, title: 'En fauteuil', text: 'Ascenseurs vérifiés, rampes, trottoirs abaissés, véhicules de plain-pied.' },
  { Icon: Eye, title: 'Malvoyant ou aveugle', text: 'Guidage vocal pas à pas, grands caractères, compatible lecteurs d’écran.' },
  { Icon: Ear, title: 'Sourd ou malentendant', text: 'Annonces et perturbations en texte, alertes visuelles et vibrations.' },
  { Icon: Calm, title: 'Anxiété, fatigue, troubles cognitifs', text: 'Trajets calmes, consignes simples, rappels avant chaque étape.' },
  { Icon: Stroller, title: 'Poussette ou bagages', text: 'Itinéraires sans marches et accès les plus larges.' },
  { Icon: Cane, title: 'Mobilité réduite, seniors', text: 'Moins de marche, pauses possibles, places assises signalées.' },
]

export default function ForEveryone() {
  return (
    <section id="pour-qui" aria-labelledby="pour-qui-title" className="relative isolate border-y border-line bg-navy-2/40">
      <CloudBank bank="left" side="left" bottom="-40px" width="min(54rem, 64vw)" opacity={0.9} duration={58} />
      <div className="mx-auto grid max-w-[1280px] gap-14 px-4 py-28 md:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:pl-[104px]">
        <div>
          <SectionHeading
            id="pour-qui-title"
            kicker="Pour qui ?"
            stop={{ n: 2, Icon: Bike }}
            lead="Que votre besoin soit permanent, temporaire ou juste pour aujourd’hui, avec une valise ou une jambe dans le plâtre."
          >
            Pensé pour <Accent>chacun</Accent>, utile à tous
          </SectionHeading>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {people.map(({ Icon, title, text }) => (
            <li key={title} className="rounded-soft bg-paper/[0.04] p-7 ring-1 ring-line">
              <span className="grid size-12 place-items-center rounded-full text-accent ring-1 ring-accent/40">
                <Icon width={24} height={24} />
              </span>
              <h3 className="mt-5 text-[1.25rem] leading-[1.25] font-medium text-paper">{title}</h3>
              <p className="mt-2 text-[1rem] leading-[1.6] text-mist">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

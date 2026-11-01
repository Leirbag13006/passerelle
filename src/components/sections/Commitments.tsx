import { Check, Train } from '../icons'
import CloudBank from '../CloudBank'
import SectionHeading, { Accent } from './SectionHeading'

const items = [
  { title: 'Lisible par tous', text: 'Contrastes renforcés, textes agrandissables, langage simple.' },
  { title: 'Utilisable sans souris', text: 'Navigation au clavier, compatible lecteurs d’écran (VoiceOver, NVDA, TalkBack).' },
  { title: 'Calme par défaut', text: 'Les animations s’arrêtent si votre appareil le demande.' },
  { title: 'Vos données vous appartiennent', text: 'Votre profil reste privé, modifiable et supprimable à tout moment.' },
]

export default function Commitments() {
  return (
    <section id="accessibilite" aria-labelledby="engagements-title" className="relative isolate border-t border-line bg-navy-2/40">
      <CloudBank bank="right" side="left" bottom="-20px" width="min(50rem, 62vw)" opacity={0.85} flip duration={52} />
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 py-28 md:px-10 lg:grid-cols-2 lg:gap-20 lg:pl-[104px]">
        <SectionHeading
          id="engagements-title"
          kicker="Nos engagements"
          stop={{ n: 5, Icon: Train }}
          lead="Un service sur l’accessibilité doit d’abord être accessible lui-même. Passerelle suit le référentiel RGAA et les recommandations WCAG 2.2."
        >
          L’accessibilité, <Accent>ce n’est pas une option</Accent>
        </SectionHeading>

        <ul className="flex flex-col divide-y divide-line self-end">
          {items.map((it) => (
            <li key={it.title} className="flex gap-5 py-6 first:pt-0 last:pb-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-navy">
                <Check width={18} height={18} strokeWidth={2.4} />
              </span>
              <div>
                <h3 className="text-[1.25rem] font-medium text-paper">{it.title}</h3>
                <p className="mt-1.5 text-[1.0625rem] leading-[1.6] text-mist">{it.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

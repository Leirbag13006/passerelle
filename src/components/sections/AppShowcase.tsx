import { Link } from 'react-router'
import CloudBank from '../CloudBank'
import { Arrow, Check, TicketIcon } from '../icons'
import PhoneMockup from '../PhoneMockup'
import SectionHeading, { Accent } from './SectionHeading'

const features = [
  'Votre prochain trajet en un coup d’œil, et un bouton pour démarrer',
  'Le billet unique en plein écran, prêt pour les bornes et le contrôle',
  'Le mode « En route » : une action à la fois, adaptée à votre profil',
  'Le même profil et les mêmes billets que sur le site',
]

// L'application Passerelle : une capture dans la maquette, la démo interactive est sur /application
export default function AppShowcase() {
  return (
    <section id="application" aria-labelledby="app-title" className="relative isolate mx-auto max-w-[1280px] px-4 py-28 md:px-10 lg:pl-[104px]">
      <CloudBank bank="right" side="left" bottom="10%" width="min(42rem, 56vw)" opacity={0.6} flip duration={60} />
      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
        <div>
          <SectionHeading
            id="app-title"
            kicker="L’application"
            stop={{ n: 4, Icon: TicketIcon }}
            lead="Tout ce que fait le site, dans votre téléphone, avec en plus l’accompagnement pendant le trajet."
          >
            Tout Passerelle, <Accent>dans votre poche</Accent>
          </SectionHeading>

          <ul className="mt-10 flex flex-col gap-4">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-4 text-[1.0625rem] leading-[1.55]">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent text-navy">
                  <Check width={15} height={15} strokeWidth={2.6} />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <Link to="/application" className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-6 text-[1rem] font-medium text-navy hover:bg-paper/85">
            Essayer l’application
            <Arrow width={16} height={16} />
          </Link>
        </div>

        <PhoneMockup>
          <img
            src="/app-accueil.webp"
            alt="Écran d’accueil de l’application : recherche « Où allez-vous ? », création du profil, prochain trajet et info trafic."
            width={390}
            height={766}
            loading="lazy"
            className="size-full object-cover object-top"
          />
        </PhoneMockup>
      </div>
    </section>
  )
}

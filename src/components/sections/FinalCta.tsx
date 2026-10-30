import { Bike, Bus, Spark, Train, Walk, Wheelchair } from '../icons'
import StopMarker, { railPosition } from '../route/StopMarker'
import { Ticket, TicketButton, TicketLabel, TicketModes, TicketRoute } from '../ticket/Ticket'

const modes = [
  { Icon: Walk, label: 'Marche' },
  { Icon: Wheelchair, label: 'Fauteuil' },
  { Icon: Bike, label: 'Vélo' },
  { Icon: Bus, label: 'Bus' },
  { Icon: Train, label: 'Train' },
]

// Dernier appel : un ciel de nuit avec la lueur dorée des nuages du hero, et votre billet
export default function FinalCta() {
  return (
    <section id="trajets" aria-labelledby="cta-title" className="mx-auto max-w-[1280px] px-4 py-28 md:px-10 lg:pl-[104px]">
      <p className="relative mb-6 flex items-center gap-3 text-[0.9375rem] font-medium text-accent">
        <StopMarker Icon={Spark} className={railPosition} />
        <span className="font-mono text-[0.8125rem] tracking-[0.14em] text-paper/60 uppercase">Arrêt 5</span>
        <span aria-hidden="true" className="text-paper/30">·</span>À vous de jouer
      </p>
      <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(165deg,#1c2c92_0%,#121b5a_48%,#0d1440_100%)] px-6 py-14 ring-1 ring-line md:px-14 md:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-10%] bottom-[-55%] h-[90%] bg-[radial-gradient(50%_50%_at_35%_100%,rgb(236_170_235/0.40)_0%,rgb(175_80_255/0.18)_45%,rgb(0_0_0/0)_75%)]" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16">
          <div>
            <h2 id="cta-title" className="text-[clamp(2.5rem,5.4vw,4.75rem)] leading-[1] font-medium tracking-[-0.04em] text-paper">
              <span className="font-serif font-normal tracking-[-0.02em] italic text-accent">L’esprit léger,</span>
              <br />à chaque trajet.
            </h2>
            <p className="mt-6 max-w-[40ch] text-[1.1875rem] leading-[1.6] text-mist">
              Créez votre profil en deux minutes. Gratuit, sans engagement, et modifiable quand vous voulez.
            </p>
          </div>

          <Ticket aria-label="Votre billet Passerelle" className="w-full">
            <TicketLabel>Votre billet</TicketLabel>
            <TicketRoute from="Aujourd’hui" to="Partout" />
            <p className="mt-7 text-[1.5rem] leading-[1.2] font-medium tracking-[-0.015em]">Un profil, tous vos trajets.</p>
            <div className="mt-6">
              <TicketModes modes={modes} />
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <TicketButton href="/profil/creer" primary>
                Créer mon profil
              </TicketButton>
              <TicketButton href="/trajets">Planifier un trajet</TicketButton>
            </div>
          </Ticket>
        </div>
      </div>
    </section>
  )
}

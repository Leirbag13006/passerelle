import { Bike, Bus, Check, Eye, Walk, Wheelchair } from '../icons'
import { useInView } from '../../hooks/useInView'
import CloudBank from '../CloudBank'
import Stamp from '../ticket/Stamp'
import { Barcode, Ticket, TicketLabel, TicketRoute } from '../ticket/Ticket'
import SectionHeading, { Accent } from './SectionHeading'

const steps = [
  {
    n: '1',
    stamp: 'Répondu',
    from: 'Questions',
    to: 'Profil',
    title: 'Vous répondez à quelques questions',
    text: 'Comment vous déplacez-vous ? Qu’est-ce qui vous complique un trajet ? Deux minutes suffisent, et vous pouvez passer une question.',
    visual: (
      <div className="flex flex-col gap-2">
        {['Je me déplace en fauteuil', 'Je préfère éviter la foule'].map((q, i) => (
          <span key={q} className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-[0.9375rem] ${i === 0 ? 'bg-paper text-navy' : 'text-paper ring-1 ring-paper/25'}`}>
            <span className={`grid size-5 place-items-center rounded-full ${i === 0 ? 'bg-navy text-paper' : 'ring-1 ring-paper/40'}`}>
              {i === 0 && <Check width={13} height={13} strokeWidth={2.5} />}
            </span>
            {q}
          </span>
        ))}
      </div>
    ),
  },
  {
    n: '2',
    stamp: 'Adapté',
    from: 'Profil',
    to: 'Interface',
    title: 'Passerelle s’adapte à vous',
    text: 'Le site et l’application se règlent selon votre profil : taille du texte, contrastes, lecture vocale, niveau de détail.',
    visual: (
      <div className="flex items-end gap-3">
        <span className="rounded-2xl px-4 py-3 text-[0.875rem] text-paper ring-1 ring-paper/25">Aa</span>
        <span className="rounded-2xl px-4 py-3 text-[1.25rem] text-paper ring-1 ring-paper/25">Aa</span>
        <span className="rounded-2xl bg-paper px-4 py-3 text-[1.75rem] leading-none text-navy">Aa</span>
        <span className="ml-1 grid size-12 place-items-center rounded-2xl text-paper ring-1 ring-paper/25">
          <Eye width={22} height={22} />
        </span>
      </div>
    ),
  },
  {
    n: '3',
    stamp: 'En route',
    from: 'Interface',
    to: 'Trajet',
    title: 'Vous partez l’esprit léger',
    text: 'Des trajets qui combinent marche, fauteuil, vélo, bus et train, vérifiés pour vous et recalculés en cas d’imprévu.',
    visual: (
      <div className="flex items-center gap-1.5">
        {[Walk, Wheelchair, Bus, Bike].map((Icon, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="grid size-11 place-items-center rounded-full text-paper ring-1 ring-paper/25">
              <Icon width={20} height={20} />
            </span>
            {i < 3 && <span className="h-px w-4 bg-paper/30" />}
          </span>
        ))}
      </div>
    ),
  },
]

// Chaque étape est compostée quand elle apparaît à l'écran
function StepTicket({ step: s }: { step: (typeof steps)[number] }) {
  const { ref, inView } = useInView<HTMLLIElement>(0.6)
  return (
    <li ref={ref} className="flex">
      <Ticket
        className={`w-full ${inView ? 'thud' : ''}`}
        stub={
          <>
            <span className="font-serif text-[2.125rem] leading-none text-accent italic">{s.n}</span>
            <Barcode className="w-[18px] flex-1" />
          </>
        }
        stamp={inView ? <Stamp text="PASSERELLE" word={s.stamp.toUpperCase()} size={80} /> : null}
      >
        <TicketLabel>Étape {s.n} sur 3</TicketLabel>
        <TicketRoute from={s.from} to={s.to} />
        <div className="mt-7 flex items-center lg:min-h-[120px]">{s.visual}</div>
        <h3 className="mt-7 text-[1.5rem] leading-[1.2] font-medium tracking-[-0.015em]">{s.title}</h3>
        <p className="mt-3 text-[1.0625rem] leading-[1.6] text-mist">{s.text}</p>
      </Ticket>
    </li>
  )
}

export default function HowItWorks() {
  return (
    <section id="concept" aria-labelledby="concept-title" className="relative isolate mx-auto max-w-[1280px] px-4 pt-20 pb-28 md:px-10 lg:pl-[104px]">
      <CloudBank bank="right" side="right" top="-10px" width="min(56rem, 66vw)" opacity={0.95} duration={46} />
      <SectionHeading
        id="concept-title"
        kicker="Comment ça marche"
        stop={{ n: 1, Icon: Walk }}
        lead="Un seul profil, et tout Passerelle se met à votre mesure. Pas de réglages cachés, pas de jargon."
      >
        Trois étapes, <Accent>et c’est parti</Accent>
      </SectionHeading>

      <ol className="mt-16 grid gap-5 lg:grid-cols-3">
        {steps.map((s) => (
          <StepTicket key={s.n} step={s} />
        ))}
      </ol>
    </section>
  )
}

import { Bike, Bus, Train, Walk, Wheelchair } from './icons'
import { Ticket, TicketButton, TicketLabel, TicketModes, TicketRoute } from './ticket/Ticket'
import { useProfile } from '../profile/ProfileContext'

const modes = [
  { Icon: Walk, label: 'Marche' },
  { Icon: Wheelchair, label: 'Fauteuil' },
  { Icon: Bike, label: 'Vélo' },
  { Icon: Bus, label: 'Bus' },
  { Icon: Train, label: 'Train' },
]

export default function BoardingPass() {
  const { profile } = useProfile()
  return (
    <Ticket as="aside" aria-label="Votre billet Passerelle" className="w-full max-w-[440px]">
      <TicketLabel>Billet Passerelle</TicketLabel>
      <TicketRoute from="Mon profil" to="Partout" />
      <h2 className="mt-7 text-[1.75rem] leading-[1.15] font-normal tracking-[-0.01em] xl:text-[1.875rem]">Un site, une app et des trajets taillés pour vous.</h2>
      <div className="mt-6">
        <TicketModes modes={modes} />
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <TicketButton href={profile ? '/espace' : '/profil/creer'}>{profile ? 'Voir mon billet' : 'Répondre au questionnaire'}</TicketButton>
        <TicketButton href="/trajets?de=saint-charles&a=vieux-port">Planifier un trajet</TicketButton>
      </div>
    </Ticket>
  )
}

import { useState } from 'react'
import PhoneMockup from '../components/PhoneMockup'
import InfoPage from './InfoPage'

const screens = [
  { label: 'Accueil', src: '/app' },
  { label: 'Chercher un trajet', src: '/app/trajets?de=saint-charles&a=vieux-port' },
  { label: 'Mes billets', src: '/app/billets' },
  { label: 'Mon profil', src: '/app/profil' },
]

// Démo de l'application : l'app réelle, utilisable dans une maquette de téléphone
export default function AppDemo() {
  const [screen, setScreen] = useState(screens[0])

  return (
    <InfoPage
      kicker="L’application"
      title={
        <>
          Essayez l’app, <span className="font-serif font-normal tracking-[-0.02em] text-accent italic">pour de vrai</span>
        </>
      }
      intro="Le téléphone contient l’application réelle : cherchez un trajet, prenez un billet de démonstration, lancez le mode En route."
    >
      <div className="grid items-start gap-12 md:grid-cols-[minmax(0,1fr)_340px] md:gap-14">
        <div className="md:pt-6">
          <p id="essayer-ecran" className="text-[1.0625rem] font-medium">
            Aller directement à un écran
          </p>
          <div role="group" aria-labelledby="essayer-ecran" className="mt-4 flex flex-wrap gap-2">
            {screens.map((s) => (
              <button
                key={s.label}
                type="button"
                aria-pressed={screen.label === s.label}
                onClick={() => setScreen(s)}
                className={`min-h-12 rounded-full px-5 text-[0.9375rem] transition-colors ${screen.label === s.label ? 'bg-paper font-medium text-navy' : 'ring-1 ring-paper/30 hover:ring-paper/70'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-8 text-[1rem] leading-[1.6] text-mist">
            Le profil et les billets créés ici sont enregistrés sur cet appareil : vous les retrouvez aussi sur le site, dans « Mon espace » et « Mes billets ».
          </p>
        </div>

        {/* la clé force le rechargement de l'écran choisi */}
        <PhoneMockup key={screen.src}>
          <iframe src={screen.src} title={`Application Passerelle : ${screen.label}`} className="size-full border-0" />
        </PhoneMockup>
      </div>
    </InfoPage>
  )
}

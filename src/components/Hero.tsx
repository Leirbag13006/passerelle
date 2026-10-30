import BoardingPass from './BoardingPass'
import SkyBackground from './SkyBackground'
import { Arrow } from './icons'
import SmartLink from './SmartLink'
import { useProfile } from '../profile/ProfileContext'

export default function Hero() {
  const { profile } = useProfile()
  return (
    <section id="accueil" aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      {/* fond : ciel animé + voiles (assombri à gauche pour la lisibilité, fondu en bas) */}
      <div className="absolute inset-0 -z-10">
        <SkyBackground className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(9_9_9/0.55),rgb(0_0_0/0)_55%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgb(0_0_0/0.35),rgb(0_0_0/0))]" />
        {/* fondu vers le bleu nuit des sections */}
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#0b1238_0%,rgb(11_18_56/0.85)_8%,rgb(11_18_56/0)_32%)]" />
      </div>

      <div className="mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-14 px-4 pt-28 pb-16 md:px-10 lg:grid-cols-[minmax(0,1fr)_auto] xl:gap-16 lg:gap-10 lg:pt-28">
        <div>
          <h1
            id="hero-title"
            className="text-[clamp(2.875rem,5.9vw,6.5rem)] leading-[0.9] tracking-[-0.03em] text-paper"
          >
            <span className="reveal block" style={{ ['--d' as string]: 100 }}>
              <span className="font-serif text-[1.12em]">Votre </span>
              <span className="font-serif text-[1.12em] italic">nouvelle </span>
              <span className="font-sans font-medium tracking-[-0.045em]">Mobilité</span>
            </span>
            <span className="reveal block font-sans font-medium tracking-[-0.045em]" style={{ ['--d' as string]: 220 }}>
              transmodale
            </span>
            <span className="reveal block text-[1.12em] text-paper/55" style={{ ['--d' as string]: 340 }}>
              <span className="font-serif italic">pour </span>
              <span className="font-serif">tous</span>
            </span>
          </h1>

          <p
            className="reveal mt-9 max-w-[24ch] text-[clamp(1.25rem,1.7vw,1.5rem)] leading-[1.25] font-semibold tracking-[-0.01em] text-paper"
            style={{ ['--d' as string]: 520 }}
          >
            Un profil. Des trajets qui vous ressemblent.
          </p>
          <p
            className="reveal mt-3 max-w-[44ch] text-[1rem] leading-[1.55] font-light text-paper/70"
            style={{ ['--d' as string]: 580 }}
          >
            Répondez à quelques questions : Passerelle adapte son site, son app et vos itinéraires à votre façon de vous déplacer, à pied, en fauteuil, à vélo, en bus ou en train.
          </p>

          <SmartLink
            href={profile ? '/espace' : '/profil/creer'}
            className="reveal group mt-9 inline-flex items-center gap-5 text-[clamp(1.375rem,2vw,1.75rem)] font-light text-paper"
            style={{ ['--d' as string]: 680 }}
          >
            {profile ? 'Retrouver mon espace' : 'Créer mon profil en 2 min'}
            <span className="grid size-16 place-items-center rounded-full border border-paper/60 bg-paper/5 backdrop-blur-sm transition-[transform,background-color] duration-500 ease-out-expo group-hover:scale-105 group-hover:bg-paper/12">
              <Arrow width={24} height={24} className="text-signal transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5" strokeWidth={2} />
            </span>
          </SmartLink>
        </div>

        <div className="reveal hidden justify-end lg:flex" style={{ ['--d' as string]: 760 }}>
          <BoardingPass />
        </div>
      </div>

      <div className="reveal mx-auto flex w-full max-w-[1440px] items-end justify-between px-4 pb-8 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-paper/45 md:px-10" style={{ ['--d' as string]: 900 }}>
        <span>Défiler</span>
        <span className="hidden sm:inline">43.2965° N · 5.3698° E</span>
      </div>
    </section>
  )
}

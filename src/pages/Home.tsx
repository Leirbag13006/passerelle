import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import Footer from '../components/Footer'
import Hero from '../components/Hero'
import Nav from '../components/Nav'
import Route from '../components/route/Route'
import SectionsSky from '../components/SectionsSky'
import Commitments from '../components/sections/Commitments'
import FinalCta from '../components/sections/FinalCta'
import ForEveryone from '../components/sections/ForEveryone'
import HowItWorks from '../components/sections/HowItWorks'
import ProfileDemo from '../components/sections/ProfileDemo'
import AppShowcase from '../components/sections/AppShowcase'

export default function Home() {
  const journey = useRef<HTMLDivElement>(null)
  const { hash } = useLocation()

  // liens /#section depuis les autres pages : on fait défiler jusqu'à la section
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) requestAnimationFrame(() => el.scrollIntoView())
  }, [hash])

  return (
    <>
      <Nav />
      <main id="contenu">
        <Hero />
        {/* la nuit du hero continue sur tout le site */}
        <div ref={journey} className="relative isolate overflow-x-clip bg-navy text-paper">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_25%_at_85%_14%,rgb(60_90_230/0.24),rgb(0_0_0/0)),radial-gradient(45%_25%_at_5%_55%,rgb(175_80_255/0.12),rgb(0_0_0/0)),radial-gradient(50%_25%_at_95%_88%,rgb(225_160_255/0.12),rgb(0_0_0/0))]" />
          <SectionsSky />
          {/* raccord sans couture avec le bas du hero */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(180deg,#0b1238,rgb(11_18_56/0))]" />
          <Route container={journey} />
          {/* le tracé passe par-dessus, dans la gouttière : il ne croise que les pastilles d'arrêt, où il s'interrompt */}
          <div className="relative z-[1]">
            <HowItWorks />
            <ForEveryone />
            <ProfileDemo />
            <AppShowcase />
            <Commitments />
            <FinalCta />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

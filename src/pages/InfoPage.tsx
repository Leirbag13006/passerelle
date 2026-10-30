import { useEffect, useRef, type ReactNode } from 'react'
import Footer from '../components/Footer'
import Nav from '../components/Nav'
import SectionsSky from '../components/SectionsSky'

// Mise en page commune des pages d'information (accessibilité, aide, confidentialité, mentions)
export default function InfoPage({ kicker, title, intro, children }: { kicker: string; title: ReactNode; intro?: string; children: ReactNode }) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    window.scrollTo({ top: 0 })
    titleRef.current?.focus()
  }, [])
  return (
    <>
      <Nav />
      <main id="contenu" className="relative isolate min-h-svh overflow-x-clip bg-navy pt-28 text-paper">
        <SectionsSky />
        <article className="mx-auto max-w-[820px] px-4 pb-28 md:px-10">
          <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-paper/70 uppercase">{kicker}</p>
          <h1 ref={titleRef} tabIndex={-1} className="mt-3 text-[clamp(2.25rem,4.6vw,3.5rem)] leading-[1.04] font-medium tracking-[-0.04em]">
            {title}
          </h1>
          {intro && <p className="mt-5 text-[1.1875rem] leading-[1.6] text-mist">{intro}</p>}
          <div className="mt-12 flex flex-col gap-10">{children}</div>
        </article>
      </main>
      <Footer />
    </>
  )
}

export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card bg-paper/[0.04] p-6 ring-1 ring-line md:p-8">
      <h2 className="text-[1.5rem] font-medium tracking-[-0.015em]">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 text-[1.0625rem] leading-[1.65] text-paper/90">{children}</div>
    </section>
  )
}

/** information à fournir par l'équipe : affichée clairement plutôt qu'inventée */
export const ToFill = ({ children }: { children: ReactNode }) => (
  <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[0.9375rem] text-accent">[à compléter : {children}]</span>
)

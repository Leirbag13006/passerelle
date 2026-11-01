import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SectionsSky from '../components/SectionsSky'
import { Arrow, Check, Spark } from '../components/icons'
import InterfaceControls from '../components/profile/InterfaceControls'
import Stamp from '../components/ticket/Stamp'
import { Ticket, TicketLabel, TicketRoute } from '../components/ticket/Ticket'
import { labels } from '../profile/derive'
import { promises } from '../profile/promises'
import { useSavedTrips } from '../planner/savedTrips'
import { useTickets } from '../planner/tickets'
import { euros } from '../planner/pricing'
import { useProfile } from '../profile/ProfileContext'

export default function Space() {
  const { profile, updateInterface, remove } = useProfile()
  const location = useLocation()
  const navigate = useNavigate()
  const welcome = (location.state as { welcome?: boolean } | null)?.welcome
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { trips, remove: removeTrip, clear: clearTrips } = useSavedTrips()
  const { tickets, clear: clearTickets } = useTickets()
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
    titleRef.current?.focus()
  }, [])

  if (!profile) return <Navigate to="/profil/creer" replace />

  const p = profile
  const chips = [
    ...p.mobility.map((m) => labels.mobility[m]),
    p.vision !== 'ok' && labels.vision[p.vision],
    p.hearing !== 'ok' && labels.hearing[p.hearing],
    ...p.companions.map((c) => `Avec ${labels.companions[c].toLowerCase()}`),
  ].filter(Boolean) as string[]

  const exportProfile = () => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mon-profil-passerelle.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Nav />
      <main id="contenu" className="relative isolate min-h-svh overflow-x-clip bg-navy pt-28 text-paper">
        <SectionsSky />
        <div className="mx-auto max-w-[1180px] px-4 pb-28 md:px-10">
          <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-paper/70 uppercase">Mon espace</p>
          <h1 ref={titleRef} tabIndex={-1} className="mt-3 text-[clamp(2.5rem,5vw,4.25rem)] leading-[1] font-medium tracking-[-0.04em] outline-none">
            {welcome ? 'Bienvenue' : 'Bonjour'}
            {p.firstName ? ` ${p.firstName}` : ''},
            <span className="font-serif font-normal tracking-[-0.02em] text-accent italic"> {welcome ? 'votre billet est prêt.' : 'bon trajet.'}</span>
          </h1>
          {welcome && (
            <p role="status" className="mt-5 max-w-[60ch] text-[1.1875rem] leading-[1.6] text-mist">
              Votre profil est enregistré sur cet appareil. Passerelle s’est déjà adapté : vous pouvez affiner vos réglages ci-dessous.
            </p>
          )}

          <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
            <div className="flex flex-col gap-8">
              {/* le billet du profil */}
              <Ticket aria-label="Mon billet Passerelle" stampOn="perforation" stamp={<Stamp text="PASSERELLE" word="MON PROFIL" size={104} />}>
                <TicketLabel>Mon billet</TicketLabel>
                <TicketRoute from={p.firstName || 'Mon profil'} to="Partout" />
                <h2 className="mt-7 text-[1.5rem] leading-[1.2] font-medium tracking-[-0.015em]">Ce que Passerelle prévoit pour vous</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {promises(p).map((t) => (
                    <li key={t} className="flex items-start gap-3 text-[1.0625rem] leading-[1.5]">
                      <Check width={18} height={18} strokeWidth={2.4} className="mt-1 shrink-0 text-accent" />
                      {t}
                    </li>
                  ))}
                </ul>
                {chips.length > 0 && (
                  <ul className="mt-7 flex flex-wrap gap-2" aria-label="Mon profil en bref">
                    {chips.map((c) => (
                      <li key={c} className="rounded-full px-4 py-2 text-[0.9375rem] ring-1 ring-paper/25">
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/profil/creer" className="inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-[1rem] ring-1 ring-paper/35 hover:ring-paper/70">
                    Modifier mon profil
                  </Link>
                </div>
              </Ticket>

              {/* billets achetés */}
              {tickets.length > 0 && (
                <Ticket aria-label="Mes billets">
                  <TicketLabel>Mes billets</TicketLabel>
                  <h2 className="mt-5 text-[1.5rem] leading-[1.2] font-medium tracking-[-0.015em]">Billets tout compris</h2>
                  <ul className="mt-5 divide-y divide-line">
                    {tickets.map((b) => (
                      <li key={b.code} className="py-3">
                        <Link to={`/billet/${b.code}`} className="block underline-offset-4 hover:underline">
                          <span className="block text-[1.0625rem] font-medium">
                            {b.fromName} <span aria-label="vers">→</span> {b.toName}
                          </span>
                          <span className="block text-[0.9375rem] text-mist">
                            {b.date} · {euros(b.total)} · <span className="font-mono">{b.code}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Ticket>
              )}

              {/* trajets compostés depuis le planificateur */}
              <Ticket aria-label="Mes trajets">
                <TicketLabel>Mes trajets</TicketLabel>
                <h2 className="mt-5 text-[1.5rem] leading-[1.2] font-medium tracking-[-0.015em]">{trips.length ? 'Mes trajets compostés' : 'Planifier un trajet'}</h2>
                {trips.length ? (
                  <ul className="mt-5 divide-y divide-line">
                    {trips.map((t) => (
                      <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <Link to={`/trajets?de=${encodeURIComponent(t.from)}&a=${encodeURIComponent(t.to)}`} className="min-w-0 flex-1 underline-offset-4 hover:underline">
                          <span className="block text-[1.0625rem] font-medium">
                            {t.fromName} <span aria-label="vers">→</span> {t.toName}
                          </span>
                          <span className="block text-[0.9375rem] text-mist">{t.summary}</span>
                        </Link>
                        <button type="button" onClick={() => removeTrip(t.id)} className="min-h-11 px-2 text-[0.875rem] text-mist underline underline-offset-4 hover:text-paper">
                          Retirer<span className="sr-only"> le trajet {t.fromName} vers {t.toName}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 max-w-[48ch] text-[1.0625rem] leading-[1.6] text-mist">
                    Vos itinéraires dans toute la Région Sud, bus, tram, métro, TER et grandes lignes, calculés pour votre profil.
                  </p>
                )}
                <Link to="/trajets" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-6 text-[1rem] font-medium text-navy hover:bg-paper/85">
                  <Spark width={14} height={14} /> {trips.length ? 'Nouveau trajet' : 'Planifier un trajet'}
                </Link>
              </Ticket>
            </div>

            <div className="flex flex-col gap-8">
              <section aria-labelledby="reglages-title" className="rounded-card bg-paper/[0.04] p-7 ring-1 ring-line md:p-8">
                <h2 id="reglages-title" className="text-[1.5rem] font-medium tracking-[-0.015em]">
                  Mon interface
                </h2>
                <p className="mt-1 mb-4 text-[1rem] text-mist">Les changements s’appliquent et s’enregistrent immédiatement.</p>
                <InterfaceControls value={p.interface} onChange={updateInterface} />
              </section>

              <section aria-labelledby="donnees-title" className="rounded-card bg-paper/[0.04] p-7 ring-1 ring-line md:p-8">
                <h2 id="donnees-title" className="text-[1.5rem] font-medium tracking-[-0.015em]">
                  Mes données
                </h2>
                <p className="mt-1 text-[1rem] leading-[1.6] text-mist">Votre profil n’existe que sur cet appareil. Personne d’autre n’y a accès.</p>
                <div className="mt-6 flex flex-col gap-3">
                  <button type="button" onClick={exportProfile} className="flex min-h-12 items-center justify-between rounded-full px-6 text-[1rem] ring-1 ring-paper/30 hover:ring-paper/70">
                    Télécharger mon profil (.json)
                    <Arrow width={16} height={16} className="rotate-90" />
                  </button>
                  {!confirmDelete ? (
                    <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-12 rounded-full px-6 text-left text-[1rem] text-[#ffb4c4] ring-1 ring-[#ffb4c4]/40 hover:ring-[#ffb4c4]">
                      Supprimer mon profil
                    </button>
                  ) : (
                    <div role="alertdialog" aria-labelledby="del-q" className="rounded-2xl p-5 ring-1 ring-[#ffb4c4]/60">
                      <p id="del-q" className="text-[1rem] font-medium">
                        Supprimer définitivement votre profil, vos trajets et vos billets de cet appareil ?
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          autoFocus
                          onClick={() => setConfirmDelete(false)}
                          className="min-h-12 rounded-full bg-paper px-6 text-[1rem] font-medium text-navy"
                        >
                          Garder mon profil
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            remove()
                            clearTrips()
                            clearTickets()
                            navigate('/', { replace: true })
                          }}
                          className="min-h-12 rounded-full px-6 text-[1rem] text-[#ffb4c4] ring-1 ring-[#ffb4c4]/60"
                        >
                          Oui, supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import Footer from '../components/Footer'
import Nav from '../components/Nav'
import LineBadge from '../components/planner/LineBadge'
import SectionsSky from '../components/SectionsSky'
import { Arrow, Walk } from '../components/icons'
import { CheckRow, Stepper } from '../components/planner/FormControls'
import { Ticket, TicketLabel, TicketRoute } from '../components/ticket/Ticket'
import { fmtDuration, fmtTime, type Itinerary } from '../planner/engine'
import { euros, price, type Options, type Passengers } from '../planner/pricing'
import { capFirst, longDate, ticketCode, todayIso, useTickets } from '../planner/tickets'
import { travelNeeds } from '../profile/derive'
import { useProfile } from '../profile/ProfileContext'

type State = { it: Itinerary; from: string; to: string; fromName: string; toName: string; isoDate?: string; replaces?: string }

const section = 'rounded-card bg-paper/[0.04] p-6 ring-1 ring-line md:p-8'

export default function Checkout() {
  const state = useLocation().state as State | null
  const { profile } = useProfile()
  const { tickets, add, update } = useTickets()
  const navigate = useNavigate()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const needs = profile ? travelNeeds(profile) : null
  const it = state?.it
  const rail = !!it?.legs.some((l) => l.kind === 'ride' && (l.line.mode === 'ter' || l.line.mode === 'grandes-lignes'))
  const longDistance = !!it?.legs.some((l) => l.kind === 'ride' && l.line.mode === 'grandes-lignes')

  const [pax, setPax] = useState<Passengers>(() => ({
    adults: 1,
    youths: 0,
    children: 0,
    companion: !!profile?.companions.includes('accompagnant'),
    cmi: false,
  }))
  const [opts, setOpts] = useState<Options>(() => ({
    assistance: rail && !!(needs?.stationAssistance || needs?.wheelchair),
    pmrSeat: longDistance && !!needs?.wheelchair,
    bike: !!needs?.bike,
    dog: !!needs?.assistanceDog,
  }))
  const [method, setMethod] = useState('carte')

  useEffect(() => {
    window.scrollTo({ top: 0 })
    titleRef.current?.focus()
  }, [])

  const bill = useMemo(() => (it ? price(it, pax, opts) : null), [it, pax, opts])
  if (!state || !it || !bill) return <Navigate to="/trajets" replace />

  const travellers = pax.adults + pax.youths + pax.children + (pax.companion ? 1 : 0)
  // échange : le montant de l'ancien billet est déduit
  const old = state.replaces ? tickets.find((t) => t.code === state.replaces) : undefined
  const credit = old && old.status !== 'annule' ? old.total : 0
  const due = Math.max(0, Math.round((bill.total - credit) * 100) / 100)

  const pay = () => {
    const code = ticketCode()
    add({
      code,
      issuedAt: new Date().toISOString(),
      date: longDate(state.isoDate ?? todayIso()),
      isoDate: state.isoDate ?? todayIso(),
      status: 'valide',
      replaces: state.replaces,
      from: state.from,
      to: state.to,
      fromName: state.fromName,
      toName: state.toName,
      it,
      passengers: pax,
      options: opts,
      total: bill.total,
    })
    if (state.replaces) update(state.replaces, { status: 'echange', replacedBy: code })
    navigate(`/billet/${code}`, { replace: true, state: { justBought: true } })
  }

  return (
    <>
      <Nav />
      <main id="contenu" className="relative isolate min-h-svh overflow-x-clip bg-navy pt-28 text-paper">
        <SectionsSky />
        <div className="mx-auto max-w-[1180px] px-4 pb-28 md:px-10">
          <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-paper/70 uppercase">Billet unique · tous transports compris</p>
          <h1 ref={titleRef} tabIndex={-1} className="mt-3 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.02] font-medium tracking-[-0.04em]">
            {state.fromName} <span className="text-paper/50" aria-label="vers">→</span> {state.toName}
          </h1>
          <p className="mt-3 text-[1.125rem] text-mist">
            {capFirst(longDate(state.isoDate ?? todayIso()))} · {fmtTime(it.depart)} → {fmtTime(it.arrive)} · {fmtDuration(it.duration)} · un seul billet pour {it.legs.filter((l) => l.kind === 'ride').length} transport
            {it.legs.filter((l) => l.kind === 'ride').length > 1 ? 's' : ''}
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
            <div className="flex flex-col gap-6">
              <section aria-labelledby="h-trajet" className={section}>
                <h2 id="h-trajet" className="text-[1.375rem] font-medium">
                  Ce que couvre votre billet
                </h2>
                <ol className="mt-5 flex flex-col gap-3">
                  {it.legs.map((l, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-3 text-[1rem]">
                      <span className="w-[4.5rem] shrink-0 font-mono text-[0.875rem] text-paper/70">{fmtTime(l.depart)}</span>
                      {l.kind === 'walk' ? (
                        <span className="inline-flex items-center gap-2 text-mist">
                          <Walk width={16} height={16} /> À pied, {l.minutes} min
                        </span>
                      ) : (
                        <>
                          <LineBadge mode={l.line.mode} name={l.line.name} />
                          <span>
                            {l.from.name} → {l.to.name}
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ol>
              </section>

              <section aria-labelledby="h-voyageurs" className={section}>
                <h2 id="h-voyageurs" className="text-[1.375rem] font-medium">
                  Voyageurs
                </h2>
                <div className="mt-2 divide-y divide-line">
                  <Stepper label="Adultes" value={pax.adults} min={0} onChange={(v) => setPax({ ...pax, adults: v })} />
                  <Stepper label="Jeunes" help="12 à 25 ans : −30 % sur le train" value={pax.youths} onChange={(v) => setPax({ ...pax, youths: v })} />
                  <Stepper label="Enfants" help="4 à 11 ans : −50 % ; gratuit avant 4 ans" value={pax.children} onChange={(v) => setPax({ ...pax, children: v })} />
                  <CheckRow
                    label="J’ai une carte mobilité inclusion (CMI)"
                    help="Tarif solidaire pour le titulaire, et accompagnant·e gratuit·e."
                    checked={pax.cmi}
                    onChange={(v) => setPax({ ...pax, cmi: v })}
                  />
                  <CheckRow label="Je voyage avec un·e accompagnant·e" help={pax.cmi ? 'Gratuit avec votre carte' : undefined} checked={pax.companion} onChange={(v) => setPax({ ...pax, companion: v })} />
                </div>
              </section>

              <section aria-labelledby="h-services" className={section}>
                <h2 id="h-services" className="text-[1.375rem] font-medium">
                  Services inclus
                </h2>
                <div className="mt-2 divide-y divide-line">
                  {rail && (
                    <CheckRow
                      label="Assistance en gare (Accès Plus)"
                      help="Accueil, aide à l’embarquement et rampe si besoin. Gratuit ; nous transmettons la réservation aux gares."
                      checked={opts.assistance}
                      onChange={(v) => setOpts({ ...opts, assistance: v })}
                    />
                  )}
                  {longDistance && <CheckRow label="Place PMR réservée" help="Espace fauteuil ou place adaptée, à côté de l’accès." checked={opts.pmrSeat} onChange={(v) => setOpts({ ...opts, pmrSeat: v })} />}
                  <CheckRow label="Je voyage avec un chien d’assistance" help="Gratuit, sans muselière ; signalé à l’assistance et au contrôle." checked={opts.dog} onChange={(v) => setOpts({ ...opts, dog: v })} />
                  <CheckRow label="Je voyage avec un vélo" help="Gratuit en TER, emplacement réservé sur les grandes lignes." checked={opts.bike} onChange={(v) => setOpts({ ...opts, bike: v })} />
                </div>
              </section>

              <section aria-labelledby="h-paiement" className={section}>
                <h2 id="h-paiement" className="text-[1.375rem] font-medium">
                  Paiement
                </h2>
                <p className="mt-2 rounded-xl bg-accent/10 px-4 py-3 text-[0.9375rem] ring-1 ring-accent/40">
                  Démonstration : aucun paiement réel n’est effectué et aucune donnée bancaire n’est demandée.
                </p>
                <fieldset className="mt-4 grid gap-3 sm:grid-cols-3">
                  <legend className="sr-only">Moyen de paiement</legend>
                  {[
                    ['carte', 'Carte bancaire'],
                    ['mobile', 'Paiement mobile'],
                    ['gare', 'Payer en gare'],
                  ].map(([v, l]) => (
                    <label
                      key={v}
                      className={`flex min-h-14 cursor-pointer items-center justify-center rounded-2xl px-4 text-center text-[1rem] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent ${method === v ? 'bg-paper font-medium text-navy' : 'ring-1 ring-paper/30'}`}
                    >
                      <input type="radio" name="paiement" className="sr-only" checked={method === v} onChange={() => setMethod(v)} />
                      {l}
                    </label>
                  ))}
                </fieldset>
              </section>
            </div>

            {/* récapitulatif du prix, toujours visible sur grand écran */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Ticket aria-label="Récapitulatif du prix">
                <TicketLabel>Billet Passerelle</TicketLabel>
                <TicketRoute from={state.fromName} to={state.toName} />
                <dl className="mt-6 flex flex-col gap-3 text-[0.9375rem]">
                  {[...bill.lines, ...bill.discounts, ...bill.services].map((l, i) => (
                    <div key={i} className="flex items-start justify-between gap-4">
                      <dt>
                        <span className="block font-medium">{l.network}</span>
                        <span className="block text-mist">{l.detail}</span>
                      </dt>
                      <dd className={`shrink-0 font-mono ${l.amount < 0 ? 'text-accent' : ''}`}>{l.amount === 0 ? 'Inclus' : euros(l.amount)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
                  <span className="text-[1.0625rem]">
                    Total · {travellers} voyageur{travellers > 1 ? 's' : ''}
                  </span>
                  <span className="text-[2rem] font-medium tracking-[-0.03em]">{euros(bill.total)}</span>
                </p>
                {credit > 0 && (
                  <p className="mt-3 flex items-baseline justify-between text-[0.9375rem]">
                    <span className="text-mist">
                      Échange du billet <span className="font-mono">{old!.code}</span>
                    </span>
                    <span className="font-mono text-accent">−{euros(credit)}</span>
                  </p>
                )}
                {credit > 0 && (
                  <p className="mt-2 flex items-baseline justify-between text-[1.0625rem] font-medium">
                    <span>Reste à payer</span>
                    <span>{euros(due)}</span>
                  </p>
                )}
                <button
                  type="button"
                  disabled={travellers === 0}
                  onClick={pay}
                  className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-paper px-6 text-[1.0625rem] font-semibold text-navy hover:bg-paper/85 disabled:opacity-40"
                >
                  {credit > 0 ? (due > 0 ? `Payer ${euros(due)}` : 'Confirmer l’échange') : method === 'gare' ? 'Réserver' : `Payer ${euros(bill.total)}`} (démo)
                  <Arrow width={18} height={18} />
                </button>
                <p className="mt-3 text-center text-[0.8125rem] text-mist">Tarifs indicatifs de démonstration.</p>
              </Ticket>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

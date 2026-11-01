import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { AppHeader } from './AppShell'
import { CheckRow, Stepper } from '../components/planner/FormControls'
import LineBadge from '../components/planner/LineBadge'
import { fmtDuration, fmtTime, type Itinerary } from '../planner/engine'
import { euros, price, type Options, type Passengers } from '../planner/pricing'
import { capFirst, longDate, ticketCode, todayIso, useTickets } from '../planner/tickets'
import { travelNeeds } from '../profile/derive'
import { useProfile } from '../profile/ProfileContext'

type State = { it: Itinerary; from: string; to: string; fromName: string; toName: string; isoDate?: string; replaces?: string }

export default function AppCheckout() {
  const state = useLocation().state as State | null
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { tickets, add, update } = useTickets()
  const needs = profile ? travelNeeds(profile) : null
  const it = state?.it
  const rail = !!it?.legs.some((l) => l.kind === 'ride' && (l.line.mode === 'ter' || l.line.mode === 'grandes-lignes'))
  const longDistance = !!it?.legs.some((l) => l.kind === 'ride' && l.line.mode === 'grandes-lignes')

  const [pax, setPax] = useState<Passengers>(() => ({ adults: 1, youths: 0, children: 0, companion: !!profile?.companions.includes('accompagnant'), cmi: false }))
  const [opts, setOpts] = useState<Options>(() => ({
    assistance: rail && !!(needs?.stationAssistance || needs?.wheelchair),
    pmrSeat: longDistance && !!needs?.wheelchair,
    bike: !!needs?.bike,
    dog: !!needs?.assistanceDog,
  }))
  const bill = useMemo(() => (it ? price(it, pax, opts) : null), [it, pax, opts])
  if (!state || !it || !bill) return <Navigate to="/app/trajets" replace />

  const isoDate = state.isoDate ?? todayIso()
  const old = state.replaces ? tickets.find((t) => t.code === state.replaces) : undefined
  const credit = old && old.status !== 'annule' ? old.total : 0
  const due = Math.max(0, Math.round((bill.total - credit) * 100) / 100)
  const travellers = pax.adults + pax.youths + pax.children + (pax.companion ? 1 : 0)

  const pay = () => {
    const code = ticketCode()
    add({
      code,
      issuedAt: new Date().toISOString(),
      date: longDate(isoDate),
      isoDate,
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
    navigate(`/app/billets/${code}`, { replace: true, state: { justBought: true } })
  }

  return (
    <>
      <AppHeader title="Billet tout compris" back="/app/trajets" />
      <main id="contenu" className="px-5 pb-8">
        <p className="text-[1.1875rem] leading-[1.3] font-medium">
          {state.fromName} → {state.toName}
        </p>
        <p className="mt-1 text-[0.9375rem] text-mist">
          {capFirst(longDate(isoDate))} · {fmtTime(it.depart)} → {fmtTime(it.arrive)} · {fmtDuration(it.duration)}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Transports couverts">
          {it.legs.map((l, i) => (l.kind === 'ride' ? <li key={i}><LineBadge mode={l.line.mode} name={l.line.name} /></li> : null))}
        </ul>

        <section aria-labelledby="voy" className="mt-6 rounded-card bg-paper/[0.04] px-5 py-2 ring-1 ring-line">
          <h2 id="voy" className="pt-3 text-[1.125rem] font-medium">
            Voyageurs
          </h2>
          <div className="divide-y divide-line">
            <Stepper label="Adultes" value={pax.adults} onChange={(v) => setPax({ ...pax, adults: v })} />
            <Stepper label="Jeunes" help="12-25 ans : −30 % train" value={pax.youths} onChange={(v) => setPax({ ...pax, youths: v })} />
            <Stepper label="Enfants" help="4-11 ans : −50 %" value={pax.children} onChange={(v) => setPax({ ...pax, children: v })} />
            <CheckRow label="Carte mobilité inclusion" help="Tarif solidaire, accompagnant·e gratuit·e" checked={pax.cmi} onChange={(v) => setPax({ ...pax, cmi: v })} />
            <CheckRow label="Avec un·e accompagnant·e" checked={pax.companion} onChange={(v) => setPax({ ...pax, companion: v })} />
          </div>
        </section>

        <section aria-labelledby="serv" className="mt-4 rounded-card bg-paper/[0.04] px-5 py-2 ring-1 ring-line">
          <h2 id="serv" className="pt-3 text-[1.125rem] font-medium">
            Services inclus
          </h2>
          <div className="divide-y divide-line">
            {rail && <CheckRow label="Assistance en gare (Accès Plus)" help="Gratuit, réservation transmise" checked={opts.assistance} onChange={(v) => setOpts({ ...opts, assistance: v })} />}
            {longDistance && <CheckRow label="Place PMR réservée" checked={opts.pmrSeat} onChange={(v) => setOpts({ ...opts, pmrSeat: v })} />}
            <CheckRow label="Chien d’assistance" help="Gratuit" checked={opts.dog} onChange={(v) => setOpts({ ...opts, dog: v })} />
            <CheckRow label="Vélo" checked={opts.bike} onChange={(v) => setOpts({ ...opts, bike: v })} />
          </div>
        </section>

        <section aria-labelledby="prix" className="mt-4 rounded-card bg-[rgb(237_195_196/0.06)] p-5 ring-1 ring-paper/20">
          <h2 id="prix" className="sr-only">
            Prix
          </h2>
          <dl className="flex flex-col gap-2.5 text-[0.9375rem]">
            {[...bill.lines, ...bill.discounts, ...bill.services].map((l, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <dt className="min-w-0">
                  <span className="block font-medium">{l.network}</span>
                  <span className="block text-[0.875rem] text-mist">{l.detail}</span>
                </dt>
                <dd className={`shrink-0 font-mono ${l.amount < 0 ? 'text-accent' : ''}`}>{l.amount === 0 ? 'Inclus' : euros(l.amount)}</dd>
              </div>
            ))}
            {credit > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-mist">Échange de {old!.code}</dt>
                <dd className="font-mono text-accent">−{euros(credit)}</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span>{credit > 0 ? 'Reste à payer' : `Total · ${travellers} voyageur${travellers > 1 ? 's' : ''}`}</span>
            <span className="text-[1.75rem] font-medium tracking-[-0.03em]">{euros(credit > 0 ? due : bill.total)}</span>
          </p>
        </section>

        <p className="mt-4 text-center text-[0.8125rem] text-mist">Démonstration : aucun paiement réel, aucune donnée bancaire.</p>
        <button type="button" disabled={travellers === 0} onClick={pay} className="mt-3 min-h-16 w-full rounded-full bg-paper text-[1.125rem] font-semibold text-navy disabled:opacity-40">
          {credit > 0 ? (due > 0 ? `Payer ${euros(due)}` : 'Confirmer l’échange') : `Payer ${euros(bill.total)}`} (démo)
        </button>
      </main>
    </>
  )
}

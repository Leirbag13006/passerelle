import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { AppHeader } from './AppShell'
import { Check, Spark } from '../components/icons'
import LineBadge from '../components/planner/LineBadge'
import { speak } from '../lib/a11y'
import { fmtTime } from '../planner/engine'
import { euros } from '../planner/pricing'
import { capFirst, todayIso, useTickets, type IssuedTicket } from '../planner/tickets'
import { useProfile } from '../profile/ProfileContext'

const statusLabel = { valide: 'Valable', annule: 'Annulé', echange: 'Échangé' } as const

export function AppTicketList() {
  const { tickets } = useTickets()
  const today = todayIso()
  const valid = tickets.filter((t) => (t.status ?? 'valide') === 'valide')
  const others = tickets.filter((t) => (t.status ?? 'valide') !== 'valide')

  const row = (t: IssuedTicket) => {
    const status = t.status ?? 'valide'
    return (
      <li key={t.code}>
        <Link to={`/app/billets/${t.code}`} className={`block rounded-card p-5 ring-1 ${status === 'valide' ? 'bg-[rgb(237_195_196/0.06)] ring-paper/25' : 'ring-line'}`}>
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block font-mono text-[0.6875rem] tracking-[0.14em] text-paper/60 uppercase">
                {t.isoDate === today ? 'Aujourd’hui' : capFirst(t.date)} · {fmtTime(t.it.depart)}
              </span>
              <span className="mt-1.5 block text-[1.125rem] leading-[1.3] font-medium">
                {t.fromName} → {t.toName}
              </span>
            </span>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.75rem] font-medium ${status === 'valide' ? 'bg-accent text-navy' : 'text-mist ring-1 ring-paper/30'}`}>{statusLabel[status]}</span>
          </span>
          <span className="mt-3 flex flex-wrap gap-1.5">
            {t.it.legs.map((l, i) => (l.kind === 'ride' ? <LineBadge key={i} mode={l.line.mode} name={l.line.name} /> : null))}
          </span>
        </Link>
      </li>
    )
  }

  return (
    <>
      <AppHeader title="Mes billets" />
      <main id="contenu" className="px-5 pb-8">
        {tickets.length === 0 ? (
          <div className="mt-4 rounded-card bg-paper/[0.04] p-6 text-center ring-1 ring-line">
            <p className="text-[1.0625rem]">Aucun billet pour l’instant.</p>
            <Link to="/app/trajets" className="mt-4 inline-flex min-h-12 items-center rounded-full bg-paper px-6 text-[1rem] font-medium text-navy">
              Chercher un trajet
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3">{valid.map(row)}</ul>
            {valid.length === 0 && <p className="text-[1rem] text-mist">Aucun billet à venir.</p>}
            {others.length > 0 && (
              <>
                <h2 className="mt-8 text-[1.0625rem] font-medium text-mist">Annulés ou échangés</h2>
                <ul className="mt-3 flex flex-col gap-3">{others.map(row)}</ul>
              </>
            )}
          </>
        )}
      </main>
    </>
  )
}

export function AppTicket() {
  const { code } = useParams()
  const justBought = (useLocation().state as { justBought?: boolean } | null)?.justBought
  const navigate = useNavigate()
  const { prefs } = useProfile()
  const { tickets, update } = useTickets()
  const t = tickets.find((x) => x.code === code)
  const [qr, setQr] = useState('')
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (t) QRCode.toString(`PASSERELLE|${t.code}|${t.isoDate ?? ''}`, { type: 'svg', margin: 1, color: { dark: '#0b1238', light: '#ffffff' } }).then(setQr)
  }, [t])
  if (!t) return <Navigate to="/app/billets" replace />

  const status = t.status ?? 'valide'
  const valid = status === 'valide'
  const qs = `de=${encodeURIComponent(t.from)}&a=${encodeURIComponent(t.to)}${t.isoDate ? `&j=${t.isoDate}` : ''}`

  return (
    <>
      <AppHeader title="Mon billet" back="/app/billets" />
      <main id="contenu" className="px-5 pb-8">
        {justBought && valid && (
          <p role="status" className="mb-4 flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[0.9375rem] font-medium text-navy">
            <Check width={16} height={16} strokeWidth={2.6} /> Paiement accepté (démo)
          </p>
        )}
        {!valid && (
          <p role="status" className="mb-4 rounded-2xl bg-[#ffb4c4]/10 px-4 py-3 text-[0.9375rem] text-[#ffe0e7] ring-1 ring-[#ffb4c4]/50">
            {status === 'annule' ? `Billet annulé, remboursé ${euros(t.total)} (démo).` : 'Billet échangé, il n’est plus valable.'}
            {t.replacedBy && (
              <>
                {' '}
                <Link to={`/app/billets/${t.replacedBy}`} className="font-medium underline underline-offset-4">
                  Voir le nouveau billet
                </Link>
              </>
            )}
          </p>
        )}

        {/* le QR code occupe la largeur de l'écran, pour les bornes et le contrôle */}
        <div className={`rounded-card bg-white p-4 ${valid ? '' : 'opacity-25 grayscale'}`}>
          <div role="img" aria-label={`QR code du billet ${t.code}`} className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
        </div>
        <p className="mt-4 text-center font-mono text-[1.375rem] tracking-[0.12em]">{t.code}</p>
        {prefs.readAloud && (
          <button type="button" onClick={() => speak(`Code du billet : ${t.code.split('').join(' ')}`)} className="mx-auto mt-2 block min-h-11 rounded-full px-4 text-[0.9375rem] ring-1 ring-paper/30">
            Épeler le code
          </button>
        )}

        <div className="mt-6 rounded-card bg-paper/[0.04] p-5 ring-1 ring-line">
          <p className="text-[1.125rem] leading-[1.3] font-medium">
            {t.fromName} → {t.toName}
          </p>
          <p className="mt-1 text-[0.9375rem] text-mist">
            {capFirst(t.date)} · valable {fmtTime(t.it.depart)} → {fmtTime(t.it.arrive + 60)} · {euros(t.total)}
          </p>
          <ol className="mt-4 flex flex-col gap-2">
            {t.it.legs.map((l, i) =>
              l.kind === 'ride' ? (
                <li key={i} className="flex flex-wrap items-center gap-2 text-[0.9375rem]">
                  <span className="w-[4.25rem] font-mono text-[0.8125rem] text-paper/70">{fmtTime(l.depart)}</span>
                  <LineBadge mode={l.line.mode} name={l.line.name} />
                  <span className="min-w-0">
                    {l.from.name} → {l.to.name}
                  </span>
                </li>
              ) : null,
            )}
          </ol>
          {(t.options.assistance || t.options.dog || t.options.pmrSeat) && (
            <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-[0.9375rem]">
              {t.options.assistance && (
                <li className="flex gap-2">
                  <Spark width={13} height={13} className="mt-1.5 shrink-0 text-accent" /> Assistance Accès Plus réservée
                </li>
              )}
              {t.options.pmrSeat && (
                <li className="flex gap-2">
                  <Spark width={13} height={13} className="mt-1.5 shrink-0 text-accent" /> Place PMR réservée
                </li>
              )}
              {t.options.dog && (
                <li className="flex gap-2">
                  <Spark width={13} height={13} className="mt-1.5 shrink-0 text-accent" /> Chien d’assistance inclus
                </li>
              )}
            </ul>
          )}
        </div>

        {valid && (
          <>
            <Link to={`/app/en-route/${t.code}`} className="mt-6 flex min-h-16 items-center justify-center rounded-full bg-accent text-[1.125rem] font-semibold text-navy">
              Démarrer le trajet
            </Link>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => navigate(`/app/trajets?${qs}`, { state: { replaces: t.code } })} className="min-h-12 rounded-full text-[1rem] ring-1 ring-paper/35">
                Modifier
              </button>
              <button type="button" onClick={() => setConfirm(true)} className="min-h-12 rounded-full text-[1rem] text-[#ffb4c4] ring-1 ring-[#ffb4c4]/50">
                Annuler
              </button>
            </div>
            {confirm && (
              <div role="alertdialog" aria-labelledby="ann-q" className="mt-4 rounded-2xl p-5 ring-1 ring-[#ffb4c4]/60">
                <p id="ann-q" className="text-[1rem] font-medium">
                  Annuler ce billet ? Remboursement de {euros(t.total)} (démo).
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" autoFocus onClick={() => setConfirm(false)} className="min-h-12 rounded-full bg-paper text-[1rem] font-medium text-navy">
                    Garder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      update(t.code, { status: 'annule' })
                      setConfirm(false)
                    }}
                    className="min-h-12 rounded-full text-[1rem] text-[#ffb4c4] ring-1 ring-[#ffb4c4]/60"
                  >
                    Oui, annuler
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}

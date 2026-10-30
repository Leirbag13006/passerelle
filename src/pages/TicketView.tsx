import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import Footer from '../components/Footer'
import Nav from '../components/Nav'
import LineBadge from '../components/planner/LineBadge'
import SectionsSky from '../components/SectionsSky'
import { Check, Spark, Walk } from '../components/icons'
import Stamp from '../components/ticket/Stamp'
import { Ticket, TicketLabel, TicketRoute } from '../components/ticket/Ticket'
import { speak } from '../lib/a11y'
import { fmtTime } from '../planner/engine'
import { euros } from '../planner/pricing'
import { useTickets } from '../planner/tickets'
import { useProfile } from '../profile/ProfileContext'

export default function TicketView() {
  const { code } = useParams()
  const justBought = (useLocation().state as { justBought?: boolean } | null)?.justBought
  const { tickets, update } = useTickets()
  const navigate = useNavigate()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const { profile, prefs } = useProfile()
  const t = tickets.find((x) => x.code === code)
  const [qr, setQr] = useState('')
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!t) return
    // le QR code porte le code du billet et les lignes couvertes (format de démonstration)
    const payload = `PASSERELLE|${t.code}|${t.date}|${t.it.legs
      .filter((l) => l.kind === 'ride')
      .map((l) => (l.kind === 'ride' ? l.line.id : ''))
      .join(',')}`
    QRCode.toString(payload, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0b1238', light: '#ffffff' } }).then(setQr)
  }, [t])

  useEffect(() => {
    window.scrollTo({ top: 0 })
    titleRef.current?.focus()
  }, [])

  if (!t) return <Navigate to="/espace" replace />

  const rides = t.it.legs.filter((l) => l.kind === 'ride')
  const travellers = t.passengers.adults + t.passengers.youths + t.passengers.children + (t.passengers.companion ? 1 : 0)
  const spelled = t.code.split('').join(' ')
  const status = t.status ?? 'valide'
  const valid = status === 'valide'
  const replacement = t.replacedBy ? tickets.find((x) => x.code === t.replacedBy) : undefined
  const qs = `de=${encodeURIComponent(t.from)}&a=${encodeURIComponent(t.to)}${t.isoDate ? `&j=${t.isoDate}` : ''}`

  return (
    <>
      <Nav />
      <main id="contenu" className="relative isolate min-h-svh overflow-x-clip bg-navy pt-28 text-paper">
        <SectionsSky />
        <div className="mx-auto max-w-[860px] px-4 pb-28 md:px-10">
          {!valid && (
            <p role="status" className="mb-6 rounded-2xl bg-[#ffb4c4]/10 px-5 py-4 text-[1rem] text-[#ffe0e7] ring-1 ring-[#ffb4c4]/50">
              {status === 'annule' ? (
                <>Billet annulé : remboursement de {euros(t.total)} (démo). Il n’est plus valable.</>
              ) : (
                <>
                  Billet échangé, il n’est plus valable.{' '}
                  {replacement && (
                    <Link to={`/billet/${replacement.code}`} className="font-medium underline underline-offset-4">
                      Voir le nouveau billet {replacement.code}
                    </Link>
                  )}
                </>
              )}
            </p>
          )}
          {justBought && valid && (
            <p role="status" className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[0.9375rem] font-medium text-navy">
              <Check width={16} height={16} strokeWidth={2.6} /> Paiement accepté (démo) : votre billet est prêt
            </p>
          )}
          <h1 ref={titleRef} tabIndex={-1} className="text-[clamp(2.25rem,4.6vw,3.5rem)] leading-[1.02] font-medium tracking-[-0.04em]">
            Votre billet <span className="font-serif font-normal tracking-[-0.02em] text-accent italic">tout compris</span>
          </h1>
          <p className="mt-3 text-[1.125rem] text-mist">Un seul billet, valable sur tous les transports de votre trajet. Présentez le QR code aux bornes et au contrôle.</p>

          <Ticket as="article" aria-label={`Billet ${t.code}`} className={`mt-10 ${justBought ? 'thud' : ''}`}
            stampOn="perforation"
            stamp={<Stamp text={valid ? 'PAYÉ' : status === 'annule' ? 'ANNULÉ' : 'ÉCHANGÉ'} word={valid ? 'VALIDE' : 'NON VALABLE'} size={110} />}
          >
            <TicketLabel>Billet Passerelle · {t.date}</TicketLabel>
            <TicketRoute from={t.fromName} to={t.toName} />

            <div className="mt-8 grid items-center gap-8 sm:grid-cols-[220px_minmax(0,1fr)]">
              <div className={`rounded-2xl bg-white p-3 ${valid ? '' : 'opacity-25 grayscale'}`}>
                {qr ? (
                  <div role="img" aria-label={`QR code du billet ${t.code}`} className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
                ) : (
                  <div className="aspect-square" />
                )}
              </div>
              <div>
                <p className="font-mono text-[0.75rem] tracking-[0.14em] text-paper/60 uppercase">Code du billet</p>
                <p className="mt-1 font-mono text-[1.75rem] tracking-[0.12em]">{t.code}</p>
                <button
                  type="button"
                  hidden={!prefs.readAloud}
                  onClick={() => speak(`Code du billet : ${spelled}`)}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.9375rem] ring-1 ring-paper/30 hover:ring-paper/70"
                >
                  Épeler le code
                </button>
                <dl className="mt-6 grid grid-cols-2 gap-4 text-[0.9375rem]">
                  <div>
                    <dt className="text-mist">Validité</dt>
                    <dd className="mt-0.5 font-medium">
                      {fmtTime(t.it.depart)} → {fmtTime(t.it.arrive + 60)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-mist">Voyageurs</dt>
                    <dd className="mt-0.5 font-medium">{travellers}</dd>
                  </div>
                  <div>
                    <dt className="text-mist">Prix payé</dt>
                    <dd className="mt-0.5 font-medium">{euros(t.total)}</dd>
                  </div>
                  <div>
                    <dt className="text-mist">Transports</dt>
                    <dd className="mt-0.5 font-medium">{rides.length}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <h2 className="mt-10 text-[1.25rem] font-medium">Valable sur</h2>
            <ol className="mt-4 flex flex-col gap-3">
              {t.it.legs.map((l, i) => (
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

            {(t.options.assistance || t.options.pmrSeat || t.options.bike || t.options.dog || t.passengers.companion) && (
              <>
                <h2 className="mt-10 text-[1.25rem] font-medium">Réservations incluses</h2>
                <ul className="mt-4 flex flex-col gap-2.5 text-[1rem]">
                  {t.options.assistance && (
                    <li className="flex items-start gap-3">
                      <Spark width={14} height={14} className="mt-1.5 shrink-0 text-accent" />
                      Assistance Accès Plus réservée : présentez-vous au point d’accueil 30 min avant le départ du train.
                    </li>
                  )}
                  {t.options.pmrSeat && (
                    <li className="flex items-start gap-3">
                      <Spark width={14} height={14} className="mt-1.5 shrink-0 text-accent" />
                      Place PMR réservée, à côté de l’accès.
                    </li>
                  )}
                  {t.options.dog && (
                    <li className="flex items-start gap-3">
                      <Spark width={14} height={14} className="mt-1.5 shrink-0 text-accent" />
                      Chien d’assistance inclus, gratuitement.
                    </li>
                  )}
                  {t.options.bike && (
                    <li className="flex items-start gap-3">
                      <Spark width={14} height={14} className="mt-1.5 shrink-0 text-accent" />
                      Vélo à bord.
                    </li>
                  )}
                  {t.passengers.companion && (
                    <li className="flex items-start gap-3">
                      <Spark width={14} height={14} className="mt-1.5 shrink-0 text-accent" />
                      Accompagnant·e inclus·e sur tout le trajet.
                    </li>
                  )}
                </ul>
              </>
            )}

            <p className="mt-8 text-[0.875rem] text-mist">Astuce : augmentez la luminosité de l’écran devant les bornes. Billet de démonstration, sans valeur.</p>
          </Ticket>

          {valid && (
            <Link
              to={`/en-route/${t.code}`}
              className="mt-8 flex min-h-16 items-center justify-center gap-3 rounded-full bg-accent px-8 text-[1.1875rem] font-semibold text-navy hover:bg-accent/85"
            >
              Démarrer le trajet, mode « En route »
            </Link>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/billets" className="inline-flex min-h-12 items-center rounded-full bg-paper px-6 text-[1rem] font-medium text-navy hover:bg-paper/85">
              Mes billets
            </Link>
            {valid && (
              <button
                type="button"
                onClick={() => navigate(`/trajets?${qs}`, { state: { replaces: t.code } })}
                className="inline-flex min-h-12 items-center rounded-full px-6 text-[1rem] ring-1 ring-paper/30 hover:ring-paper/70"
              >
                Modifier (date, heure, trajet)
              </button>
            )}
            {valid && !confirmCancel && (
              <button type="button" onClick={() => setConfirmCancel(true)} className="inline-flex min-h-12 items-center rounded-full px-6 text-[1rem] text-[#ffb4c4] ring-1 ring-[#ffb4c4]/45 hover:ring-[#ffb4c4]">
                Annuler le billet
              </button>
            )}
          </div>

          {confirmCancel && valid && (
            <div role="alertdialog" aria-labelledby="cancel-q" className="mt-5 rounded-2xl p-5 ring-1 ring-[#ffb4c4]/60">
              <p id="cancel-q" className="text-[1.0625rem] font-medium">
                Annuler ce billet ? Vous serez remboursé·e de {euros(t.total)} (démo).
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" autoFocus onClick={() => setConfirmCancel(false)} className="min-h-12 rounded-full bg-paper px-6 text-[1rem] font-medium text-navy">
                  Garder mon billet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    update(t.code, { status: 'annule' })
                    setConfirmCancel(false)
                    window.scrollTo({ top: 0 })
                  }}
                  className="min-h-12 rounded-full px-6 text-[1rem] text-[#ffb4c4] ring-1 ring-[#ffb4c4]/60"
                >
                  Oui, annuler
                </button>
              </div>
            </div>
          )}

          {!profile && (
            <p className="mt-6 text-[0.9375rem] text-mist">
              Vos billets restent accessibles depuis « Mes billets », même sans profil.{' '}
              <Link to="/profil/creer" className="text-accent underline underline-offset-4">
                Créer un profil
              </Link>{' '}
              pour des trajets adaptés.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

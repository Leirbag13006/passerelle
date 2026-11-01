import QRCode from 'qrcode'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { adaptationFor, adaptationLabels, buildSteps, primaryLabel, stepSpeech, type Detail, type Step } from '../enroute/steps'
import { Arrow, Check, Clock, Spark, Walk, Wheelchair } from '../components/icons'
import LineBadge, { modeIcon } from '../components/planner/LineBadge'
import { speak, stopSpeaking } from '../lib/a11y'
import { fmtTime, plan, type Itinerary } from '../planner/engine'
import { decodePlace } from '../planner/places'
import { todayIso, useTickets } from '../planner/tickets'
import { travelNeeds } from '../profile/derive'
import { useProfile } from '../profile/ProfileContext'

// Mode « En route » : le trajet découpé en actions, une à la fois, en très grand.
// L'accompagnement dépend du profil : niveau de détail, guidage vocal ou visuel,
// accès sans marche, messages rassurants, aide immédiate, nouvel itinéraire en cas d'imprévu.

// basePath : préfixe des liens (« /app » dans l'application, vide sur le site)
export default function EnRoute({ basePath = '' }: { basePath?: string } = {}) {
  const { code } = useParams()
  const { tickets } = useTickets()
  const { profile, prefs } = useProfile()
  const t = tickets.find((x) => x.code === code)
  // calculs stables : sinon les étapes changeraient à chaque rendu (et la consigne serait relue)
  const needs = useMemo(() => (profile ? travelNeeds(profile) : null), [profile])
  const storeKey = `passerelle:en-route:${code}`

  const base = useMemo(() => adaptationFor(profile, needs, prefs), [profile, needs, prefs])
  const [detail, setDetail] = useState<Detail>(base.detail)
  const adapt = useMemo(() => ({ ...base, detail }), [base, detail])

  // itinéraire suivi (celui du billet, ou un itinéraire de secours après un imprévu)
  const [current, setCurrent] = useState<{ it: Itinerary; origin: Step['at'] } | null>(() => (t ? { it: t.it, origin: decodePlace(t.from) } : null))
  const steps = useMemo(() => (current && t ? buildSteps(current.it, t.toName, current.origin, adapt) : []), [current, t, adapt])
  const [index, setIndex] = useState(() => {
    try {
      return Number(sessionStorage.getItem(storeKey) ?? 0)
    } catch {
      return 0
    }
  })
  const [alert, setAlert] = useState<{ text: string; alt: Itinerary | null; at: number } | null>(null)
  const [rerouted, setRerouted] = useState(false)
  const [qr, setQr] = useState('')
  const helpRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  // à l'ouverture, le focus va sur « Fermer » (et non sur le premier lien)
  const openHelp = () => {
    helpRef.current?.showModal()
    closeRef.current?.focus()
  }

  const step = steps[Math.min(index, steps.length - 1)]
  const next = steps[index + 1]

  // l'écran reste allumé pendant le trajet (si le navigateur le permet)
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    nav.wakeLock
      ?.request('screen')
      .then((l) => (lock = l))
      .catch(() => {})
    return () => {
      lock?.release().catch(() => {})
      stopSpeaking()
    }
  }, [])

  // nouvelle étape : focus sur la consigne, puis voix (vue) ou vibration (audition)
  useEffect(() => {
    if (!step) return
    try {
      sessionStorage.setItem(storeKey, String(index))
    } catch {
      // pas de stockage de session : on reprendra au début
    }
    titleRef.current?.focus()
    if (adapt.audio) speak(stepSpeech(step))
    if (adapt.visual) navigator.vibrate?.([120, 60, 120])
    // dépend volontairement de l'étape affichée seulement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, steps])

  useEffect(() => {
    if (t) QRCode.toString(`PASSERELLE|${t.code}`, { type: 'svg', margin: 1, color: { dark: '#0b1238', light: '#ffffff' } }).then(setQr)
  }, [t])

  const ticketPath = (c: string) => (basePath ? `${basePath}/billets/${c}` : `/billet/${c}`)
  if (!t || !current) return <Navigate to={`${basePath}/billets`} replace />
  if ((t.status ?? 'valide') !== 'valide') return <Navigate to={ticketPath(t.code)} replace />

  // changer de niveau de détail sans perdre sa place : on se recale sur l'heure de l'étape en cours
  const switchDetail = () => {
    const nextDetail: Detail = detail === 'pas-a-pas' ? 'essentiel' : 'pas-a-pas'
    const nextSteps = buildSteps(current.it, t.toName, current.origin, { ...adapt, detail: nextDetail })
    const i = nextSteps.findIndex((s) => s.time >= step.time)
    setDetail(nextDetail)
    setIndex(Math.max(0, i))
  }

  // Imprévu simulé : retard sur la prochaine ligne, ou ascenseur en panne si le profil a besoin d'un accès sans marche
  const simulate = () => {
    const upcoming = steps.slice(index).find((s) => s.ride)
    if (!upcoming?.ride) {
      setAlert({ text: 'Aucun transport à venir sur ce trajet : rien à recalculer.', alt: null, at: index })
      return
    }
    const r = upcoming.ride
    const elevator = adapt.stepFree && r.from.elevator === 'ok'
    const raw = elevator ? `L’ascenseur de ${r.from.name} vient de tomber en panne.` : `Retard important (25 min) sur ${r.line.long}.`
    const text = adapt.calm ? `Pas d’inquiétude : ${raw.charAt(0).toLowerCase()}${raw.slice(1)} Nous avons déjà une solution.` : raw
    const here = step.at ?? current.origin
    const alt = here ? (plan({ id: 'adr', city: '', ...here }, decodePlace(t.to), step.time, profile, elevator ? { stops: [r.from.id] } : { lines: [r.line.id] })[0] ?? null) : null
    setAlert({ text, alt, at: index })
    if (adapt.visual) navigator.vibrate?.([300, 100, 300, 100, 300])
    if (adapt.audio) speak(`${text} ${alt ? `Nouvel itinéraire proposé, arrivée à ${fmtTime(alt.arrive)}.` : ''}`)
  }

  const adopt = () => {
    if (!alert?.alt) return
    setCurrent({ it: alert.alt, origin: step.at ?? current.origin })
    setIndex(0)
    setAlert(null)
    setRerouted(true)
  }

  const Icon = step.kind === 'walk' ? Walk : step.kind === 'arrive' ? Check : step.kind === 'meet' ? Wheelchair : step.line ? modeIcon[step.line.mode] : Walk
  const finished = step.kind === 'arrive'
  // compte à rebours seulement si le voyage est aujourd'hui
  const now = new Date()
  const minsLeft = t.isoDate === todayIso() ? step.time - (now.getHours() * 60 + now.getMinutes()) : null
  const notesBlock =
    step.notes.length > 0 ? (
      <ul className="flex flex-col gap-3">
        {step.notes.map((n) => (
          <li key={n} className="flex items-start gap-3 text-[1.125rem] leading-[1.5]">
            <Spark width={15} height={15} className="mt-1.5 shrink-0 text-accent" />
            {n}
          </li>
        ))}
      </ul>
    ) : null

  return (
    <div className={`flex flex-col bg-navy text-paper ${basePath ? 'min-h-full' : 'min-h-svh'}`}>
      {/* barre du haut : sortir, progression, aide */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link to={ticketPath(t.code)} className="min-h-12 content-center text-[1rem] text-mist underline-offset-4 hover:text-paper hover:underline">
            Quitter
          </Link>
          <p className="font-mono text-[0.875rem] tracking-[0.12em] whitespace-nowrap text-paper/80 uppercase" aria-live="polite">
            {/* format court sur téléphone, phrase complète pour les lecteurs d'écran */}
            <span aria-hidden="true" className="sm:hidden">
              {Math.min(index, steps.length - 1) + 1} / {steps.length}
            </span>
            <span className="sr-only sm:not-sr-only">
              Étape {Math.min(index, steps.length - 1) + 1} sur {steps.length}
            </span>
          </p>
          <button type="button" onClick={openHelp} className="min-h-12 rounded-full bg-[#ffb4c4] px-4 text-[1rem] font-semibold whitespace-nowrap text-navy sm:px-5">
            J’ai besoin d’aide
          </button>
        </div>
        <div aria-hidden="true" className="mx-auto flex max-w-[860px] gap-1 px-4 pb-3 md:px-8">
          {steps.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= index ? 'bg-accent' : 'bg-paper/15'}`} />
          ))}
        </div>
      </header>

      <main id="contenu" className="mx-auto flex w-full max-w-[860px] flex-1 flex-col px-4 py-6 md:px-8">
        {/* accompagnement actif, et contrôle du niveau de détail */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Accompagnement adapté à votre profil :</span>
          {adaptationLabels(adapt).map((l) => (
            <span key={l} className="rounded-full px-3 py-1 text-[0.8125rem] ring-1 ring-paper/25">
              {l}
            </span>
          ))}
          <button type="button" aria-pressed={detail === 'pas-a-pas'} onClick={switchDetail} className="ml-auto min-h-10 rounded-full px-4 text-[0.875rem] text-accent ring-1 ring-accent/50">
            {detail === 'pas-a-pas' ? 'Moins de détails' : 'Plus de détails'}
          </button>
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-2 text-[1.0625rem] text-mist">
          <Clock width={18} height={18} />
          {minsLeft !== null && minsLeft > 0 && (step.kind === 'board' || step.kind === 'ride') ? (
            <span className="font-medium text-paper">Départ dans {minsLeft} min</span>
          ) : (
            <span>{fmtTime(step.time)}</span>
          )}
          <span>· vers {t.toName}</span>
          {rerouted && <span className="ml-2 rounded-full px-3 py-0.5 text-[0.875rem] ring-1 ring-accent/60">Itinéraire mis à jour</span>}
        </p>

        <div className="mt-5 flex items-start gap-5">
          <span aria-hidden="true" className={`grid size-16 shrink-0 place-items-center rounded-full ${finished ? 'bg-accent text-navy' : 'bg-paper text-navy'}`}>
            <Icon width={30} height={30} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            {step.line && step.kind !== 'meet' && <LineBadge mode={step.line.mode} name={step.line.name} />}
            <h1 ref={titleRef} tabIndex={-1} className="mt-2 text-[clamp(2rem,6vw,3.25rem)] leading-[1.08] font-medium tracking-[-0.03em]">
              {step.title}
            </h1>
            <p className="mt-3 text-[1.25rem] leading-[1.5] text-mist">{step.detail}</p>
          </div>
        </div>

        {/* accès : ascenseur, porte, rampe (mis en avant pour les profils concernés) */}
        {step.access && (
          <p className="mt-6 flex items-start gap-3 rounded-2xl bg-accent px-5 py-4 text-[1.125rem] font-medium text-navy">
            <Wheelchair width={22} height={22} className="mt-0.5 shrink-0" />
            {step.access}
          </p>
        )}

        {/* annonce de la gare transcrite (audition) */}
        {step.announce && (
          <figure className="mt-4 rounded-2xl bg-[#05081e] px-5 py-4 ring-1 ring-paper/20">
            <figcaption className="font-mono text-[0.75rem] tracking-[0.14em] text-paper/60 uppercase">Annonce en gare, transcrite</figcaption>
            <p className="mt-1.5 font-mono text-[1.125rem] leading-[1.45]">{step.announce}</p>
          </figure>
        )}

        {step.reassure && <p className="mt-4 rounded-2xl bg-paper/[0.05] px-5 py-4 text-[1.0625rem] leading-[1.5] ring-1 ring-line">{step.reassure}</p>}

        {notesBlock &&
          (adapt.simplified ? (
            <details className="mt-4 rounded-card bg-paper/[0.05] px-6 py-4 ring-1 ring-line">
              <summary className="min-h-10 cursor-pointer content-center text-[1.0625rem] font-medium">Plus de détails</summary>
              <div className="mt-3 pb-2">{notesBlock}</div>
            </details>
          ) : (
            <div className="mt-4 rounded-card bg-paper/[0.05] p-6 ring-1 ring-line">{notesBlock}</div>
          ))}

        {alert && alert.at === index && (
          <div role="alert" className={`mt-6 rounded-card p-6 ${adapt.visual ? 'bg-[#ffb4c4]/15 ring-4 ring-[#ffb4c4]' : 'bg-[#ffb4c4]/10 ring-2 ring-[#ffb4c4]/70'}`}>
            <p className="text-[1.25rem] font-semibold">{adapt.calm ? 'Un changement, rien de grave' : 'Imprévu'}</p>
            <p className="mt-2 text-[1.125rem] leading-[1.5]">{alert.text}</p>
            {alert.alt ? (
              <>
                <p className="mt-3 text-[1.0625rem] text-mist">
                  Nouvel itinéraire : arrivée à {fmtTime(alert.alt.arrive)}
                  {alert.alt.arrive > t.it.arrive ? ` (${alert.alt.arrive - t.it.arrive} min plus tard)` : ''}, via{' '}
                  {alert.alt.legs
                    .filter((l) => l.kind === 'ride')
                    .map((l) => (l.kind === 'ride' ? l.line.name : ''))
                    .join(' puis ') || 'la marche'}
                  . Votre billet reste valable (démo).
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={adopt} className="min-h-14 rounded-full bg-paper px-7 text-[1.0625rem] font-semibold text-navy">
                    Suivre le nouvel itinéraire
                  </button>
                  <button type="button" onClick={() => setAlert(null)} className="min-h-14 rounded-full px-7 text-[1.0625rem] ring-1 ring-paper/40">
                    Garder mon trajet
                  </button>
                </div>
              </>
            ) : (
              <button type="button" onClick={() => setAlert(null)} className="mt-4 min-h-12 rounded-full px-6 text-[1rem] ring-1 ring-paper/40">
                Compris
              </button>
            )}
          </div>
        )}

        {next && (
          <p className="mt-6 text-[1.125rem] text-mist">
            <span className="font-medium text-paper">Ensuite :</span> {next.title}
          </p>
        )}

        <div className="mt-auto pt-10">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => speak(`${stepSpeech(step)} ${step.notes.join('. ')}`)}
              className={`min-h-12 rounded-full px-5 text-[1rem] ${adapt.audio ? 'bg-paper/15 font-medium ring-2 ring-paper/60' : 'ring-1 ring-paper/35'}`}
            >
              {adapt.audio ? 'Répéter la consigne' : 'Écouter'}
            </button>
            {!finished && (
              <button type="button" onClick={simulate} className="min-h-12 rounded-full px-5 text-[1rem] text-mist ring-1 ring-line">
                Simuler un imprévu (démo)
              </button>
            )}
          </div>
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-3">
            <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} className="min-h-16 rounded-full px-6 text-[1.0625rem] ring-1 ring-paper/40 disabled:opacity-30">
              Retour
            </button>
            {finished ? (
              <Link to={ticketPath(t.code)} className="flex min-h-16 items-center justify-center gap-3 rounded-full bg-accent text-[1.1875rem] font-semibold text-navy">
                {primaryLabel.arrive}
              </Link>
            ) : (
              <button type="button" onClick={() => setIndex(index + 1)} className="flex min-h-16 items-center justify-center gap-3 rounded-full bg-paper text-[1.1875rem] font-semibold text-navy">
                {primaryLabel[step.kind]}
                <Arrow width={20} height={20} />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* aide : fenêtre modale native (focus piégé, Échap pour fermer) */}
      <dialog
        ref={helpRef}
        aria-labelledby="aide-titre"
        className="m-auto w-[min(560px,calc(100vw-2rem))] rounded-card bg-navy-3 p-0 text-paper ring-1 ring-paper/30 backdrop:bg-[rgb(5_8_30/0.8)]"
      >
        <div className="p-7">
          <h2 id="aide-titre" className="text-[1.75rem] font-medium">
            On est là
          </h2>
          <p className="mt-2 text-[1.0625rem] text-mist">Montrez cet écran à un agent : il contient votre billet et votre trajet.</p>
          <div className="mt-5 grid grid-cols-[120px_1fr] items-center gap-5">
            <div className="rounded-xl bg-white p-2 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full" role="img" aria-label={`QR code du billet ${t.code}`} dangerouslySetInnerHTML={{ __html: qr }} />
            <div>
              <p className="font-mono text-[0.75rem] tracking-[0.14em] text-paper/60 uppercase">Code du billet</p>
              <p className="mt-1 font-mono text-[1.375rem] tracking-[0.1em]">{t.code}</p>
              <p className="mt-1 text-[0.9375rem] text-mist">
                {t.fromName} → {t.toName}
              </p>
            </div>
          </div>
          <ul className="mt-6 flex flex-col gap-3 text-[1.0625rem]">
            <li>
              <strong className="font-medium">En gare ou en station :</strong> adressez-vous au point d’accueil ou utilisez la borne d’appel sur le quai.
            </li>
            {t.options.assistance && (
              <li>
                <strong className="font-medium">Assistance Accès Plus :</strong> réservée pour vos trains. Signalez-vous au point d’accueil.
              </li>
            )}
            {adapt.visual && (
              <li>
                <strong className="font-medium">Avec un agent :</strong> montrez cet écran, il indique que vous préférez échanger par écrit.
              </li>
            )}
            <li>
              <strong className="font-medium">Urgence :</strong>{' '}
              <a href="tel:112" className="text-accent underline underline-offset-4">
                112
              </a>
              {adapt.visual && (
                <>
                  {' '}
                  · personnes sourdes ou malentendantes :{' '}
                  <a href="sms:114" className="text-accent underline underline-offset-4">
                    114 (SMS)
                  </a>
                </>
              )}
            </li>
          </ul>
          <button ref={closeRef} type="button" onClick={() => helpRef.current?.close()} className="mt-7 min-h-14 w-full rounded-full bg-paper text-[1.0625rem] font-semibold text-navy">
            Fermer
          </button>
        </div>
      </dialog>
    </div>
  )
}

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import Footer from '../components/Footer'
import Nav from '../components/Nav'
import SectionsSky from '../components/SectionsSky'
import { Arrow, Bike, Bus, Clock, Walk } from '../components/icons'
import LineBadge from '../components/planner/LineBadge'
import Timeline, { legSpeech, nowHHMM, toMinutes } from '../components/planner/Timeline'
import PlacePicker from '../components/planner/PlacePicker'
import Stamp from '../components/ticket/Stamp'
import { Ticket, TicketLabel, TicketRoute } from '../components/ticket/Ticket'
import { speak } from '../lib/a11y'
import { disruptions, placeById } from '../planner/data'
import { decodePlace, encodePlace } from '../planner/places'
import { fmtDuration, fmtTime, plan, type Itinerary } from '../planner/engine'
import { useSavedTrips } from '../planner/savedTrips'
import { longDate, todayIso } from '../planner/tickets'
import { labels, travelNeeds } from '../profile/derive'
import { useProfile } from '../profile/ProfileContext'

function ItineraryTicket({ it, from, to, open, onToggle, readAloud, isoDate, replaces }: { it: Itinerary; from: string; to: string; open: boolean; onToggle: () => void; readAloud: boolean; isoDate: string; replaces?: string }) {
  const { trips, save } = useSavedTrips()
  const navigate = useNavigate()
  const fromName = decodePlace(from)!.name
  const toName = decodePlace(to)!.name
  const tripId = `${from}>${to}:${it.id}`
  const saved = trips.some((t) => t.id === tripId)
  const [justSaved, setJustSaved] = useState(false)
  const rides = it.legs.filter((l) => l.kind === 'ride')
  const detailsId = `details-${it.id.replace(/[^a-z0-9]/gi, '')}`

  const summary = `${fmtTime(it.depart)} → ${fmtTime(it.arrive)} · ${fmtDuration(it.duration)} · ${it.transfers === 0 ? 'direct' : `${it.transfers} correspondance${it.transfers > 1 ? 's' : ''}`}`
  const readTrip = () => speak(`Trajet de ${fromName} à ${toName}. ${summary}. ${it.legs.map(legSpeech).join(' ')} Arrivée à ${fmtTime(it.arrive)}.`)

  return (
    <Ticket
      as="li"
      className={justSaved ? 'thud' : ''}
      stampOn="perforation"
      stamp={saved ? <Stamp text="COMPOSTÉ" word="ENREGISTRÉ" size={96} /> : null}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TicketLabel>{it.labels.join(' · ')}</TicketLabel>
        <div className="flex flex-wrap gap-2 text-[0.8125rem]">
          {it.stepFree && <span className="rounded-full bg-accent px-3 py-1 font-medium text-navy">Sans marche</span>}
          {it.assistance && <span className="rounded-full px-3 py-1 ring-1 ring-accent/60">Assistance à réserver</span>}
        </div>
      </div>

      <TicketRoute from={fromName} to={toName} />

      <p className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-[clamp(1.75rem,3vw,2.25rem)] leading-none font-medium tracking-[-0.03em]">
          {fmtTime(it.depart)} <span className="text-paper/50" aria-label="à">→</span> {fmtTime(it.arrive)}
        </span>
        <span className="text-[1.125rem] text-mist">{fmtDuration(it.duration)}</span>
      </p>

      <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Enchaînement des transports">
        {it.legs.map((l, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="h-px w-3 bg-paper/30" />}
            {l.kind === 'walk' ? (
              <span className="inline-flex items-center gap-1 text-[0.875rem] text-mist">
                <Walk width={15} height={15} />
                {l.minutes} min<span className="sr-only"> à pied</span>
              </span>
            ) : (
              <LineBadge mode={l.line.mode} name={l.line.name} />
            )}
          </li>
        ))}
      </ul>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-[0.9375rem]">
        <div>
          <dt className="text-mist">Correspondances</dt>
          <dd className="mt-0.5 font-medium">{it.transfers}</dd>
        </div>
        <div>
          <dt className="text-mist">Marche</dt>
          <dd className="mt-0.5 font-medium">{it.walkMinutes} min</dd>
        </div>
        <div>
          <dt className="text-mist">Plus longue marche</dt>
          <dd className="mt-0.5 font-medium">{it.longestWalk} min</dd>
        </div>
      </dl>

      {it.relaxed.length > 0 && (
        <div className="mt-4 rounded-xl bg-accent/10 px-4 py-3 ring-1 ring-accent/40">
          <p className="text-[0.9375rem] font-medium">Aucun trajet ne respectait tous vos critères. Celui-ci s’en approche :</p>
          <ul className="mt-1.5 list-disc pl-5 text-[0.9375rem] text-paper/90">
            {it.relaxed.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {it.warnings.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {it.warnings.map((w) => (
            <li key={w} className="rounded-xl bg-[#ffb4c4]/10 px-4 py-2.5 text-[0.9375rem] text-[#ffe0e7] ring-1 ring-[#ffb4c4]/40">
              {w}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate('/billet', { state: { it, from, to, fromName, toName, isoDate, replaces } })}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 text-[1rem] font-semibold text-navy hover:bg-accent/85"
        >
          {replaces ? 'Choisir ce trajet' : 'Acheter ce trajet'}
          <Arrow width={16} height={16} />
        </button>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => {
            // lecture à voix haute activée : on lit le trajet dès qu'on l'ouvre
            if (!open && readAloud) readTrip()
            onToggle()
          }}
          className="inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-[1rem] ring-1 ring-paper/30 hover:ring-paper/70"
        >
          {open ? 'Masquer le détail' : 'Étape par étape'}
          <Arrow width={16} height={16} className={`transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
        </button>
        {readAloud && (
          <button type="button" onClick={readTrip} className="inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[1rem] ring-1 ring-paper/30 hover:ring-paper/70">
            Écouter
          </button>
        )}
        <button
          type="button"
          disabled={saved}
          onClick={() => {
            save({ id: tripId, from, to, fromName, toName, summary: `${fmtDuration(it.duration)} · ${rides.map((r) => (r.kind === 'ride' ? r.line.name : '')).join(' + ') || 'à pied'}` })
            setJustSaved(true)
          }}
          className="inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[1rem] ring-1 ring-paper/30 enabled:hover:ring-paper/70 disabled:text-accent disabled:ring-accent/50"
        >
          {saved ? 'Enregistré dans mon espace' : 'Composter ce trajet'}
        </button>
      </div>

      <div id={detailsId} hidden={!open}>
        {open && <Timeline it={it} destName={toName} />}
      </div>
    </Ticket>
  )
}

export default function Planner() {
  const { profile, prefs } = useProfile()
  const [params, setParams] = useSearchParams()
  const from = params.get('de') ?? ''
  const to = params.get('a') ?? ''
  const at = params.get('h') ?? ''
  const day = params.get('j') ?? todayIso()
  // modification d'un billet existant : on arrive ici avec son code
  const replaces = (useLocation().state as { replaces?: string } | null)?.replaces
  const [form, setForm] = useState({ from: decodePlace(from) ?? placeById.get('saint-charles')!, to: decodePlace(to) ?? placeById.get('vieux-port')!, at: at || nowHHMM(), day })
  const [openId, setOpenId] = useState<string | null>(null)
  const resultsRef = useRef<HTMLHeadingElement>(null)

  const results = useMemo(() => (from && to ? plan(decodePlace(from), decodePlace(to), toMinutes(at || nowHHMM()), profile) : null), [from, to, at, profile])
  useEffect(() => setOpenId(results?.[0]?.id ?? null), [results])
  useEffect(() => {
    if (results) resultsRef.current?.focus()
  }, [results])

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    setParams({ de: encodePlace(form.from), a: encodePlace(form.to), h: form.at, j: form.day }, { state: { replaces } })
  }
  const quick = (f: string, t: string) => {
    setForm((s) => ({ ...s, from: placeById.get(f)!, to: placeById.get(t)! }))
    setParams({ de: f, a: t, h: form.at, j: form.day }, { state: { replaces } })
  }

  const needs = profile ? travelNeeds(profile) : null
  const applied = needs
    ? ([
        needs.wheelchair ? 'En fauteuil' : needs.stepFree && 'Sans marches',
        needs.maxWalkMinutes && `${needs.maxWalkMinutes} min de marche max.`,
        needs.fewTransfers && 'Peu de correspondances',
        needs.calmRoutes && 'Trajets calmes',
        needs.stationAssistance && 'Assistance en gare',
        needs.detailedGuidance ? 'Guidage détaillé' : 'Guidage essentiel',
        needs.audioGuidance && 'Guidage vocal',
        profile?.transports.length && `${profile.transports.length} mode${profile.transports.length > 1 ? 's' : ''} de transport`,
      ].filter(Boolean) as string[])
    : []

  const select = 'mt-2 block min-h-14 w-full rounded-2xl bg-navy px-4 text-[1.0625rem] text-paper ring-1 ring-paper/30 focus:ring-2 focus:ring-accent focus:outline-none'

  return (
    <>
      <Nav />
      <main id="contenu" className="relative isolate min-h-svh overflow-x-clip bg-navy pt-28 text-paper">
        <SectionsSky />
        <div className="mx-auto max-w-[1180px] px-4 pb-28 md:px-10">
          <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-paper/70 uppercase">Trajets · Région Sud</p>
          <h1 className="mt-3 text-[clamp(2.5rem,5vw,4.25rem)] leading-[1] font-medium tracking-[-0.04em]">
            Où allez-vous <span className="font-serif font-normal tracking-[-0.02em] text-accent italic">aujourd’hui ?</span>
          </h1>

          {profile ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[1rem] text-mist">Calculé pour votre profil :</span>
              {applied.map((a) => (
                <span key={a} className="rounded-full px-3 py-1.5 text-[0.875rem] ring-1 ring-paper/25">
                  {a}
                </span>
              ))}
              <Link to="/profil/creer" className="ml-1 min-h-11 content-center text-[0.9375rem] text-accent underline underline-offset-4">
                Modifier
              </Link>
            </div>
          ) : (
            <p className="mt-6 max-w-[62ch] rounded-2xl bg-paper/[0.05] px-5 py-4 text-[1rem] leading-[1.6] ring-1 ring-line">
              Sans profil, nous calculons un trajet standard.{' '}
              <Link to="/profil/creer" className="font-medium text-accent underline underline-offset-4">
                Créez votre profil en 2 minutes
              </Link>{' '}
              pour des trajets adaptés à vos besoins.
            </p>
          )}

          {replaces && (
            <p role="status" className="mt-8 rounded-2xl bg-accent/10 px-5 py-4 text-[1rem] ring-1 ring-accent/40">
              Modification du billet <span className="font-mono">{replaces}</span> : choisissez une nouvelle date, heure ou un autre trajet. L’ancien billet sera échangé.
            </p>
          )}

          <form onSubmit={submit} className="mt-10" aria-label="Rechercher un trajet">
            {/* carte simple (pas de billet découpé) : les suggestions d'adresses doivent pouvoir déborder */}
            <div className="relative z-20 rounded-card bg-[rgb(237_195_196/0.05)] p-7 ring-1 ring-paper/20 backdrop-blur-md md:p-8 xl:p-10">
              <TicketLabel>Recherche</TicketLabel>
              <div className="mt-6 grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_180px_150px]">
                <PlacePicker label="Départ" value={form.from} onChange={(p) => setForm({ ...form, from: p })} />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, from: form.to, to: form.from })}
                  className="grid size-14 place-items-center justify-self-center rounded-full ring-1 ring-paper/30 hover:ring-paper/70"
                  aria-label="Inverser départ et arrivée"
                >
                  <Arrow width={20} height={20} className="rotate-90 md:rotate-0" />
                </button>
                <PlacePicker label="Arrivée" value={form.to} onChange={(p) => setForm({ ...form, to: p })} />
                <label className="block">
                  <span className="text-[1rem] font-medium">Le</span>
                  <input type="date" min={todayIso()} className={select} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value || todayIso() })} />
                </label>
                <label className="block">
                  <span className="text-[1rem] font-medium">Partir à</span>
                  <input type="time" className={select} value={form.at} onChange={(e) => setForm({ ...form, at: e.target.value })} />
                </label>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button type="submit" className="inline-flex min-h-14 items-center gap-3 rounded-full bg-paper px-8 text-[1.0625rem] font-medium text-navy hover:bg-paper/85">
                  Rechercher
                  <Arrow width={18} height={18} />
                </button>
                <span className="text-[0.9375rem] text-mist">Idées :</span>
                {[
                  ['saint-charles', 'vieux-port', 'Saint-Charles → Vieux-Port'],
                  ['aix-mirabeau', 'velodrome', 'Aix → Vélodrome'],
                  ['castellane', 'cassis-port', 'Castellane → Cassis'],
                  ['vieux-port', 'nice-promenade', 'Marseille → Nice'],
                ].map(([f, t, label]) => (
                  <button key={label} type="button" onClick={() => quick(f, t)} className="min-h-11 rounded-full px-4 text-[0.9375rem] ring-1 ring-paper/25 hover:ring-paper/60">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <details className="mt-6 rounded-2xl bg-paper/[0.04] px-5 py-4 ring-1 ring-line">
            <summary className="min-h-8 cursor-pointer text-[1rem] font-medium">Info trafic et accessibilité ({disruptions.length})</summary>
            <ul className="mt-3 flex flex-col gap-2">
              {disruptions.map((d) => (
                <li key={d.id} className="flex items-start gap-2.5 text-[0.9375rem] text-mist">
                  <Clock width={15} height={15} className="mt-1 shrink-0 text-accent-2" />
                  {d.text}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.8125rem] text-paper/60">Données de démonstration : réseau, horaires et état des équipements sont simulés.</p>
          </details>

          {results && (
            <section aria-labelledby="resultats" className="mt-14">
              <h2 ref={resultsRef} tabIndex={-1} id="resultats" className="text-[1.75rem] font-medium tracking-[-0.02em]" aria-live="polite">
                {results.length
                  ? `${results.length} itinéraire${results.length > 1 ? 's' : ''} de ${decodePlace(from)?.name} à ${decodePlace(to)?.name}, ${longDate(day)}`
                  : 'Aucun itinéraire ne respecte toutes vos contraintes'}
              </h2>
              {results.length > 0 ? (
                <ul className="mt-6 flex flex-col gap-6">
                  {results.map((it) => (
                    <ItineraryTicket key={it.id} it={it} from={from} to={to} open={openId === it.id} onToggle={() => setOpenId(openId === it.id ? null : it.id)} readAloud={prefs.readAloud} isoDate={day} replaces={replaces} />
                  ))}
                </ul>
              ) : (
                <div className="mt-6 max-w-[64ch] rounded-card bg-paper/[0.04] p-7 ring-1 ring-line">
                  <p className="text-[1.0625rem] leading-[1.6]">
                    Avec vos réglages actuels (accès sans marche, durée de marche, modes acceptés…), nous ne trouvons pas de trajet en transports en commun.
                  </p>
                  <ul className="mt-5 flex flex-col gap-3 text-[1rem] text-mist">
                    <li className="flex gap-3">
                      <Bus width={18} height={18} className="mt-1 shrink-0 text-accent" />
                      <span>
                        <strong className="font-medium text-paper">Transport à la demande (TPMR)</strong> : un service porte-à-porte pour les personnes à mobilité réduite, à réserver la veille.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Bike width={18} height={18} className="mt-1 shrink-0 text-accent" />
                      <span>
                        Essayez une autre heure, ou{' '}
                        <Link to="/profil/creer" className="text-accent underline underline-offset-4">
                          ajustez votre profil
                        </Link>{' '}
                        (par exemple les transports acceptés).
                      </span>
                    </li>
                  </ul>
                </div>
              )}
              {profile && (
                <p className="mt-8 text-[0.9375rem] text-mist">
                  Profil : {profile.mobility.map((m) => labels.mobility[m]).join(', ') || 'déplacement non précisé'}
                  {profile.frequency ? ` · voyage ${labels.frequency[profile.frequency].toLowerCase()}` : ''}.
                </p>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

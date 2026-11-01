import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { AppHeader } from './AppShell'
import { Arrow, Walk } from '../components/icons'
import LineBadge from '../components/planner/LineBadge'
import PlacePicker from '../components/planner/PlacePicker'
import Timeline, { legSpeech, nowHHMM, toMinutes } from '../components/planner/Timeline'
import { speak } from '../lib/a11y'
import { placeById } from '../planner/data'
import { fmtDuration, fmtTime, plan, type Itinerary } from '../planner/engine'
import { decodePlace, encodePlace } from '../planner/places'
import { useSavedTrips } from '../planner/savedTrips'
import { todayIso } from '../planner/tickets'
import { useProfile } from '../profile/ProfileContext'

const field = 'mt-1.5 block min-h-14 w-full rounded-2xl bg-navy px-4 text-[1.0625rem] text-paper ring-1 ring-paper/30 focus:ring-2 focus:ring-accent focus:outline-none'

function Result({ it, from, to, isoDate, replaces, open, onToggle }: { it: Itinerary; from: string; to: string; isoDate: string; replaces?: string; open: boolean; onToggle: () => void }) {
  const navigate = useNavigate()
  const { prefs } = useProfile()
  const { trips, save } = useSavedTrips()
  const fromName = decodePlace(from)!.name
  const toName = decodePlace(to)!.name
  const tripId = `${from}>${to}:${it.id}`
  const saved = trips.some((t) => t.id === tripId)
  const rides = it.legs.filter((l) => l.kind === 'ride')

  return (
    <li className="rounded-card bg-[rgb(237_195_196/0.05)] p-5 ring-1 ring-paper/20">
      <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-paper/65 uppercase">{it.labels[0]}</p>
      <p className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-[1.5rem] leading-none font-medium tracking-[-0.03em]">
          {fmtTime(it.depart)} → {fmtTime(it.arrive)}
        </span>
        <span className="text-[1rem] text-mist">{fmtDuration(it.duration)}</span>
      </p>
      <ul className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Enchaînement des transports">
        {it.legs.map((l, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true" className="h-px w-2 bg-paper/30" />}
            {l.kind === 'walk' ? (
              <span className="inline-flex items-center gap-0.5 text-[0.8125rem] text-mist">
                <Walk width={14} height={14} />
                {l.minutes}
                <span className="sr-only"> min à pied</span>
              </span>
            ) : (
              <LineBadge mode={l.line.mode} name={l.line.name} />
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap gap-2 text-[0.8125rem]">
        <span className="rounded-full px-2.5 py-1 ring-1 ring-paper/25">{it.transfers === 0 ? 'Direct' : `${it.transfers} corresp.`}</span>
        <span className="rounded-full px-2.5 py-1 ring-1 ring-paper/25">{it.walkMinutes} min à pied</span>
        {it.stepFree && <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-navy">Sans marche</span>}
        {it.assistance && <span className="rounded-full px-2.5 py-1 ring-1 ring-accent/60">Assistance</span>}
      </p>
      {it.relaxed.length > 0 && <p className="mt-3 rounded-xl bg-accent/10 px-3 py-2 text-[0.875rem] ring-1 ring-accent/40">Le plus proche de vos besoins : {it.relaxed.join(' · ').toLowerCase()}</p>}
      {it.warnings.map((w) => (
        <p key={w} className="mt-2 rounded-xl bg-[#ffb4c4]/10 px-3 py-2 text-[0.875rem] text-[#ffe0e7] ring-1 ring-[#ffb4c4]/40">
          {w}
        </p>
      ))}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => navigate('/app/commande', { state: { it, from, to, fromName, toName, isoDate, replaces } })}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent text-[1rem] font-semibold text-navy"
        >
          {replaces ? 'Choisir' : 'Acheter'}
        </button>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            if (!open && prefs.readAloud) speak(`${it.legs.map(legSpeech).join(' ')} Arrivée à ${fmtTime(it.arrive)}.`)
            onToggle()
          }}
          className="min-h-12 rounded-full text-[1rem] ring-1 ring-paper/35"
        >
          {open ? 'Masquer' : 'Détails'}
        </button>
      </div>
      {open && (
        <div className="mt-2">
          <Timeline it={it} destName={toName} />
          <button
            type="button"
            disabled={saved}
            onClick={() => save({ id: tripId, from, to, fromName, toName, summary: `${fmtDuration(it.duration)} · ${rides.map((r) => (r.kind === 'ride' ? r.line.name : '')).join(' + ') || 'à pied'}` })}
            className="min-h-12 w-full rounded-full text-[1rem] ring-1 ring-paper/30 disabled:text-accent disabled:ring-accent/50"
          >
            {saved ? 'Trajet enregistré' : 'Enregistrer ce trajet'}
          </button>
        </div>
      )}
    </li>
  )
}

export default function AppTrips() {
  const { profile } = useProfile()
  const [params, setParams] = useSearchParams()
  const replaces = (useLocation().state as { replaces?: string } | null)?.replaces
  const from = params.get('de') ?? ''
  const to = params.get('a') ?? ''
  const at = params.get('h') ?? ''
  const day = params.get('j') ?? todayIso()
  const [form, setForm] = useState({ from: decodePlace(from), to: decodePlace(to), at: at || nowHHMM(), day })
  const [openId, setOpenId] = useState<string | null>(null)

  const results = useMemo(() => (from && to ? plan(decodePlace(from), decodePlace(to), toMinutes(at || nowHHMM()), profile) : null), [from, to, at, profile])
  useEffect(() => setOpenId(null), [results])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.from || !form.to) return
    setParams({ de: encodePlace(form.from), a: encodePlace(form.to), h: form.at, j: form.day }, { state: { replaces } })
  }

  return (
    <>
      <AppHeader title={replaces ? 'Modifier mon billet' : 'Trajets'} back={replaces ? `/app/billets/${replaces}` : undefined} />
      <main id="contenu" className="px-5 pb-8">
        <form onSubmit={submit} aria-label="Rechercher un trajet" className="relative z-10 flex flex-col gap-3">
          <PlacePicker label="Départ" value={form.from} onChange={(p) => setForm({ ...form, from: p })} />
          <button
            type="button"
            onClick={() => setForm({ ...form, from: form.to, to: form.from })}
            className="-my-1 self-end rounded-full px-3 py-1.5 text-[0.875rem] text-accent ring-1 ring-accent/40"
            aria-label="Inverser départ et arrivée"
          >
            ⇅ Inverser
          </button>
          <PlacePicker label="Arrivée" value={form.to} onChange={(p) => setForm({ ...form, to: p })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[1rem] font-medium">Le</span>
              <input type="date" min={todayIso()} className={field} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value || todayIso() })} />
            </label>
            <label className="block">
              <span className="text-[1rem] font-medium">À</span>
              <input type="time" className={field} value={form.at} onChange={(e) => setForm({ ...form, at: e.target.value })} />
            </label>
          </div>
          <button type="submit" disabled={!form.from || !form.to} className="mt-1 flex min-h-14 items-center justify-center gap-2 rounded-full bg-paper text-[1.0625rem] font-semibold text-navy disabled:opacity-40">
            Rechercher <Arrow width={18} height={18} />
          </button>
          {!from && (
            <div className="flex flex-wrap gap-2">
              {[
                ['saint-charles', 'vieux-port', 'Saint-Charles → Vieux-Port'],
                ['castellane', 'cassis-port', 'Castellane → Cassis'],
                ['vieux-port', 'nice-promenade', 'Marseille → Nice'],
              ].map(([f, t, l]) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, from: placeById.get(f), to: placeById.get(t) })
                    setParams({ de: f, a: t, h: form.at, j: form.day }, { state: { replaces } })
                  }}
                  className="min-h-11 rounded-full px-4 text-[0.875rem] ring-1 ring-paper/25"
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </form>

        {results && (
          <section aria-labelledby="res" className="mt-8">
            <h2 id="res" className="text-[1.125rem] font-medium" aria-live="polite">
              {results.length ? `${results.length} itinéraire${results.length > 1 ? 's' : ''}` : 'Aucun itinéraire ne respecte vos contraintes'}
            </h2>
            {results.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-4">
                {results.map((it) => (
                  <Result key={it.id} it={it} from={from} to={to} isoDate={day} replaces={replaces} open={openId === it.id} onToggle={() => setOpenId(openId === it.id ? null : it.id)} />
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[1rem] leading-[1.55] text-mist">Essayez une autre heure, ou le transport à la demande (service porte-à-porte, à réserver la veille).</p>
            )}
          </section>
        )}
      </main>
    </>
  )
}

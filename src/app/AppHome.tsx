import { Link } from 'react-router'
import { Clock, Search, Spark } from '../components/icons'
import LineBadge from '../components/planner/LineBadge'
import { disruptions } from '../planner/data'
import { fmtTime } from '../planner/engine'
import { useSavedTrips } from '../planner/savedTrips'
import { capFirst, todayIso, useTickets } from '../planner/tickets'
import { useProfile } from '../profile/ProfileContext'

export default function AppHome() {
  const { profile } = useProfile()
  const { tickets } = useTickets()
  const { trips } = useSavedTrips()
  const today = todayIso()
  // prochain billet valable, aujourd'hui ou plus tard
  const upcoming = tickets
    .filter((t) => (t.status ?? 'valide') === 'valide' && (t.isoDate ?? today) >= today)
    .sort((a, b) => `${a.isoDate}${a.it.depart}`.localeCompare(`${b.isoDate}${b.it.depart}`))
  const next = upcoming[0]
  const hour = new Date().getHours()

  return (
    <main id="contenu" className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-8">
      <p className="text-[0.9375rem] text-mist">{capFirst(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
      <h1 className="mt-1 text-[2rem] leading-[1.1] font-medium tracking-[-0.03em]">
        {hour < 18 ? 'Bonjour' : 'Bonsoir'}
        {profile?.firstName ? ` ${profile.firstName}` : ''}
        <span className="font-serif font-normal text-accent italic"> !</span>
      </h1>

      {/* entrée principale : la recherche */}
      <Link to="/app/trajets" className="mt-6 flex min-h-16 items-center gap-4 rounded-2xl bg-paper px-5 text-navy">
        <Search width={24} height={24} strokeWidth={2} />
        <span className="text-[1.125rem] font-medium">Où allez-vous ?</span>
      </Link>

      {!profile && (
        <div className="mt-5 rounded-card bg-accent/10 p-5 ring-1 ring-accent/40">
          <p className="text-[1.0625rem] font-medium">Créez votre profil en 2 minutes</p>
          <p className="mt-1 text-[0.9375rem] leading-[1.5] text-mist">L’app adaptera vos trajets, l’affichage et l’accompagnement à vos besoins.</p>
          <Link to="/app/profil/creer" className="mt-4 inline-flex min-h-12 items-center rounded-full bg-paper px-5 text-[1rem] font-medium text-navy">
            Créer mon profil
          </Link>
        </div>
      )}

      {/* prochain billet */}
      <section aria-labelledby="prochain" className="mt-8">
        <h2 id="prochain" className="text-[1.125rem] font-medium">
          Prochain trajet
        </h2>
        {next ? (
          <div className="mt-3 rounded-card bg-[rgb(237_195_196/0.06)] p-5 ring-1 ring-paper/20">
            <p className="font-mono text-[0.75rem] tracking-[0.14em] text-paper/60 uppercase">
              {next.isoDate === today ? 'Aujourd’hui' : capFirst(next.date)} · {fmtTime(next.it.depart)}
            </p>
            <p className="mt-2 text-[1.25rem] leading-[1.25] font-medium">
              {next.fromName} <span aria-label="vers">→</span> {next.toName}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Transports">
              {next.it.legs.map((l, i) => (l.kind === 'ride' ? <li key={i}><LineBadge mode={l.line.mode} name={l.line.name} /></li> : null))}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link to={`/app/en-route/${next.code}`} className="flex min-h-14 items-center justify-center rounded-full bg-accent text-[1.0625rem] font-semibold text-navy">
                Démarrer
              </Link>
              <Link to={`/app/billets/${next.code}`} className="flex min-h-14 items-center justify-center rounded-full text-[1.0625rem] ring-1 ring-paper/35">
                Mon billet
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-card bg-paper/[0.04] p-5 text-[1rem] text-mist ring-1 ring-line">Aucun billet à venir. Cherchez un trajet pour en acheter un.</p>
        )}
      </section>

      {trips.length > 0 && (
        <section aria-labelledby="favoris" className="mt-8">
          <h2 id="favoris" className="text-[1.125rem] font-medium">
            Mes trajets enregistrés
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {trips.slice(0, 4).map((t) => (
              <li key={t.id}>
                <Link to={`/app/trajets?de=${encodeURIComponent(t.from)}&a=${encodeURIComponent(t.to)}`} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl px-4 py-3 ring-1 ring-line">
                  <span className="min-w-0">
                    <span className="block truncate text-[1rem] font-medium">
                      {t.fromName} → {t.toName}
                    </span>
                    <span className="block truncate text-[0.875rem] text-mist">{t.summary}</span>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="trafic" className="mt-8">
        <h2 id="trafic" className="text-[1.125rem] font-medium">
          Info trafic
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {disruptions.map((d) => (
            <li key={d.id} className="flex items-start gap-3 rounded-2xl bg-paper/[0.04] px-4 py-3 text-[0.9375rem] leading-[1.45] text-mist ring-1 ring-line">
              <Clock width={16} height={16} className="mt-0.5 shrink-0 text-accent-2" />
              {d.text}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-2 text-[0.8125rem] text-paper/55">
          <Spark width={12} height={12} /> Données de démonstration
        </p>
      </section>
    </main>
  )
}

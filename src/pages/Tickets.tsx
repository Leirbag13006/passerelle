import { Link } from 'react-router'
import { euros } from '../planner/pricing'
import { capFirst, useTickets, type IssuedTicket } from '../planner/tickets'
import { fmtTime } from '../planner/engine'
import InfoPage from './InfoPage'

const statusLabel = { valide: 'Valable', annule: 'Annulé', echange: 'Échangé' } as const

function Row({ t }: { t: IssuedTicket }) {
  const status = t.status ?? 'valide'
  return (
    <li className={`rounded-card p-6 ring-1 md:p-7 ${status === 'valide' ? 'bg-paper/[0.05] ring-paper/25' : 'bg-paper/[0.02] ring-line'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[1.1875rem] font-medium">
            {t.fromName} <span aria-label="vers">→</span> {t.toName}
          </p>
          <p className="mt-1 text-[1rem] text-mist">
            {capFirst(t.date)} · {fmtTime(t.it.depart)} → {fmtTime(t.it.arrive)} · {euros(t.total)}
          </p>
          <p className="mt-1 font-mono text-[0.875rem] tracking-[0.08em] text-paper/70">{t.code}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[0.875rem] font-medium ${status === 'valide' ? 'bg-accent text-navy' : 'ring-1 ring-paper/30 text-mist'}`}>{statusLabel[status]}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to={`/billet/${t.code}`} className="inline-flex min-h-12 items-center rounded-full px-5 text-[1rem] ring-1 ring-paper/30 hover:ring-paper/70">
          Voir le billet<span className="sr-only"> {t.code}</span>
        </Link>
        {status === 'valide' && (
          <Link to={`/en-route/${t.code}`} className="inline-flex min-h-12 items-center rounded-full bg-paper px-5 text-[1rem] font-medium text-navy hover:bg-paper/85">
            Démarrer le trajet<span className="sr-only"> {t.fromName} vers {t.toName}</span>
          </Link>
        )}
      </div>
    </li>
  )
}

export default function Tickets() {
  const { tickets } = useTickets()
  const valid = tickets.filter((t) => (t.status ?? 'valide') === 'valide')
  const past = tickets.filter((t) => (t.status ?? 'valide') !== 'valide')
  return (
    <InfoPage
      kicker="Mes billets"
      title={
        <>
          Vos billets <span className="font-serif font-normal tracking-[-0.02em] text-accent italic">tout compris</span>
        </>
      }
      intro="Enregistrés sur cet appareil, avec ou sans profil."
    >
      {tickets.length === 0 ? (
        <div className="rounded-card bg-paper/[0.04] p-7 ring-1 ring-line">
          <p className="text-[1.0625rem]">Vous n’avez pas encore de billet.</p>
          <Link to="/trajets" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-paper px-6 text-[1rem] font-medium text-navy hover:bg-paper/85">
            Planifier un trajet
          </Link>
        </div>
      ) : (
        <>
          <section aria-labelledby="valables">
            <h2 id="valables" className="text-[1.5rem] font-medium">
              À venir ({valid.length})
            </h2>
            {valid.length === 0 && (
              <p className="mt-3 text-[1.0625rem] text-mist">
                Aucun billet à venir.{' '}
                <Link to="/trajets" className="text-accent underline underline-offset-4">
                  Planifier un trajet
                </Link>
              </p>
            )}
            <ul className="mt-4 flex flex-col gap-4">
              {valid.map((t) => (
                <Row key={t.code} t={t} />
              ))}
            </ul>
          </section>
          {past.length > 0 && (
            <section aria-labelledby="anciens">
              <h2 id="anciens" className="text-[1.5rem] font-medium">
                Annulés ou échangés ({past.length})
              </h2>
              <ul className="mt-4 flex flex-col gap-4">
                {past.map((t) => (
                  <Row key={t.code} t={t} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </InfoPage>
  )
}

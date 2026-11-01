import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AppHeader } from './AppShell'
import { Check } from '../components/icons'
import InterfaceControls from '../components/profile/InterfaceControls'
import { useSavedTrips } from '../planner/savedTrips'
import { useTickets } from '../planner/tickets'
import { labels } from '../profile/derive'
import { useProfile } from '../profile/ProfileContext'
import { promises } from '../profile/promises'

export default function AppProfile() {
  const { profile, prefs, updateInterface, remove } = useProfile()
  const { clear: clearTrips } = useSavedTrips()
  const { clear: clearTickets } = useTickets()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)

  if (!profile) {
    return (
      <>
        <AppHeader title="Profil" />
        <main id="contenu" className="px-5 pb-8">
          <div className="rounded-card bg-[rgb(237_195_196/0.06)] p-6 ring-1 ring-paper/20">
            <p className="text-[1.375rem] leading-[1.2] font-medium">Un profil, et l’app s’adapte à vous</p>
            <p className="mt-2 text-[1rem] leading-[1.55] text-mist">Deux minutes de questions : vos trajets, l’affichage et l’accompagnement en route seront taillés pour vous. Rien ne quitte votre téléphone.</p>
            <Link to="/app/profil/creer" className="mt-5 flex min-h-14 items-center justify-center rounded-full bg-paper text-[1.0625rem] font-semibold text-navy">
              Créer mon profil
            </Link>
          </div>
          <section aria-labelledby="aff" className="mt-6 rounded-card bg-paper/[0.04] px-5 py-4 ring-1 ring-line">
            <h2 id="aff" className="text-[1.125rem] font-medium">
              Affichage
            </h2>
            <p className="mt-1 text-[0.9375rem] text-mist">Créez un profil pour enregistrer ces réglages.</p>
          </section>
        </main>
      </>
    )
  }

  const p = profile
  const chips = [...p.mobility.map((m) => labels.mobility[m]), p.vision !== 'ok' && labels.vision[p.vision], p.hearing !== 'ok' && labels.hearing[p.hearing], p.frequency && `Voyage ${labels.frequency[p.frequency].toLowerCase()}`].filter(Boolean) as string[]

  return (
    <>
      <AppHeader title="Profil" />
      <main id="contenu" className="px-5 pb-8">
        <p className="text-[1.75rem] leading-[1.1] font-medium tracking-[-0.03em]">
          {p.firstName || 'Mon profil'}
          <span className="font-serif font-normal text-accent italic">, bon trajet.</span>
        </p>
        {chips.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Mon profil en bref">
            {chips.map((c) => (
              <li key={c} className="rounded-full px-3 py-1.5 text-[0.875rem] ring-1 ring-paper/25">
                {c}
              </li>
            ))}
          </ul>
        )}
        <Link to="/app/profil/creer" className="mt-4 flex min-h-12 items-center justify-center rounded-full text-[1rem] ring-1 ring-paper/35">
          Modifier mes réponses
        </Link>

        <section aria-labelledby="prevu" className="mt-6 rounded-card bg-[rgb(237_195_196/0.06)] p-5 ring-1 ring-paper/20">
          <h2 id="prevu" className="text-[1.125rem] font-medium">
            Ce que l’app fait pour vous
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {promises(p).map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[0.9375rem] leading-[1.5]">
                <Check width={16} height={16} strokeWidth={2.4} className="mt-1 shrink-0 text-accent" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="aff" className="mt-4 rounded-card bg-paper/[0.04] px-5 py-4 ring-1 ring-line">
          <h2 id="aff" className="mb-2 text-[1.125rem] font-medium">
            Affichage
          </h2>
          <InterfaceControls value={prefs} onChange={updateInterface} />
        </section>

        <section aria-labelledby="donnees" className="mt-4 rounded-card bg-paper/[0.04] p-5 ring-1 ring-line">
          <h2 id="donnees" className="text-[1.125rem] font-medium">
            Mes données
          </h2>
          <p className="mt-1 text-[0.9375rem] text-mist">Tout reste sur ce téléphone.</p>
          {!confirm ? (
            <button type="button" onClick={() => setConfirm(true)} className="mt-4 min-h-12 w-full rounded-full text-[1rem] text-[#ffb4c4] ring-1 ring-[#ffb4c4]/45">
              Supprimer mon profil
            </button>
          ) : (
            <div role="alertdialog" aria-labelledby="del-q" className="mt-4 rounded-2xl p-4 ring-1 ring-[#ffb4c4]/60">
              <p id="del-q" className="text-[1rem] font-medium">
                Supprimer votre profil, vos trajets et vos billets de ce téléphone ?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button type="button" autoFocus onClick={() => setConfirm(false)} className="min-h-12 rounded-full bg-paper text-[1rem] font-medium text-navy">
                  Garder
                </button>
                <button
                  type="button"
                  onClick={() => {
                    remove()
                    clearTrips()
                    clearTickets()
                    navigate('/app', { replace: true })
                  }}
                  className="min-h-12 rounded-full text-[1rem] text-[#ffb4c4] ring-1 ring-[#ffb4c4]/60"
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </section>

        <Link to="/" className="mt-6 block text-center text-[0.9375rem] text-mist underline underline-offset-4">
          Voir le site Passerelle
        </Link>
      </main>
    </>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { Check } from '../../components/icons'
import InfoPage, { Block, ToFill } from '../InfoPage'

const faq = [
  {
    q: 'Faut-il créer un compte ?',
    a: 'Non. Votre profil, vos trajets et vos billets sont enregistrés sur votre appareil, sans compte ni mot de passe. Vous pouvez les télécharger ou les supprimer depuis votre espace.',
  },
  {
    q: 'Que se passe-t-il si aucun trajet ne respecte mon profil ?',
    a: 'Passerelle cherche le trajet le plus proche de vos besoins et vous dit clairement ce qui diffère (un transport que vous n’avez pas coché, un peu plus de marche…). L’accès sans marche n’est jamais levé pour une personne en fauteuil : nous proposons alors le transport à la demande.',
  },
  {
    q: 'Le billet couvre-t-il vraiment tous les transports ?',
    a: 'Oui : un seul billet et un seul QR code pour toutes les lignes du trajet, du métro au train. Les correspondances urbaines sont comprises pendant une heure.',
  },
  {
    q: 'Comment fonctionne l’assistance en gare ?',
    a: 'Si vous la choisissez, nous transmettons la réservation (service Accès Plus) aux gares concernées. Présentez-vous au point d’accueil 30 minutes avant le départ du train. Le service est gratuit.',
  },
  {
    q: 'Mon chien d’assistance peut-il voyager ?',
    a: 'Oui, gratuitement et sans muselière, sur tous les transports. Indiquez-le dans votre profil : nous le signalons à chaque réservation.',
  },
  {
    q: 'Puis-je changer mes réglages d’affichage ?',
    a: 'À tout moment, depuis « Mon espace » : taille du texte, contraste élevé, police très lisible, animations, mode simplifié et lecture à voix haute.',
  },
]

const problems = ['Je n’arrive pas à utiliser une page', 'Un ascenseur ou un accès est en panne', 'Une information de trajet est fausse', 'Autre chose']

export default function Help() {
  const { hash } = useLocation()
  const [sent, setSent] = useState(false)
  const [kind, setKind] = useState(problems[0])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // démonstration : aucun envoi réseau, le signalement n'est pas transmis
    setSent(true)
  }

  return (
    <InfoPage
      kicker="Aide"
      title={
        <>
          On vous <span className="font-serif font-normal tracking-[-0.02em] text-accent italic">accompagne</span>
        </>
      }
      intro="Les réponses aux questions fréquentes, et comment nous joindre."
    >
      <section id="faq" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-[1.75rem] font-medium tracking-[-0.02em]">
          Questions fréquentes
        </h2>
        <div className="mt-5 flex flex-col gap-3">
          {faq.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-paper/[0.04] ring-1 ring-line open:ring-paper/35">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-[1.0625rem] font-medium">
                {f.q}
                <span aria-hidden="true" className="text-[1.5rem] leading-none text-accent transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 text-[1.0625rem] leading-[1.65] text-mist">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <Block title="Nous contacter">
        <p>
          Par courriel : <ToFill>adresse de contact</ToFill>
        </p>
        <p>
          Par téléphone (appel non surtaxé, transcription écrite possible pour les personnes sourdes ou malentendantes) : <ToFill>numéro</ToFill>
        </p>
        <p>
          Pour l’assistance en gare le jour du voyage, adressez-vous au point d’accueil de la gare. Votre code de billet suffit.
        </p>
      </Block>

      <section id="signaler" aria-labelledby="signaler-title" className="rounded-card bg-paper/[0.04] p-6 ring-1 ring-line md:p-8">
        <h2 id="signaler-title" className="text-[1.5rem] font-medium tracking-[-0.015em]">
          Signaler un problème d’accès
        </h2>
        {sent ? (
          <p role="status" className="mt-5 flex items-start gap-3 text-[1.0625rem] leading-[1.6]">
            <Check width={20} height={20} strokeWidth={2.4} className="mt-0.5 shrink-0 text-accent" />
            Merci, votre signalement est noté. (Démonstration : il n’est pas réellement transmis.)
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5 flex flex-col gap-5">
            <fieldset>
              <legend className="text-[1.0625rem] font-medium">De quoi s’agit-il ?</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {problems.map((p) => (
                  <label
                    key={p}
                    className={`flex min-h-14 cursor-pointer items-center rounded-2xl px-4 text-[1rem] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent ${kind === p ? 'bg-paper font-medium text-navy' : 'ring-1 ring-paper/30'}`}
                  >
                    <input type="radio" name="probleme" className="sr-only" checked={kind === p} onChange={() => setKind(p)} />
                    {p}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="text-[1.0625rem] font-medium">Décrivez le problème</span>
              <span className="block text-[0.9375rem] text-mist">Page ou lieu concerné, ce qui bloque. Quelques mots suffisent.</span>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 block w-full rounded-2xl bg-navy px-4 py-3 text-[1.0625rem] text-paper ring-1 ring-paper/30 focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </label>
            <button type="submit" className="min-h-14 self-start rounded-full bg-paper px-8 text-[1.0625rem] font-medium text-navy hover:bg-paper/85">
              Envoyer le signalement
            </button>
          </form>
        )}
      </section>

      <p className="text-[1rem] text-mist">
        Voir aussi la{' '}
        <Link to="/accessibilite" className="text-accent underline underline-offset-4">
          déclaration d’accessibilité
        </Link>
        .
      </p>
    </InfoPage>
  )
}

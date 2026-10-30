import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Arrow, Check } from '../components/icons'
import InterfaceControls from '../components/profile/InterfaceControls'
import SkyBackground from '../components/SkyBackground'
import { Barcode, Ticket, TicketLabel } from '../components/ticket/Ticket'
import { speak, stopSpeaking } from '../lib/a11y'
import { visibleSteps, type Option, type Step } from '../onboarding/steps'
import { createProfile, labels, suggestInterface } from '../profile/derive'
import { useProfile } from '../profile/ProfileContext'
import { emptyAnswers, type Answers, type InterfacePrefs, type Profile } from '../profile/types'

// en modification : on repart des réponses déjà enregistrées
const fromProfile = (p: Profile): Answers => {
  const answers = { ...emptyAnswers }
  for (const k of Object.keys(emptyAnswers) as (keyof Answers)[]) (answers as Record<string, unknown>)[k] = p[k]
  return answers
}

// Carte d'option : un vrai <input> (radio ou case) caché derrière un grand libellé cliquable
function OptionCard({ option, type, name, checked, onChange }: { option: Option; type: 'radio' | 'checkbox'; name: string; checked: boolean; onChange: () => void }) {
  const Icon = option.Icon
  return (
    <label
      className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl px-5 py-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
        checked ? 'bg-paper text-navy' : 'bg-paper/[0.04] text-paper ring-1 ring-line hover:ring-paper/50'
      }`}
    >
      <input type={type} name={name} className="sr-only" checked={checked} onChange={onChange} />
      {Icon && (
        <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-full ${checked ? 'bg-navy text-paper' : 'ring-1 ring-paper/30'}`}>
          <Icon width={19} height={19} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[1.0625rem] leading-[1.3] font-medium">{option.label}</span>
        {option.help && <span className={`mt-0.5 block text-[0.9375rem] leading-[1.4] ${checked ? 'text-navy/75' : 'text-mist'}`}>{option.help}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`grid size-6 shrink-0 place-items-center ${type === 'radio' ? 'rounded-full' : 'rounded-md'} ${checked ? 'bg-navy text-paper' : 'ring-2 ring-paper/35'}`}
      >
        {checked && <Check width={15} height={15} strokeWidth={2.8} />}
      </span>
    </label>
  )
}

export default function Onboarding() {
  const { profile, save, preview } = useProfile()
  const navigate = useNavigate()
  const editing = !!profile
  const [answers, setAnswers] = useState<Answers>(() => (profile ? fromProfile(profile) : emptyAnswers))
  const [prefs, setPrefs] = useState<InterfacePrefs | null>(() => profile?.interface ?? null)
  const [index, setIndex] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  const list = useMemo(() => visibleSteps(answers), [answers])
  const step: Step = list[Math.min(index, list.length - 1)]
  const total = list.length
  const current = Math.min(index, total - 1) + 1
  // réglages proposés d'après les réponses, tant que la personne ne les a pas touchés
  const effectivePrefs = useMemo(() => prefs ?? suggestInterface(answers), [prefs, answers])

  // à partir de l'étape « interface », toute la page reflète les réglages choisis
  const previewing = step.kind === 'interface' || step.kind === 'recap'
  useEffect(() => {
    preview(previewing ? effectivePrefs : null)
  }, [previewing, effectivePrefs, preview])
  useEffect(() => () => preview(null), [preview])

  // nouvelle question : on remonte et on place le focus sur le titre (annoncé par les lecteurs d'écran)
  useEffect(() => {
    stopSpeaking()
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    window.scrollTo({ top: 0 })
    headingRef.current?.focus()
  }, [index])

  const set = <K extends keyof Answers>(field: K, value: Answers[K]) => setAnswers((a) => ({ ...a, [field]: value }))
  const toggle = (field: keyof Answers, value: string) =>
    setAnswers((a) => {
      const arr = a[field] as string[]
      return { ...a, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] }
    })

  const next = () => {
    if (current < total) setIndex(current)
    else {
      save(createProfile(answers, effectivePrefs, profile))
      navigate('/espace', { state: { welcome: !editing } })
    }
  }
  const back = () => setIndex(Math.max(0, current - 2))
  const goTo = (id: string) => setIndex(Math.max(0, list.findIndex((s) => s.id === id)))

  const listen = () => {
    const opts = 'options' in step ? ' Choix possibles : ' + step.options.map((o) => o.label).join(', ') + '.' : ''
    speak(`${step.title}. ${step.help}.${opts}`)
  }

  return (
    <div className="relative isolate min-h-svh text-paper">
      {/* même ciel que l'accueil, voilé pour rester calme */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-navy">
        <div className="decor absolute inset-0">
          <SkyBackground className="absolute inset-0 h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_18_56/0.55),rgb(11_18_56/0.8))]" />
      </div>

      <header className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-baseline text-[1.0625rem] uppercase tracking-[0.06em]" aria-label="Passerelle, retour à l’accueil">
          <span className="font-semibold">Passe</span>
          <span className="font-light">relle</span>
        </Link>
        <Link to={editing ? '/espace' : '/'} className="min-h-11 content-center text-[0.9375rem] text-mist underline-offset-4 hover:text-paper hover:underline">
          {editing ? 'Annuler' : 'Quitter'}
        </Link>
      </header>

      <main className="mx-auto max-w-[860px] px-4 pt-4 pb-24 md:px-8">
        {/* progression : une étape = un tronçon du trajet */}
        <div className="mb-6">
          <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-paper/70 uppercase" aria-live="polite">
            {editing ? 'Modifier mon profil' : 'Créer mon profil'} · Étape {current} sur {total}
          </p>
          <div aria-hidden="true" className="mt-3 flex gap-1.5">
            {list.map((s, i) => (
              <span key={s.id} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i < current ? 'bg-accent' : 'bg-paper/15'}`} />
            ))}
          </div>
        </div>

        <Ticket
          as="div"
          stub={
            <>
              <span className="font-serif text-[2.125rem] leading-none text-accent italic">{current}</span>
              <Barcode className="w-[18px] flex-1" />
            </>
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TicketLabel>Billet Passerelle · {step.kind === 'recap' ? 'Récapitulatif' : 'Votre profil'}</TicketLabel>
            <button
              type="button"
              onClick={listen}
              className="inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[0.875rem] text-paper ring-1 ring-paper/30 hover:ring-paper/70"
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 10v4h4l5 4V6L8 10H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
              </svg>
              Écouter
            </button>
          </div>

          <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-[clamp(1.875rem,4vw,2.75rem)] leading-[1.08] font-medium tracking-[-0.03em] outline-none">
            {step.kind === 'intro' && answers.firstName ? `Faisons connaissance, ${answers.firstName}` : step.title}
          </h1>
          <p className="mt-3 max-w-[56ch] text-[1.0625rem] leading-[1.6] text-mist">{step.help}</p>

          <div className="mt-8">
            {step.kind === 'intro' && (
              <div className="max-w-[420px]">
                <label htmlFor="prenom" className="text-[1rem] font-medium">
                  Votre prénom <span className="font-normal text-mist">(facultatif)</span>
                </label>
                <input
                  id="prenom"
                  type="text"
                  autoComplete="given-name"
                  value={answers.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && next()}
                  className="mt-2 block min-h-14 w-full rounded-2xl bg-paper/[0.06] px-5 text-[1.125rem] text-paper ring-1 ring-paper/30 placeholder:text-paper/40 focus:ring-2 focus:ring-accent focus:outline-none"
                  placeholder="Ex. Camille"
                />
                <ul className="mt-8 flex flex-col gap-3 text-[1rem] text-paper">
                  {['Environ 2 minutes, 9 questions au plus', 'Vos réponses restent sur cet appareil', 'Tout est modifiable et supprimable'].map((t) => (
                    <li key={t} className="flex items-center gap-3">
                      <Check width={18} height={18} className="shrink-0 text-accent" strokeWidth={2.4} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(step.kind === 'single' || step.kind === 'multi') && (
              <fieldset>
                <legend className="sr-only">{step.title}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {step.options.map((o) => {
                    const val = answers[step.field]
                    const checked = step.kind === 'multi' ? (val as string[]).includes(o.value) : String(val) === o.value
                    return (
                      <OptionCard
                        key={o.value}
                        option={o}
                        type={step.kind === 'multi' ? 'checkbox' : 'radio'}
                        name={step.id}
                        checked={checked}
                        onChange={() =>
                          step.kind === 'multi'
                            ? toggle(step.field, o.value)
                            : set(step.field, (step.field === 'walkLimit' ? Number(o.value) : o.value) as never)
                        }
                      />
                    )
                  })}
                </div>
                {step.extras
                  ?.filter((x) => !x.when || x.when(answers))
                  .map((x) => (
                    <label key={x.field} className="mt-5 flex cursor-pointer items-start gap-4 rounded-2xl p-4 ring-1 ring-line has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent">
                      <input type="checkbox" className="sr-only" checked={answers[x.field]} onChange={(e) => set(x.field, e.target.checked)} />
                      <span aria-hidden="true" className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md ${answers[x.field] ? 'bg-paper text-navy' : 'ring-2 ring-paper/35'}`}>
                        {answers[x.field] && <Check width={15} height={15} strokeWidth={2.8} />}
                      </span>
                      <span>
                        <span className="block text-[1.0625rem] font-medium">{x.label}</span>
                        {x.help && <span className="mt-0.5 block text-[0.9375rem] text-mist">{x.help}</span>}
                      </span>
                    </label>
                  ))}
              </fieldset>
            )}

            {step.kind === 'interface' && <InterfaceControls value={effectivePrefs} onChange={(patch) => setPrefs({ ...effectivePrefs, ...patch })} />}

            {step.kind === 'recap' && <Recap answers={answers} prefs={effectivePrefs} onEdit={goTo} />}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            {current > 1 && (
              <button type="button" onClick={back} className="min-h-12 rounded-full px-6 text-[1rem] text-paper ring-1 ring-paper/30 hover:ring-paper/70">
                Retour
              </button>
            )}
            <div className="ml-auto flex items-center gap-3">
              {(step.kind === 'single' || step.kind === 'multi') && (
                <button type="button" onClick={next} className="min-h-12 px-3 text-[1rem] text-mist underline-offset-4 hover:text-paper hover:underline">
                  Passer
                </button>
              )}
              <button type="button" onClick={next} className="inline-flex min-h-14 items-center gap-3 rounded-full bg-paper px-8 text-[1.0625rem] font-medium text-navy hover:bg-paper/85">
                {step.kind === 'intro' ? 'Commencer' : step.kind === 'recap' ? (editing ? 'Enregistrer' : 'Créer mon profil') : 'Continuer'}
                <Arrow width={18} height={18} />
              </button>
            </div>
          </div>
        </Ticket>
      </main>
    </div>
  )
}

function Recap({ answers: a, prefs, onEdit }: { answers: Answers; prefs: InterfacePrefs; onEdit: (id: string) => void }) {
  // « À pied, avec une canne… » : majuscule seulement en tête de liste
  const join = (arr: string[], dict: Record<string, string>) =>
    arr.length ? arr.map((v, i) => (i ? dict[v].charAt(0).toLowerCase() + dict[v].slice(1) : dict[v])).join(', ') : 'Non précisé'
  const rows: { id: string; label: string; value: string }[] = [
    { id: 'deplacement', label: 'Déplacement', value: join(a.mobility, labels.mobility) + (a.walkLimit ? ` · marche ${a.walkLimit} min max.` : '') + (a.avoidStairs ? ' · sans escaliers' : '') },
    { id: 'vue', label: 'Vue', value: labels.vision[a.vision] + (a.colorBlind ? ' · couleurs difficiles à distinguer' : '') },
    { id: 'ouie', label: 'Audition', value: labels.hearing[a.hearing] },
    { id: 'difficultes', label: 'Ce qui vous complique un trajet', value: join(a.difficulties, labels.difficulties) },
    { id: 'avec-moi', label: 'Avec vous', value: join(a.companions, labels.companions) },
    { id: 'frequence', label: 'Fréquence', value: a.frequency ? labels.frequency[a.frequency] : 'Non précisé' },
    { id: 'transports', label: 'Transports', value: join(a.transports, labels.transports) + (a.stationAssistance ? ' · assistance en gare' : '') },
    {
      id: 'interface',
      label: 'Interface',
      value:
        [
          `Texte ${Math.round(prefs.textScale * 100)} %`,
          prefs.contrast === 'eleve' && 'contraste élevé',
          prefs.legibleFont && 'police très lisible',
          prefs.motion === 'reduit' && 'animations réduites',
          prefs.simplified && 'mode simplifié',
          prefs.readAloud && 'lecture à voix haute',
        ]
          .filter(Boolean)
          .join(' · '),
    },
  ]
  return (
    <dl className="divide-y divide-line">
      {rows.map((r) => (
        <div key={r.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 py-4 first:pt-0">
          <div className="min-w-0 flex-1">
            <dt className="font-mono text-[0.75rem] tracking-[0.14em] text-paper/60 uppercase">{r.label}</dt>
            <dd className="mt-1 text-[1.0625rem] leading-[1.5]">{r.value}</dd>
          </div>
          <button type="button" onClick={() => onEdit(r.id)} className="min-h-11 text-[0.9375rem] text-accent underline underline-offset-4">
            Modifier<span className="sr-only"> : {r.label}</span>
          </button>
        </div>
      ))}
    </dl>
  )
}

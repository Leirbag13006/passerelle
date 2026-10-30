import { useId } from 'react'
import type { InterfacePrefs } from '../../profile/types'

const scales: InterfacePrefs['textScale'][] = [1, 1.25, 1.5, 1.75, 2]

// Interrupteur accessible (role="switch")
function Switch({ label, help, checked, onChange }: { label: string; help: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-6 py-5">
      <div>
        <p id={`${id}-l`} className="text-[1.0625rem] font-medium text-paper">
          {label}
        </p>
        <p id={`${id}-h`} className="mt-1 text-[0.9375rem] leading-[1.5] text-mist">
          {help}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        aria-describedby={`${id}-h`}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-paper' : 'bg-paper/15 ring-1 ring-paper/40'}`}
      >
        <span className={`absolute size-6 rounded-full transition-transform ${checked ? 'translate-x-7 bg-navy' : 'translate-x-1 bg-paper'}`} />
        <span className="sr-only">{checked ? 'activé' : 'désactivé'}</span>
      </button>
    </div>
  )
}

// Réglages d'interface : utilisés à la fin du questionnaire et dans l'espace perso.
// Chaque changement s'applique immédiatement à toute la page.
export default function InterfaceControls({ value, onChange }: { value: InterfacePrefs; onChange: (patch: Partial<InterfacePrefs>) => void }) {
  return (
    <div className="divide-y divide-line">
      <fieldset className="pb-5">
        <legend className="text-[1.0625rem] font-medium text-paper">Taille du texte</legend>
        <p className="mt-1 text-[0.9375rem] text-mist">S’ajoute à la taille choisie dans votre navigateur.</p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {scales.map((s) => {
            const on = value.textScale === s
            return (
              <label
                key={s}
                className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl text-[1rem] font-medium transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                  on ? 'bg-paper text-navy' : 'text-paper ring-1 ring-paper/25 hover:ring-paper/60'
                }`}
              >
                <input type="radio" name="text-scale" className="sr-only" checked={on} onChange={() => onChange({ textScale: s })} />
                {Math.round(s * 100)} %
              </label>
            )
          })}
        </div>
      </fieldset>
      <Switch
        label="Contraste élevé"
        help="Textes en blanc pur, surfaces pleines, contours marqués."
        checked={value.contrast === 'eleve'}
        onChange={(v) => onChange({ contrast: v ? 'eleve' : 'standard' })}
      />
      <Switch label="Police très lisible" help="Atkinson Hyperlegible, pensée pour la basse vision et la dyslexie." checked={value.legibleFont} onChange={(v) => onChange({ legibleFont: v })} />
      <Switch
        label="Réduire les animations"
        help="Le ciel, les nuages et les effets restent immobiles."
        checked={value.motion === 'reduit'}
        onChange={(v) => onChange({ motion: v ? 'reduit' : 'normal' })}
      />
      <Switch label="Mode simplifié" help="Moins de décor, l’essentiel à l’écran." checked={value.simplified} onChange={(v) => onChange({ simplified: v })} />
      <Switch label="Lecture à voix haute" help="Des boutons « Écouter », et le trajet lu dès que vous ouvrez son détail." checked={value.readAloud} onChange={(v) => onChange({ readAloud: v })} />
    </div>
  )
}

import { useId } from 'react'
import { Check } from '../icons'

// Contrôles de la commande (voyageurs, options), partagés par le site et l'application
export function Stepper({ label, help, value, min = 0, max = 6, onChange }: { label: string; help?: string; value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p id={id} className="text-[1.0625rem] font-medium">
          {label}
        </p>
        {help && <p className="text-[0.9375rem] text-mist">{help}</p>}
      </div>
      <div role="group" aria-labelledby={id} className="flex items-center gap-3">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Retirer : ${label}`} className="grid size-11 place-items-center rounded-full text-[1.25rem] ring-1 ring-paper/35 disabled:opacity-35">
          −
        </button>
        <output aria-live="polite" className="w-6 text-center text-[1.125rem] font-medium">
          {value}
        </output>
        <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`Ajouter : ${label}`} className="grid size-11 place-items-center rounded-full text-[1.25rem] ring-1 ring-paper/35 disabled:opacity-35">
          +
        </button>
      </div>
    </div>
  )
}

export function CheckRow({ label, help, checked, onChange }: { label: string; help?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-4 py-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden="true" className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md ${checked ? 'bg-paper text-navy' : 'ring-2 ring-paper/35'}`}>
        {checked && <Check width={15} height={15} strokeWidth={2.8} />}
      </span>
      <span>
        <span className="block text-[1.0625rem] font-medium">{label}</span>
        {help && <span className="mt-0.5 block text-[0.9375rem] text-mist">{help}</span>}
      </span>
    </label>
  )
}


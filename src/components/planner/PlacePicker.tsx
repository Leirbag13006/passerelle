import { useEffect, useId, useRef, useState } from 'react'
import type { Place } from '../../planner/data'
import { searchAddresses, searchSuggested } from '../../planner/places'

// Champ de lieu accessible (motif ARIA « combobox » avec liste) :
// lieux suggérés instantanément + adresses réelles de la Région Sud.
export default function PlacePicker({ label, value, onChange }: { label: string; value: Place | undefined; onChange: (p: Place) => void }) {
  const id = useId()
  const [query, setQuery] = useState(value?.name ?? '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [addresses, setAddresses] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [offline, setOffline] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => setQuery(value?.name ?? ''), [value])

  // recherche d'adresses, avec un petit délai pour ne pas interroger à chaque lettre
  useEffect(() => {
    if (!open || query.trim().length < 3 || query === value?.name) {
      setAddresses([])
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        setAddresses(await searchAddresses(query, ctrl.signal))
        setOffline(false)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setOffline(true)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query, open, value])

  const suggested = searchSuggested(query === value?.name ? '' : query)
  const options = [...suggested.map((p) => ({ p, group: 'Lieux suggérés' })), ...addresses.map((p) => ({ p, group: 'Adresses' }))]
  const optId = (i: number) => `${id}-opt-${i}`

  const choose = (p: Place) => {
    onChange(p)
    setQuery(p.name)
    setOpen(false)
  }

  return (
    <div
      ref={boxRef}
      className="relative"
      onBlur={(e) => {
        if (!boxRef.current?.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <label htmlFor={id} className="text-[1rem] font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && options[active] ? optId(active) : undefined}
        autoComplete="off"
        value={query}
        placeholder="Lieu, gare ou adresse"
        onFocus={(e) => {
          setOpen(true)
          e.target.select()
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActive((a) => Math.min(options.length - 1, a + 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(0, a - 1))
          } else if (e.key === 'Enter' && open && options[active]) {
            e.preventDefault()
            choose(options[active].p)
          } else if (e.key === 'Escape') {
            setOpen(false)
            setQuery(value?.name ?? '')
          }
        }}
        className="mt-2 block min-h-14 w-full rounded-2xl bg-navy px-4 text-[1.0625rem] text-paper ring-1 ring-paper/30 placeholder:text-paper/45 focus:ring-2 focus:ring-accent focus:outline-none"
      />
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-[360px] overflow-auto rounded-2xl bg-navy-3 p-2 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.7)] ring-1 ring-paper/25">
          <ul id={`${id}-list`} role="listbox" aria-label={label}>
            {options.map((o, i) => (
              <li key={`${o.group}-${o.p.name}-${i}`} role="presentation">
                {(i === 0 || options[i - 1].group !== o.group) && (
                  <p aria-hidden="true" className="px-3 pt-2 pb-1 font-mono text-[0.6875rem] tracking-[0.14em] text-paper/55 uppercase">
                    {o.group}
                  </p>
                )}
                <div
                  id={optId(i)}
                  role="option"
                  aria-selected={i === active}
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o.p)}
                  onMouseEnter={() => setActive(i)}
                  className={`cursor-pointer rounded-xl px-3 py-2.5 ${i === active ? 'bg-paper text-navy' : ''}`}
                >
                  <span className="block text-[1rem] font-medium">{o.p.name}</span>
                  {o.p.city && o.group === 'Lieux suggérés' && <span className={`block text-[0.875rem] ${i === active ? 'text-navy/70' : 'text-mist'}`}>{o.p.city}</span>}
                </div>
              </li>
            ))}
          </ul>
          <p className="px-3 py-2 text-[0.8125rem] text-mist" role="status">
            {loading ? 'Recherche d’adresses…' : offline ? 'Recherche d’adresses indisponible (hors ligne)' : query.trim().length < 3 ? 'Tapez au moins 3 lettres pour chercher une adresse' : options.length ? '' : 'Aucun résultat en Région Sud'}
          </p>
        </div>
      )}
    </div>
  )
}

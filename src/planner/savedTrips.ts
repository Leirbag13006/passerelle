import { useCallback, useEffect, useState } from 'react'

// Trajets « compostés » (enregistrés) : stockés sur l'appareil, comme le profil
export type SavedTrip = { id: string; from: string; to: string; fromName: string; toName: string; summary: string; savedAt: string }

const KEY = 'passerelle:trajets'
const EVENT = 'passerelle:trajets'

function read(): SavedTrip[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedTrip[]
  } catch {
    return []
  }
}
function write(list: SavedTrip[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // stockage indisponible : tant pis, le trajet reste affiché
  }
  window.dispatchEvent(new Event(EVENT))
}

export function useSavedTrips() {
  const [trips, setTrips] = useState<SavedTrip[]>(read)
  useEffect(() => {
    const sync = () => setTrips(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  const save = useCallback((t: Omit<SavedTrip, 'savedAt'>) => write([{ ...t, savedAt: new Date().toISOString() }, ...read().filter((x) => x.id !== t.id)].slice(0, 12)), [])
  const remove = useCallback((id: string) => write(read().filter((x) => x.id !== id)), [])
  const clear = useCallback(() => write([]), [])
  return { trips, save, remove, clear }
}

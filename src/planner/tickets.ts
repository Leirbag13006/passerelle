import { useCallback, useEffect, useState } from 'react'
import type { Itinerary } from './engine'
import type { Options, Passengers } from './pricing'

// Billets émis (démonstration) : stockés sur l'appareil, comme le profil
export type TicketStatus = 'valide' | 'annule' | 'echange'

export type IssuedTicket = {
  code: string
  issuedAt: string
  /** date du voyage, lisible (« jeudi 30 octobre ») et au format AAAA-MM-JJ */
  date: string
  isoDate?: string
  status?: TicketStatus
  /** billet d'origine (échange) ou de remplacement */
  replaces?: string
  replacedBy?: string
  from: string
  to: string
  fromName: string
  toName: string
  it: Itinerary
  passengers: Passengers
  options: Options
  total: number
}

const KEY = 'passerelle:billets'
const EVENT = 'passerelle:billets'

const read = (): IssuedTicket[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as IssuedTicket[]
  } catch {
    return []
  }
}
const write = (list: IssuedTicket[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // stockage indisponible
  }
  window.dispatchEvent(new Event(EVENT))
}

// code lisible à voix haute : pas de 0/O ni de 1/I
export function ticketCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = () => Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join('')
  return `PSR-${part()}-${part()}`
}

export function useTickets() {
  const [tickets, setTickets] = useState<IssuedTicket[]>(read)
  useEffect(() => {
    const sync = () => setTickets(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  const add = useCallback((t: IssuedTicket) => write([t, ...read()]), [])
  const remove = useCallback((code: string) => write(read().filter((t) => t.code !== code)), [])
  const update = useCallback((code: string, patch: Partial<IssuedTicket>) => write(read().map((t) => (t.code === code ? { ...t, ...patch } : t))), [])
  const clear = useCallback(() => write([]), [])
  return { tickets, add, remove, update, clear }
}

/** date lisible à partir de AAAA-MM-JJ */
export const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
/** « samedi 31 octobre » → « Samedi 31 octobre » */
export const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

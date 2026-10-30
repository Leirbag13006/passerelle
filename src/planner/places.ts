import { placeById, places, type Place } from './data'

// Lieux : soit un lieu suggéré (identifiant), soit une adresse réelle géocodée.
// Dans l'URL : « vieux-port » ou « adr~43.29~5.37~12 rue de Rome, Marseille ».

export const encodePlace = (p: Place) => (p.id.startsWith('adr') ? `adr~${p.lat.toFixed(5)}~${p.lon.toFixed(5)}~${p.name}` : p.id)

export function decodePlace(v: string | null): Place | undefined {
  if (!v) return undefined
  if (!v.startsWith('adr~')) return placeById.get(v)
  const [, lat, lon, ...name] = v.split('~')
  const p = { id: 'adr', name: name.join('~'), city: '', lat: Number(lat), lon: Number(lon) }
  return Number.isFinite(p.lat) && Number.isFinite(p.lon) ? p : undefined
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

export function searchSuggested(q: string) {
  const n = norm(q.trim())
  if (!n) return places.slice(0, 8)
  return places.filter((p) => norm(`${p.name} ${p.city}`).includes(n)).slice(0, 6)
}

// Départements de la Région Sud
const REGION = ['04', '05', '06', '13', '83', '84']

type Feature = { geometry: { coordinates: [number, number] }; properties: { label: string; name: string; city: string; postcode: string } }

// Géocodage d'adresses (Géoplateforme IGN, qui reprend la Base Adresse Nationale). Public et sans clé.
export async function searchAddresses(q: string, signal: AbortSignal): Promise<Place[]> {
  if (q.trim().length < 3) return []
  const url = `https://data.geopf.fr/geocodage/search?index=address&limit=10&autocomplete=1&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const data = (await res.json()) as { features?: Feature[] }
  return (data.features ?? [])
    .filter((f) => REGION.includes(f.properties.postcode?.slice(0, 2)))
    .slice(0, 6)
    .map((f) => ({
      id: 'adr',
      name: f.properties.label,
      city: f.properties.city,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
    }))
}

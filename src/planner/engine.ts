// Moteur d'itinéraires transmodaux, calculé dans le navigateur.
// Graphe à états : « à pied à l'arrêt X » et « à bord de la ligne L (sens d) à l'arrêt i ».
// Les contraintes du profil sont de deux natures :
//  - strictes (filtrage) : sans marches, ascenseurs en service, marche maximale d'affilée,
//    modes acceptés, montée en train en fauteuil seulement là où l'assistance existe ;
//  - préférences (pondération) : correspondances, marche, attente, affluence.
import { travelNeeds } from '../profile/derive'
import type { Profile } from '../profile/types'
import { lines, links, placeById, stopById, stops, type Line, type Mode, type Place, type Stop } from './data'

export type Needs = ReturnType<typeof travelNeeds>

export type WalkLeg = { kind: 'walk'; from: string; to: string; minutes: number; meters: number; depart: number; arrive: number; notes: string[]; slope?: boolean }
export type RideLeg = {
  kind: 'ride'
  line: Line
  from: Stop
  to: Stop
  direction: string
  stopsCount: number
  depart: number
  arrive: number
  minutes: number
  wait: number
  crowd: 'faible' | 'moyenne' | 'forte'
  notes: string[]
  /** distance parcourue, pour la tarification */
  km: number
}
export type Leg = WalkLeg | RideLeg

export type Itinerary = {
  id: string
  labels: string[]
  legs: Leg[]
  depart: number
  arrive: number
  duration: number
  walkMinutes: number
  longestWalk: number
  transfers: number
  stepFree: boolean
  assistance: boolean
  warnings: string[]
  /** critères du profil assouplis faute de trajet exact */
  relaxed: string[]
}

type Weights = { transfer: number; walk: number; wait: number; crowd: number }
type Config = { speed: number; maxWalk: number; stepFree: boolean; wheelchair: boolean; modes: Set<Mode> | null; needs: Needs; avoidLines?: string[]; avoidStops?: string[] }

/** lignes ou arrêts à éviter (imprévu en cours de trajet) */
export type Avoid = { lines?: string[]; stops?: string[] }

const RAIL: Mode[] = ['ter', 'grandes-lignes']
const isRail = (l: Line) => RAIL.includes(l.mode) || l.id === 'N-AVI'

// ---------------------------------------------------------------- géométrie
function meters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const la = (a.lat * Math.PI) / 180
  const lb = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
const rideMinutes = (l: Line, a: Stop, b: Stop) => Math.max(1, (meters(a, b) * 1.25) / ((l.speed * 1000) / 60) + l.dwell)

// ---------------------------------------------------------------- profil → configuration
function configFor(profile: Profile | null): Config {
  const needs = travelNeeds(
    profile ?? {
      firstName: '',
      mobility: [],
      walkLimit: null,
      avoidStairs: false,
      vision: 'ok',
      colorBlind: false,
      hearing: 'ok',
      difficulties: [],
      companions: [],
      transports: [],
      frequency: null,
      stationAssistance: false,
    },
  )
  const m = profile?.mobility ?? []
  // vitesse de marche (km/h) selon la façon de se déplacer
  let speed = 4.5
  if (m.includes('fauteuil-electrique')) speed = 5
  else if (m.includes('fauteuil-manuel')) speed = 3.5
  else if (m.includes('canne')) speed = 3
  else if (needs.maxWalkMinutes !== null && needs.maxWalkMinutes <= 10) speed = 3.5

  const map: Partial<Record<string, Mode>> = { bus: 'bus', tram: 'tram', metro: 'metro', ter: 'ter', 'grandes-lignes': 'grandes-lignes' }
  const chosen = (profile?.transports ?? []).map((t) => map[t]).filter(Boolean) as Mode[]
  // les navettes restent toujours permises : ce sont elles qui rendent les gares accessibles
  const modes = chosen.length ? new Set<Mode>([...chosen, 'navette']) : null

  return { speed, maxWalk: needs.maxWalkMinutes ?? (needs.wheelchair ? 20 : 25), stepFree: needs.stepFree, wheelchair: needs.wheelchair, modes, needs }
}

// Bus ou car local, utilisé quand une adresse est trop loin du réseau de démo
export const LOCAL_LINE: Line = {
  id: 'LOCAL',
  mode: 'bus',
  name: 'Bus local',
  long: 'Bus ou car local (simulé)',
  stops: [],
  headway: 30,
  speed: 30,
  dwell: 0,
  bikes: 'non',
  vehicle: 'Car à plancher bas. En fauteuil : transport à la demande accessible, réservable la veille',
}

// Car régional, pour les adresses éloignées du réseau de démo (Alpes du Sud, arrière-pays…)
export const REGIONAL_CAR: Line = {
  ...LOCAL_LINE,
  id: 'CAR',
  name: 'Car régional',
  long: 'Car régional (simulé)',
  headway: 60,
  speed: 62,
  bikes: 'oui',
  vehicle: 'Autocar avec élévateur pour fauteuil, à signaler à la réservation',
}

const isPeak = (t: number) => (t >= 450 && t <= 570) || (t >= 990 && t <= 1140)

// ---------------------------------------------------------------- graphe
type Edge =
  | { to: string; cost: number; kind: 'walk'; minutes: number; meters: number; from: string; toName: string; note?: string; slope?: boolean }
  | { to: string; cost: number; kind: 'board'; line: Line; dir: 1 | -1; idx: number }
  | { to: string; cost: number; kind: 'ride'; line: Line; dir: 1 | -1; idx: number; minutes: number }
  | { to: string; cost: number; kind: 'alight'; line: Line; dir: 1 | -1; idx: number }
  | { to: string; cost: number; kind: 'feeder'; minutes: number; km: number; fromStop: Stop; toStop: Stop; line: Line }

function usable(stop: Stop, cfg: Config, line?: Line) {
  if (cfg.avoidStops?.includes(stop.id)) return false
  if (cfg.stepFree && (!stop.stepFree || stop.elevator === 'panne')) return false
  // en fauteuil, on ne monte dans un train qu'avec la rampe de l'assistance en gare
  if (cfg.wheelchair && line && RAIL.includes(line.mode) && !stop.assistance) return false
  return true
}

function buildGraph(origin: Place, dest: Place, cfg: Config, w: Weights, departAt: number) {
  const adj = new Map<string, Edge[]>()
  const add = (from: string, e: Edge) => {
    const arr = adj.get(from)
    if (arr) arr.push(e)
    else adj.set(from, [e])
  }
  const walkMin = (m: number) => (m * 1.3) / ((cfg.speed * 1000) / 60)
  const peak = isPeak(departAt)

  // départ / arrivée ↔ arrêts proches (dans la limite de marche du profil)
  for (const s of stops) {
    const dO = meters(origin, s)
    const mO = walkMin(dO)
    if (dO < 1300 && mO <= cfg.maxWalk) add('O', { to: `P:${s.id}`, cost: mO * w.walk, kind: 'walk', minutes: mO, meters: dO * 1.3, from: origin.name, toName: s.name })
    const dD = meters(s, dest)
    const mD = walkMin(dD)
    if (dD < 1300 && mD <= cfg.maxWalk) add(`P:${s.id}`, { to: 'D', cost: mD * w.walk, kind: 'walk', minutes: mD, meters: dD * 1.3, from: s.name, toName: dest.name })
  }
  // adresse loin du réseau de démo : un bus local (simulé) rejoint les arrêts les plus proches
  const asStop = (p: Place, id: string): Stop => ({ id, name: p.name, city: p.city, lat: p.lat, lon: p.lon, stepFree: true })
  const hubs = (p: Place) =>
    stops
      .filter((s) => usable(s, cfg) && meters(p, s) < 150000)
      .sort((a, b) => meters(p, a) - meters(p, b))
      .slice(0, 4)
  const feeder = (a: Stop, b: Stop) => {
    const km = (meters(a, b) * 1.3) / 1000
    const line = km > 30 ? REGIONAL_CAR : LOCAL_LINE
    return { minutes: (km / line.speed) * 60 + 4, km, line }
  }
  if (!adj.get('O')?.length) {
    const o = asStop(origin, 'adresse-depart')
    for (const s of hubs(origin)) {
      const f = feeder(o, s)
      add('O', { to: `P:${s.id}`, cost: f.minutes + (f.line.headway / 2) * w.wait + w.transfer + 10, kind: 'feeder', ...f, fromStop: o, toStop: s })
    }
  }
  if (!stops.some((s) => meters(s, dest) < 1300 && walkMin(meters(s, dest)) <= cfg.maxWalk)) {
    const d = asStop(dest, 'adresse-arrivee')
    for (const s of hubs(dest)) {
      const f = feeder(s, d)
      add(`P:${s.id}`, { to: 'D', cost: f.minutes + (f.line.headway / 2) * w.wait + w.transfer + 10, kind: 'feeder', ...f, fromStop: s, toStop: d })
    }
  }

  const dd = meters(origin, dest)
  if (walkMin(dd) <= cfg.maxWalk) add('O', { to: 'D', cost: walkMin(dd) * w.walk, kind: 'walk', minutes: walkMin(dd), meters: dd * 1.3, from: origin.name, toName: dest.name })

  // correspondances à pied entre arrêts voisins
  for (let i = 0; i < stops.length; i++)
    for (let j = i + 1; j < stops.length; j++) {
      const a = stops[i]
      const b = stops[j]
      const d = meters(a, b)
      if (d > 380) continue
      const m = Math.max(2, walkMin(d) + 1)
      add(`P:${a.id}`, { to: `P:${b.id}`, cost: m * w.walk, kind: 'walk', minutes: m, meters: d * 1.3, from: a.name, toName: b.name })
      add(`P:${b.id}`, { to: `P:${a.id}`, cost: m * w.walk, kind: 'walk', minutes: m, meters: d * 1.3, from: b.name, toName: a.name })
    }
  // cheminements particuliers (pentes, escaliers, correspondances internes)
  for (const k of links) {
    if (k.steps && cfg.stepFree) continue
    if (k.slope && (cfg.wheelchair || cfg.needs.maxWalkMinutes !== null)) continue
    const m = cfg.speed < 4 ? k.minutes * 1.35 : k.minutes
    if (m > cfg.maxWalk) continue
    const A = stopById.get(k.a)!
    const B = stopById.get(k.b)!
    const meta = { kind: 'walk' as const, minutes: m, meters: meters(A, B) * 1.3, note: k.note, slope: k.slope }
    add(`P:${A.id}`, { to: `P:${B.id}`, cost: m * w.walk, from: A.name, toName: B.name, ...meta })
    add(`P:${B.id}`, { to: `P:${A.id}`, cost: m * w.walk, from: B.name, toName: A.name, ...meta })
  }

  // lignes, dans les deux sens
  for (const l of lines) {
    if (cfg.modes && !cfg.modes.has(l.mode)) continue
    if (cfg.avoidLines?.includes(l.id)) continue
    const crowd = l.busy && peak ? w.crowd : 0
    for (const dir of [1, -1] as const) {
      const seq = dir === 1 ? l.stops : [...l.stops].reverse()
      const node = (i: number) => `L:${l.id}:${dir}:${i}`
      seq.forEach((sid, i) => {
        const s = stopById.get(sid)!
        if (!usable(s, cfg, l)) return
        if (i < seq.length - 1) add(`P:${sid}`, { to: node(i), cost: (l.headway / 2) * w.wait + w.transfer, kind: 'board', line: l, dir, idx: i })
        if (i > 0) add(node(i), { to: `P:${sid}`, cost: 0, kind: 'alight', line: l, dir, idx: i })
      })
      for (let i = 0; i < seq.length - 1; i++) {
        const m = rideMinutes(l, stopById.get(seq[i])!, stopById.get(seq[i + 1])!)
        add(node(i), { to: node(i + 1), cost: m * (1 + crowd), kind: 'ride', line: l, dir, idx: i, minutes: m })
      }
    }
  }
  return adj
}

function shortest(adj: Map<string, Edge[]>) {
  const dist = new Map<string, number>([['O', 0]])
  const prev = new Map<string, { from: string; edge: Edge }>()
  const queue: [number, string][] = [[0, 'O']]
  const done = new Set<string>()
  while (queue.length) {
    queue.sort((a, b) => a[0] - b[0])
    const [d, u] = queue.shift()!
    if (done.has(u)) continue
    done.add(u)
    if (u === 'D') break
    for (const e of adj.get(u) ?? []) {
      const nd = d + e.cost
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd)
        prev.set(e.to, { from: u, edge: e })
        queue.push([nd, e.to])
      }
    }
  }
  if (!prev.has('D')) return null
  const path: Edge[] = []
  let cur = 'D'
  while (cur !== 'O') {
    const p = prev.get(cur)!
    path.unshift(p.edge)
    cur = p.from
  }
  return path
}

// ---------------------------------------------------------------- chemin → itinéraire horaire
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

function toItinerary(path: Edge[], cfg: Config, departAt: number): Itinerary {
  const n = cfg.needs
  const legs: Leg[] = []
  let t = departAt
  let i = 0
  while (i < path.length) {
    const e = path[i]
    if (e.kind === 'walk') {
      // marches consécutives fusionnées
      let minutes = 0
      let m = 0
      const notes: string[] = []
      let slope = false
      const from = e.from
      let toName = e.toName
      while (i < path.length && path[i].kind === 'walk') {
        const x = path[i] as Extract<Edge, { kind: 'walk' }>
        minutes += x.minutes
        m += x.meters
        toName = x.toName
        if (x.note) notes.push(x.note)
        if (x.slope) slope = true
        i++
      }
      if (n.stepFree) notes.push('Cheminement sans marche, trottoirs abaissés')
      if (n.audioGuidance) notes.push('Guidage vocal pas à pas disponible')
      minutes = Math.round(minutes)
      // le lieu est au pied de l'arrêt : pas d'étape « à pied 0 min »
      if (minutes > 0) legs.push({ kind: 'walk', from, to: toName, minutes, meters: Math.round(m / 10) * 10, depart: t, arrive: t + minutes, notes, slope })
      t += minutes
      continue
    }
    if (e.kind === 'feeder') {
      const l = e.line
      if (legs.some((x) => x.kind === 'ride')) t += 3
      const offset = hash(e.fromStop.id + e.toStop.id) % l.headway
      const depart = Math.ceil((t - offset) / l.headway) * l.headway + offset
      const minutes = Math.round(e.minutes)
      const notes = [`${l.long} : horaires indicatifs`]
      if (n.detailedGuidance) notes.push(`Montez à l’avant et indiquez « ${e.toStop.name} » au conducteur`)
      legs.push({ kind: 'ride', line: l, from: e.fromStop, to: e.toStop, direction: e.toStop.name, stopsCount: 1, depart, arrive: depart + minutes, minutes, wait: depart - t, crowd: 'faible', notes, km: e.km })
      t = depart + minutes
      i++
      continue
    }
    if (e.kind === 'board') {
      const l = e.line
      const seq = e.dir === 1 ? l.stops : [...l.stops].reverse()
      let j = i + 1
      let ride = 0
      while (j < path.length && path[j].kind === 'ride') {
        ride += (path[j] as Extract<Edge, { kind: 'ride' }>).minutes
        j++
      }
      const alight = path[j] as Extract<Edge, { kind: 'alight' }>
      const from = stopById.get(seq[e.idx])!
      const to = stopById.get(seq[alight.idx])!
      let km = 0
      for (let k = e.idx; k < alight.idx; k++) km += (meters(stopById.get(seq[k])!, stopById.get(seq[k + 1])!) * 1.25) / 1000
      // marge de correspondance plus confortable si le profil le demande
      if (legs.some((x) => x.kind === 'ride') && (n.fewTransfers || n.reminders || n.detailedGuidance || cfg.wheelchair)) t += 3
      const offset = hash(l.id + e.dir + from.id) % l.headway
      const depart = Math.ceil((t - offset) / l.headway) * l.headway + offset
      const minutes = Math.round(ride)
      const peak = isPeak(depart)
      const crowd: RideLeg['crowd'] = l.busy && peak ? 'forte' : l.busy ? 'moyenne' : 'faible'

      const notes: string[] = []
      const direction = stopById.get(seq[seq.length - 1])!.name
      // guidage détaillé : tout ce qu'un habitué sait déjà
      if (n.detailedGuidance) {
        if (l.mode === 'metro' || l.mode === 'tram') notes.push(`Suivez les panneaux « ${l.name} direction ${direction} » ; validez votre titre avant le quai`)
        else if (l.mode === 'bus' || l.mode === 'navette') notes.push(`Montez à l’avant et validez ; le bus affiche « ${direction} »`)
        else notes.push(`Quai affiché 20 min avant le départ sur les écrans (direction ${direction}) ; compostez si votre billet est papier`)
        notes.push(`Descendez à ${to.name} après ${alight.idx - e.idx} arrêt${alight.idx - e.idx > 1 ? 's' : ''}`)
      }
      if (cfg.stepFree) {
        for (const s of [from, to]) if (s.elevator === 'ok') notes.push(`Ascenseur en service à ${s.name}`)
      }
      if (isRail(l) && RAIL.includes(l.mode)) {
        if (cfg.wheelchair) notes.push(`Assistance Accès Plus indispensable (rampe) à ${from.name} et ${to.name} : à réserver 48 h avant`)
        else if (n.stationAssistance && (from.assistance || to.assistance))
          notes.push(`Assistance proposée${from.assistance ? ` à ${from.name}` : ''}${to.assistance ? `${from.assistance ? ' et' : ''} à ${to.name}` : ''} : point d’accueil 30 min avant le départ`)
        if (l.mode === 'grandes-lignes') notes.push('Réservation obligatoire')
      }
      if (n.assistanceDog) notes.push('Chien d’assistance accepté gratuitement à bord, sans muselière')
      if (n.deaf && isRail(l) && RAIL.includes(l.mode) && (cfg.wheelchair || n.stationAssistance)) notes.push('Surdité signalée à l’assistance : les agents échangeront par écrit')
      if (n.reminders) notes.push(`Rappel un arrêt avant ${to.name}`)
      if (n.visualAlerts) notes.push('Annonces et changements de quai affichés en texte')
      if (n.audioGuidance && (l.mode === 'metro' || l.mode === 'tram')) notes.push('Montez en tête : la sortie la plus proche vous sera annoncée')
      if (n.bike) notes.push(l.bikes === 'oui' ? 'Vélo accepté à bord' : l.bikes === 'reservation' ? 'Vélo : réservation obligatoire' : 'Vélo non admis à bord')
      if (crowd === 'forte' && n.calmRoutes) notes.push('Affluence forte à cette heure : un départ 30 min plus tard sera plus calme')

      legs.push({
        kind: 'ride',
        line: l,
        from,
        to,
        direction,
        stopsCount: alight.idx - e.idx,
        depart,
        arrive: depart + minutes,
        minutes,
        wait: depart - t,
        crowd,
        notes,
        km,
      })
      t = depart + minutes
      i = j + 1
      continue
    }
    i++
  }

  const rides = legs.filter((l): l is RideLeg => l.kind === 'ride')
  const walks = legs.filter((l): l is WalkLeg => l.kind === 'walk')
  const usedStops = rides.flatMap((r) => [r.from, r.to])
  const warnings: string[] = []
  if (!cfg.stepFree) for (const s of usedStops) if (s.note && (!s.stepFree || s.elevator === 'panne')) warnings.push(`${s.name} : ${s.note}`)
  if (n.calmRoutes && rides.some((r) => r.crowd === 'forte')) warnings.push('Heure de pointe : affluence forte sur une partie du trajet')
  const assistance = cfg.wheelchair && rides.some((r) => RAIL.includes(r.line.mode))
  const depart = departAt
  const arrive = legs[legs.length - 1]?.arrive ?? departAt

  return {
    id: rides.map((r) => `${r.line.id}:${r.from.id}>${r.to.id}`).join('|') || 'marche',
    labels: [],
    legs,
    depart,
    arrive,
    duration: arrive - depart,
    walkMinutes: walks.reduce((s, w) => s + w.minutes, 0),
    longestWalk: Math.max(0, ...walks.map((w) => w.minutes)),
    transfers: Math.max(0, rides.length - 1),
    stepFree: usedStops.every((s) => s.stepFree && s.elevator !== 'panne') && !walks.some((w) => w.slope),
    assistance,
    warnings: [...new Set(warnings)],
    relaxed: [],
  }
}

// ---------------------------------------------------------------- API
function run(origin: Place, dest: Place, departAt: number, cfg: Config, hasProfile: boolean): Itinerary[] {
  const n = cfg.needs
  const variants: { label: string; w: Weights }[] = [
    {
      label: hasProfile ? 'Recommandé pour vous' : 'Recommandé',
      w: { transfer: n.fewTransfers ? 14 : 5, walk: cfg.speed < 4 ? 2 : 1.3, wait: 1.2, crowd: n.calmRoutes ? 0.6 : 0.1 },
    },
    { label: 'Le plus rapide', w: { transfer: 2, walk: 1, wait: 1, crowd: 0 } },
    { label: 'Le moins de correspondances', w: { transfer: 35, walk: 1.4, wait: 1, crowd: 0.1 } },
  ]
  const out: Itinerary[] = []
  for (const v of variants) {
    const path = shortest(buildGraph(origin, dest, cfg, v.w, departAt))
    if (!path) continue
    // départ le plus tardif possible pour la même heure d'arrivée : on n'attend pas 2 h en gare
    const base = toItinerary(path, cfg, departAt)
    let later = 0
    for (let d = 1; d <= 240; d++) {
      if (toItinerary(path, cfg, departAt + d).arrive !== base.arrive) break
      later = d
    }
    const margin = n.detailedGuidance || cfg.wheelchair ? 5 : 2
    const it = toItinerary(path, cfg, departAt + Math.max(0, later - margin))
    const same = out.find((o) => o.id === it.id)
    if (same) same.labels.push(v.label)
    else out.push({ ...it, labels: [v.label] })
  }
  // on écarte une alternative qui n'apporte rien : plus longue, autant de correspondances et plus de marche
  return out.filter(
    (it, i) => i === 0 || !out.some((o) => o !== it && o.duration <= it.duration && o.transfers <= it.transfers && o.walkMinutes <= it.walkMinutes),
  )
}

export function plan(origin: Place | undefined, dest: Place | undefined, departAt: number, profile: Profile | null, avoid?: Avoid): Itinerary[] {
  if (!origin || !dest || (origin.lat === dest.lat && origin.lon === dest.lon)) return []
  const cfg: Config = { ...configFor(profile), avoidLines: avoid?.lines, avoidStops: avoid?.stops }
  const exact = run(origin, dest, departAt, cfg, !!profile)
  if (exact.length) return exact

  // Aucun trajet exact : on assouplit, une préférence après l'autre, en le disant clairement.
  // L'accès sans marche n'est jamais levé pour une personne en fauteuil.
  const steps: { why: string; apply: (c: Config) => Config; when: (c: Config) => boolean }[] = [
    { why: 'Inclut des transports que vous n’avez pas cochés', when: (c) => !!c.modes, apply: (c) => ({ ...c, modes: null }) },
    {
      why: `Demande un peu plus de marche que votre limite (${cfg.maxWalk} min)`,
      when: (c) => c.maxWalk < 25,
      apply: (c) => ({ ...c, maxWalk: Math.max(15, Math.round(c.maxWalk * 1.8)) }),
    },
    { why: 'Comporte des escaliers', when: (c) => c.stepFree && !c.wheelchair, apply: (c) => ({ ...c, stepFree: false }) },
  ]
  let relaxedCfg = cfg
  const reasons: string[] = []
  for (const st of steps) {
    if (!st.when(relaxedCfg)) continue
    relaxedCfg = st.apply(relaxedCfg)
    reasons.push(st.why)
    const res = run(origin, dest, departAt, relaxedCfg, !!profile)
    if (res.length) return res.map((it) => ({ ...it, labels: ['Le plus proche de vos besoins', ...it.labels.slice(1)], relaxed: [...reasons] }))
  }
  return []
}

export const placeFor = (id: string) => placeById.get(id)

export const fmtTime = (m: number) => {
  const h = Math.floor(m / 60) % 24
  const mm = Math.round(m % 60)
  return `${h} h ${String(mm).padStart(2, '0')}`
}
export const fmtDuration = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`)

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { reducedMotion } from '../../lib/a11y'

// Le trajet qui relie toutes les sections : il prolonge la traînée du hero.
// Chaque tronçon a le motif de son mode (comme dans le ciel) : pointillés à pied,
// tirets à vélo, tirets longs en bus, trait plein en train, jusqu'au dernier arrêt.
// Il se dessine au défilement ; les arrêts ([data-stop]) s'allument au passage de la tête.
const SEGMENTS = [
  { label: 'À pied', dash: '0.1 9', width: 3 },
  { label: 'À vélo', dash: '12 9', width: 2 },
  { label: 'En bus', dash: '28 9', width: 2 },
  { label: 'En train', dash: undefined, width: 2 },
  { label: '', dash: undefined, width: 2 },
  { label: '', dash: undefined, width: 2 },
]

type Seg = { d: string; dash?: string; width: number; label: string; mid: { x: number; y: number } }
type Geom = { w: number; h: number; segs: Seg[]; stopYs: number[]; end: { x: number; y: number } }

export default function Route({ container }: { container: RefObject<HTMLElement | null> }) {
  const [enabled, setEnabled] = useState(false)
  const [geom, setGeom] = useState<Geom | null>(null)
  const clipRef = useRef<SVGRectElement>(null)
  const headRef = useRef<SVGGElement>(null)
  const landRef = useRef<SVGGElement>(null)
  const pathRefs = useRef<(SVGPathElement | null)[]>([])
  const samples = useRef<{ x: number; y: number }[]>([])

  // grand écran uniquement : en dessous, les arrêts restent en ligne avec le texte
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setEnabled(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const measure = useCallback(() => {
    const wrap = container.current
    if (!wrap) return
    const box = wrap.getBoundingClientRect()
    const stops = [...wrap.querySelectorAll<HTMLElement>('[data-stop]')]
    if (!stops.length) return
    const center = (el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 }
    }
    const pts = stops.map(center)
    const all = [{ x: pts[0].x, y: 0 }, ...pts]
    // le tracé passe au-dessus du contenu : on l'interrompt au bord des pastilles
    const R = 27
    const segs: Seg[] = []
    for (let i = 0; i < all.length - 1; i++) {
      const a = { x: all[i].x, y: all[i].y + (i > 0 ? R : 0) }
      const b = { x: all[i + 1].x, y: all[i + 1].y - R }
      const dy = b.y - a.y
      const spec = SEGMENTS[Math.min(i, SEGMENTS.length - 1)]
      // léger méandre entre deux arrêts
      const off = (i % 2 ? 1 : -1) * 26
      const d = `M${a.x} ${a.y} C${a.x + off} ${a.y + dy * 0.35} ${b.x + off} ${b.y - dy * 0.35} ${b.x} ${b.y}`
      segs.push({ d, dash: spec.dash, width: spec.width, label: spec.label, mid: { x: (a.x + b.x) / 2 + off * 0.75, y: (a.y + b.y) / 2 } })
    }
    setGeom({ w: box.width, h: box.height, segs, stopYs: pts.map((p) => p.y), end: pts[pts.length - 1] })
  }, [container])

  // mesures : au montage, au redimensionnement du contenu, après chargement des polices
  useEffect(() => {
    const wrap = container.current
    if (!wrap) return
    const stops = [...wrap.querySelectorAll<HTMLElement>('[data-stop]')]
    if (!enabled) {
      // petit écran : pas de rail, les arrêts sont simplement dorés
      stops.forEach((s) => (s.dataset.reached = 'true'))
      setGeom(null)
      return
    }
    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(wrap)
    document.fonts?.ready.then(measure)
    window.addEventListener('load', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('load', measure)
    }
  }, [container, enabled, measure])

  // échantillonne le tracé pour placer la tête à n'importe quelle hauteur
  useLayoutEffect(() => {
    if (!geom) return
    const pts: { x: number; y: number }[] = []
    pathRefs.current.forEach((p) => {
      if (!p) return
      const len = p.getTotalLength()
      for (let l = 0; l <= len; l += 4) {
        const q = p.getPointAtLength(l)
        pts.push({ x: q.x, y: q.y })
      }
    })
    samples.current = pts
  }, [geom])

  // défilement : révèle le tracé, déplace la tête, allume les arrêts
  useEffect(() => {
    const wrap = container.current
    if (!geom || !wrap) return
    const stops = [...wrap.querySelectorAll<HTMLElement>('[data-stop]')]
    const reduce = reducedMotion()
    let raf = 0
    const update = () => {
      raf = 0
      const reveal = reduce ? geom.h : Math.max(0, Math.min(geom.h, window.innerHeight * 0.62 - wrap.getBoundingClientRect().top))
      clipRef.current?.setAttribute('height', String(reveal))
      stops.forEach((s, i) => (s.dataset.reached = reveal >= geom.stopYs[i] ? 'true' : 'false'))
      const landed = reveal >= geom.end.y
      landRef.current?.setAttribute('opacity', landed ? '1' : '0')
      const head = headRef.current
      if (!head) return
      const pt = samples.current.find((p) => p.y >= reveal)
      const show = !reduce && !landed && reveal > 0 && pt
      head.setAttribute('opacity', show ? '1' : '0')
      if (pt) head.setAttribute('transform', `translate(${pt.x} ${pt.y})`)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [container, geom])

  if (!enabled || !geom) return null

  return (
    <svg aria-hidden="true" className="decor pointer-events-none absolute inset-0 z-[2]" width={geom.w} height={geom.h} viewBox={`0 0 ${geom.w} ${geom.h}`}>
      <defs>
        <clipPath id="route-reveal">
          <rect ref={clipRef} x="0" y="0" width={geom.w} height="0" />
        </clipPath>
        <filter id="route-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <radialGradient id="route-halo">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#ecd4ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ecd4ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* tracé à venir, très discret */}
      <g fill="none" stroke="#f7f9fa" strokeOpacity="0.12" strokeLinecap="round">
        {geom.segs.map((s, i) => (
          <path key={i} d={s.d} strokeWidth={s.width} strokeDasharray={s.dash} />
        ))}
      </g>

      {/* tracé parcouru */}
      <g clipPath="url(#route-reveal)" fill="none" strokeLinecap="round">
        <g stroke="#ecd4ff" strokeOpacity="0.45" filter="url(#route-glow)">
          {geom.segs.map((s, i) => (
            <path key={i} d={s.d} strokeWidth={s.width + 2} strokeDasharray={s.dash} />
          ))}
        </g>
        <g stroke="#ecd4ff">
          {geom.segs.map((s, i) => (
            <path key={i} ref={(el) => void (pathRefs.current[i] = el)} d={s.d} strokeWidth={s.width} strokeDasharray={s.dash} />
          ))}
        </g>
      </g>

      {/* noms des modes le long du rail */}
      <g fill="#f7f9fa" fillOpacity="0.38" fontFamily="JetBrains Mono, monospace" fontSize="11" letterSpacing="2.2" textAnchor="middle">
        {geom.segs.map((s, i) =>
          s.label ? (
            <text key={i} x={s.mid.x - 26} y={s.mid.y} transform={`rotate(-90 ${s.mid.x - 26} ${s.mid.y})`}>
              {s.label.toUpperCase()}
            </text>
          ) : null,
        )}
      </g>

      {/* tête lumineuse, comme dans le ciel du hero */}
      <g ref={headRef} opacity="0">
        <circle r="18" fill="url(#route-halo)" />
        <circle r="3.5" fill="#fff" />
      </g>

      {/* arrivée : un halo pulse autour du dernier arrêt */}
      <g ref={landRef} opacity="0" transform={`translate(${geom.end.x} ${geom.end.y})`} style={{ transition: 'opacity 600ms' }}>
        <circle r="30" fill="none" stroke="#ecd4ff" strokeOpacity="0.5">
          <animate attributeName="r" values="24;40" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.55;0" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  )
}

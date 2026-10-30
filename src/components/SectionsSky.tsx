import { useEffect, useMemo, useRef, useState } from 'react'
import { reducedMotion } from '../lib/a11y'

// Ciel des sections : prolonge le hero sous le contenu.
// - deux plans d'étoiles (tuiles générées une fois) en léger parallaxe
// - quelques étoiles qui scintillent
// (les bancs de nuages sont posés dans les sections : voir CloudBank)
// Tout est décoratif (aria-hidden) et se fige si l'utilisateur réduit les animations.

// pseudo-aléatoire déterministe : même ciel à chaque visite
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

function starTile(size: number, count: number, maxR: number, seed: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const c = document.createElement('canvas')
  c.width = c.height = size * dpr
  const g = c.getContext('2d')!
  g.scale(dpr, dpr)
  const r = rng(seed)
  for (let i = 0; i < count; i++) {
    const x = r() * size
    const y = r() * size
    const rad = 0.35 + r() ** 3 * maxR
    const a = 0.25 + r() * 0.65
    const tint = r()
    const col = tint > 0.85 ? '246,218,255' : tint > 0.6 ? '206,216,255' : '240,244,255'
    if (rad > maxR * 0.6) {
      const halo = g.createRadialGradient(x, y, 0, x, y, rad * 5)
      halo.addColorStop(0, `rgba(${col},${a * 0.35})`)
      halo.addColorStop(1, `rgba(${col},0)`)
      g.fillStyle = halo
      g.fillRect(x - rad * 5, y - rad * 5, rad * 10, rad * 10)
    }
    g.fillStyle = `rgba(${col},${a})`
    g.beginPath()
    g.arc(x, y, rad, 0, Math.PI * 2)
    g.fill()
  }
  return c.toDataURL('image/png')
}

export default function SectionsSky() {
  const [tiles, setTiles] = useState<{ far: string; near: string } | null>(null)
  const farRef = useRef<HTMLDivElement>(null)
  const nearRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTiles({ far: starTile(640, 90, 0.9, 11), near: starTile(1100, 34, 1.6, 29) })
  }, [])

  // parallaxe : les plans glissent un peu moins vite que la page (transform uniquement)
  useEffect(() => {
    if (reducedMotion()) return
    let raf = 0
    const update = () => {
      raf = 0
      const y = window.scrollY
      if (farRef.current) farRef.current.style.transform = `translate3d(0, ${y * 0.06}px, 0)`
      if (nearRef.current) nearRef.current.style.transform = `translate3d(0, ${y * 0.12}px, 0)`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [tiles])

  // étoiles qui scintillent, placées une fois pour toutes
  const twinkles = useMemo(() => {
    const r = rng(7)
    return Array.from({ length: 38 }, () => ({
      left: `${r() * 100}%`,
      top: `${3 + r() * 94}%`,
      size: 1.5 + r() * 1.8,
      delay: `${-r() * 6}s`,
      dur: `${3 + r() * 4}s`,
    }))
  }, [])

  return (
    <div aria-hidden="true" className="decor pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(180deg,transparent_0,#000_280px)]">
      {tiles && (
        <>
          {/* plus haut que le conteneur : la marge absorbe le parallaxe */}
          <div ref={farRef} className="absolute inset-x-0 top-[-900px] bottom-0 opacity-70 will-change-transform" style={{ backgroundImage: `url(${tiles.far})`, backgroundSize: '640px' }} />
          <div ref={nearRef} className="absolute inset-x-0 top-[-1600px] bottom-0 opacity-80 will-change-transform" style={{ backgroundImage: `url(${tiles.near})`, backgroundSize: '1100px', backgroundPosition: '310px 170px' }} />
        </>
      )}

      {twinkles.map((t, i) => (
        <span
          key={i}
          className="twinkle absolute rounded-full bg-paper"
          style={{ left: t.left, top: t.top, width: t.size, height: t.size, animationDelay: t.delay, animationDuration: t.dur, boxShadow: '0 0 6px 1px rgb(220 228 255 / 0.55)' }}
        />
      ))}

    </div>
  )
}

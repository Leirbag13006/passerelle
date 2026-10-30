import type { CSSProperties } from 'react'

// Banc de nuages (rendu Blender du hero, recoloré) posé dans une section, collé au bord de l'écran.
// La section parente doit être `relative` ; le conteneur de page coupe le débordement horizontal.
export default function CloudBank({
  bank,
  side,
  top,
  bottom,
  width = 'min(48rem, 60vw)',
  opacity = 0.85,
  flip = false,
  duration = 52,
}: {
  bank: 'left' | 'right'
  side: 'left' | 'right'
  top?: string
  bottom?: string
  width?: string
  opacity?: number
  flip?: boolean
  duration?: number
}) {
  const style: CSSProperties = {
    // depuis une section centrée, on rejoint le bord de la fenêtre
    [side]: 'calc(50% - 50vw - 3rem)',
    top,
    bottom,
    width,
    opacity,
    ['--flip' as string]: flip ? -1 : 1,
    animationDuration: `${duration}s`,
  }
  return (
    <img
      src={bank === 'left' ? '/cloud-bank-left.png' : '/cloud-bank-right.png'}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className="decor drift pointer-events-none absolute -z-10 max-w-none select-none"
      style={style}
    />
  )
}

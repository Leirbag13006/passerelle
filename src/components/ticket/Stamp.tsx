import { useId } from 'react'

// Tampon de compostage doré, à l'encre légèrement irrégulière.
// Décoratif : l'information équivalente doit exister en texte ailleurs.
export default function Stamp({ text, word, size = 84 }: { text: string; word: string; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const ring = `ring-${uid}`
  const ink = `ink-${uid}`
  // texte répété pour faire le tour complet du cercle
  const around = `${text} · ${text} · `

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 120 120" className="stamp text-accent">
      <defs>
        <path id={ring} d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
        <filter id={ink} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feComponentTransfer in="n" result="speck">
            <feFuncA type="discrete" tableValues="1 1 1 0.35 1 1 1 1" />
          </feComponentTransfer>
          <feComposite in="d" in2="speck" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${ink})`} fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="56" strokeWidth="3" />
        <circle cx="60" cy="60" r="35" strokeWidth="1.5" />
        <text fill="currentColor" stroke="none" fontFamily="JetBrains Mono, monospace" fontSize="10.5" letterSpacing="1.6" fontWeight="500">
          <textPath href={`#${ring}`} startOffset="0">
            {around}
          </textPath>
        </text>
        <path d="M46 59l9 9 18-19" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="60" y="84" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="1.2" fontWeight="500">
          {word}
        </text>
      </g>
    </svg>
  )
}

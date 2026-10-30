import type { SVGProps } from 'react'

// Pictos de modes, en trait fin #f7f9fa comme dans la fiche de style
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export const Walk = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="13" cy="4" r="1.6" />
    <path d="M10 21l2.2-6.2L14.5 17v4M9 11l2.6-3.6h2.2l2.2 3.2 2 1M11.6 7.4L10.8 13l1.4 1.8" />
  </svg>
)

export const Wheelchair = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="10" cy="3.8" r="1.6" />
    <path d="M10 7v6h5.5l2 5.5H20M10 10h4.5" />
    <path d="M7.4 11.2a5.5 5.5 0 1 0 7.8 6.3" />
  </svg>
)

export const Bike = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="5.5" cy="16.5" r="3.5" />
    <circle cx="18.5" cy="16.5" r="3.5" />
    <path d="M5.5 16.5L9 9h6.5l3 7.5M9 9l3 7.5h-6.5M12 6h2.5M15.5 9l-1-3" />
  </svg>
)

export const Bus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="4.5" y="3" width="15" height="15" rx="3" />
    <path d="M4.5 11h15M7.5 21v-3M16.5 21v-3M8 14.5h.01M16 14.5h.01" />
  </svg>
)

export const Train = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M8 3h8a3 3 0 0 1 3 3v7.5a3.5 3.5 0 0 1-3.5 3.5h-7A3.5 3.5 0 0 1 5 13.5V6a3 3 0 0 1 3-3zM5 10h14M12 3v7M8 20l2-3M16 20l-2-3M6.5 20h11M9 13.5h.01M15 13.5h.01" />
  </svg>
)

export const Arrow = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
)

export const Spark = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
  </svg>
)

export const Eye = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const Ear = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M7 9a5 5 0 0 1 10 0c0 3-2.5 4-3.2 5.6-.6 1.5-.8 2.6-1.8 3.6A2.6 2.6 0 0 1 7.5 17" />
    <path d="M10 9.5a2 2 0 0 1 4 0c0 1.3-1.3 1.6-1.3 3" />
  </svg>
)

export const Stroller = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3 4h2l1.2 3M6.2 7H20a7 7 0 0 1-7 7h-3.5a3.3 3.3 0 0 1-3.3-3.3V7zM13 7V3.5A7 7 0 0 1 20 7" />
    <circle cx="8" cy="19" r="2" />
    <circle cx="17" cy="19" r="2" />
  </svg>
)

export const Calm = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </svg>
)

export const Cane = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="4" r="1.6" />
    <path d="M8 21l2-6 2.5 2v4M8.5 11.5l1.8-4h2.2l2 3 2 .5M10.3 7.5L9.6 13l1.4 1.8M17 10.5V21" />
  </svg>
)

export const Clock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const Check = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

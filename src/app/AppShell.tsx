import { useEffect, useRef, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { Home, Search, TicketIcon, User } from '../components/icons'
import { useTickets } from '../planner/tickets'

const tabs = [
  { to: '/app', label: 'Accueil', Icon: Home, end: true },
  { to: '/app/trajets', label: 'Trajets', Icon: Search, end: false },
  { to: '/app/billets', label: 'Billets', Icon: TicketIcon, end: false },
  { to: '/app/profil', label: 'Profil', Icon: User, end: true },
]

// Application mobile : affichée dans la maquette de téléphone de la page de démo (iframe sur /app).
// Ouverte directement sur un ordinateur, on renvoie vers cette page.
export default function AppShell() {
  const framed = window.self !== window.top
  const desktop = window.matchMedia('(min-width: 768px)').matches
  if (desktop && !framed) return <Navigate to="/application" replace />
  return <MobileApp />
}

function MobileApp() {
  const { pathname } = useLocation()
  const scroller = useRef<HTMLDivElement>(null)
  const { tickets } = useTickets()
  const valid = tickets.filter((t) => (t.status ?? 'valide') === 'valide').length
  // écrans plein cadre, sans barre d'onglets
  const immersive = pathname.startsWith('/app/en-route') || pathname.startsWith('/app/profil/creer')

  // accolades obligatoires : scrollTo() renvoie une promesse dans les navigateurs récents
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    // le « transform » rend les éléments position:fixed (fond du questionnaire…) relatifs à l'app
    <div className="relative flex h-svh w-full flex-col overflow-hidden bg-navy text-paper" style={{ transform: 'translateZ(0)' }}>
      <div ref={scroller} className="flex-1 overflow-x-hidden overflow-y-auto">
        <Outlet />
      </div>

      {!immersive && (
        <nav aria-label="Navigation de l’application" className="border-t border-line bg-navy/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <ul className="grid grid-cols-4">
            {tabs.map(({ to, label, Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => `relative flex min-h-16 flex-col items-center justify-center gap-1 text-[0.75rem] ${isActive ? 'font-semibold text-paper' : 'text-mist'}`}
                >
                  {({ isActive }) => (
                    <>
                      <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${isActive ? 'bg-accent text-navy' : ''}`}>
                        <Icon width={21} height={21} />
                      </span>
                      {label}
                      {label === 'Billets' && valid > 0 && (
                        <span className="absolute top-1.5 right-[22%] grid min-w-5 place-items-center rounded-full bg-[#ffb4c4] px-1 text-[0.6875rem] font-bold text-navy" aria-label={`${valid} billet${valid > 1 ? 's' : ''} valable${valid > 1 ? 's' : ''}`}>
                          {valid}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}

// En-tête d'écran de l'application
export function AppHeader({ title, back, action }: { title: string; back?: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-navy/90 px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3 backdrop-blur">
      {back && (
        <Link to={back} className="-ml-2 grid size-11 place-items-center rounded-full text-[1.25rem] hover:bg-paper/10" aria-label="Retour">
          ←
        </Link>
      )}
      <h1 className="flex-1 truncate text-[1.375rem] font-medium tracking-[-0.02em]">{title}</h1>
      {action}
    </header>
  )
}

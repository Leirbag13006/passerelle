import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useProfile } from '../profile/ProfileContext'
import { useTickets } from '../planner/tickets'

const links = [
  { label: 'Trajets', href: '/trajets' },
  { label: 'Le concept', href: '/#concept' },
  { label: 'Pour qui ?', href: '/#pour-qui' },
  { label: 'Essayer', href: '/#demo' },
  { label: 'Accessibilité', href: '/#accessibilite' },
]

export default function Nav() {
  const { profile } = useProfile()
  const { tickets } = useTickets()
  const hasTickets = tickets.some((t) => (t.status ?? 'valide') === 'valide')
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  // sur l'accueil, la barre se densifie une fois le hero dépassé ; ailleurs elle est pleine
  const [solid, setSolid] = useState(pathname !== '/')
  useEffect(() => {
    const hero = document.getElementById('accueil')
    if (!hero) {
      setSolid(true)
      return
    }
    const onScroll = () => setSolid(hero.getBoundingClientRect().bottom <= 64)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  const cta = profile ? { to: '/espace', label: 'Mon espace' } : { to: '/profil/creer', label: 'Créer mon profil' }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-paper/15 text-paper backdrop-blur-[10px] transition-colors duration-500 ${
        solid ? 'bg-navy/85' : 'bg-[rgb(20_24_60/0.28)]'
      }`}
    >
      <nav aria-label="Navigation principale" className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-10">
        <Link to="/" className="flex items-baseline text-[1.0625rem] uppercase tracking-[0.06em]" aria-label="Passerelle, accueil">
          <span className="font-semibold">Passe</span>
          <span className="font-light">relle</span>
        </Link>

        <ul className="hidden items-center gap-9 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link to={l.href} className="py-2.5 text-[0.8125rem] uppercase tracking-[0.07em] text-paper/75 underline-offset-[6px] transition-colors hover:text-paper hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 lg:flex">
          {profile && <span className="text-[0.875rem] text-mist">{profile.firstName ? `Bonjour ${profile.firstName}` : 'Profil actif'}</span>}
          {hasTickets && (
            <Link to="/billets" className="rounded-btn border border-paper/60 px-4 py-2.5 text-[0.875rem] transition-colors hover:bg-paper hover:text-navy">
              Mes billets
            </Link>
          )}
          <Link to={cta.to} className="rounded-btn border border-paper bg-paper px-4 py-2.5 text-[0.875rem] text-navy transition-opacity hover:opacity-85">
            {cta.label}
          </Link>
        </div>

        <button
          type="button"
          className="min-h-11 px-1 font-mono text-[0.8125rem] uppercase tracking-[0.2em] lg:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((o) => !o)}
        >
          [ {open ? 'Fermer' : 'Menu'} ]
        </button>
      </nav>

      {open && (
        <ul id="menu-mobile" className="border-t border-paper/10 px-4 pt-2 pb-6 lg:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <Link to={l.href} onClick={() => setOpen(false)} className="block border-b border-paper/10 py-4 text-[0.875rem] uppercase tracking-[0.07em]">
                {l.label}
              </Link>
            </li>
          ))}
          {hasTickets && (
            <li>
              <Link to="/billets" onClick={() => setOpen(false)} className="block border-b border-paper/10 py-4 text-[0.875rem] uppercase tracking-[0.07em]">
                Mes billets
              </Link>
            </li>
          )}
          <li className="pt-5">
            <Link to={cta.to} onClick={() => setOpen(false)} className="block rounded-btn bg-paper px-4 py-3 text-center text-[0.9375rem] text-navy">
              {cta.label}
            </Link>
          </li>
        </ul>
      )}
    </header>
  )
}

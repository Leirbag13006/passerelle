import { Navigate, Route, Routes } from 'react-router'
import AppCheckout from './app/AppCheckout'
import AppHome from './app/AppHome'
import AppProfile from './app/AppProfile'
import AppShell from './app/AppShell'
import { AppTicket, AppTicketList } from './app/AppTickets'
import AppTrips from './app/AppTrips'
import AppDemo from './pages/AppDemo'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Planner from './pages/Planner'
import Space from './pages/Space'
import TicketView from './pages/TicketView'
import Tickets from './pages/Tickets'
import EnRoute from './pages/EnRoute'
import Accessibility from './pages/info/Accessibility'
import Help from './pages/info/Help'
import Legal from './pages/info/Legal'
import Privacy from './pages/info/Privacy'

export default function App() {
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-btn focus:bg-paper focus:px-4 focus:py-2 focus:text-void">
        Aller au contenu
      </a>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profil/creer" element={<Onboarding />} />
        <Route path="/espace" element={<Space />} />
        <Route path="/trajets" element={<Planner />} />
        <Route path="/billet" element={<Checkout />} />
        <Route path="/billet/:code" element={<TicketView />} />
        <Route path="/billets" element={<Tickets />} />
        <Route path="/en-route/:code" element={<EnRoute />} />
        <Route path="/accessibilite" element={<Accessibility />} />
        <Route path="/aide" element={<Help />} />
        <Route path="/confidentialite" element={<Privacy />} />
        <Route path="/mentions-legales" element={<Legal />} />
        <Route path="/application" element={<AppDemo />} />
        {/* application mobile */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<AppHome />} />
          <Route path="trajets" element={<AppTrips />} />
          <Route path="commande" element={<AppCheckout />} />
          <Route path="billets" element={<AppTicketList />} />
          <Route path="billets/:code" element={<AppTicket />} />
          <Route path="en-route/:code" element={<EnRoute basePath="/app" />} />
          <Route path="profil" element={<AppProfile />} />
          <Route path="profil/creer" element={<Onboarding returnTo="/app/profil" exitTo="/app/profil" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

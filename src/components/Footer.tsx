import { Link } from 'react-router'

const columns = [
  {
    title: 'Passerelle',
    links: [
      ['Planifier un trajet', '/trajets'],
      ['Le concept', '/#concept'],
      ['Pour qui ?', '/#pour-qui'],
      ['Créer mon profil', '/profil/creer'],
    ],
  },
  {
    title: 'Aide',
    links: [
      ['Questions fréquentes', '/aide#faq'],
      ['Nous contacter', '/aide'],
      ['Signaler un problème d’accès', '/aide#signaler'],
    ],
  },
  {
    title: 'Informations',
    links: [
      ['Déclaration d’accessibilité', '/accessibilite'],
      ['Confidentialité', '/confidentialite'],
      ['Mentions légales', '/mentions-legales'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-navy">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 py-16 md:px-10 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <p className="flex items-baseline text-[1.25rem] uppercase tracking-[0.06em] text-paper">
            <span className="font-semibold">Passe</span>
            <span className="font-light">relle</span>
          </p>
          <p className="mt-4 max-w-[34ch] text-[1rem] leading-[1.6] text-mist">La mobilité transmodale pour tous. L’esprit léger, à chaque trajet.</p>
        </div>
        <nav aria-label="Pied de page" className="grid gap-10 sm:grid-cols-3">
          {columns.map((c) => (
            <div key={c.title}>
              <h2 className="text-[0.9375rem] font-medium text-accent">{c.title}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {c.links.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="text-[1rem] text-mist underline-offset-4 hover:text-paper hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1280px] px-4 py-6 text-[0.875rem] text-mist md:px-10">© 2026 Passerelle · Projet de cours</p>
      </div>
    </footer>
  )
}

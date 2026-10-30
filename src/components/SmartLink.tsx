import type { AnchorHTMLAttributes } from 'react'
import { Link } from 'react-router'

// Lien interne (route de l'app) ou ancre classique, selon la cible
export default function SmartLink({ href = '#', ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href?: string }) {
  if (href.startsWith('/')) return <Link to={href} {...rest} />
  return <a href={href} {...rest} />
}

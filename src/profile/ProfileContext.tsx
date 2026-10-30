import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultInterface, emptyAnswers, type InterfacePrefs, type Profile } from './types'

const KEY = 'passerelle:profil'

function load(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Profile
    return p?.version === 1 ? { ...emptyAnswers, ...p, interface: { ...defaultInterface, ...p.interface } } : null
  } catch {
    return null
  }
}

function persist(p: Profile | null) {
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p))
    else localStorage.removeItem(KEY)
  } catch {
    // stockage indisponible (navigation privée…) : le profil vit le temps de la session
  }
}

// Applique les réglages d'interface à toute la page (attributs sur <html>, lus par le CSS)
export function applyInterface(prefs: InterfacePrefs) {
  const html = document.documentElement
  html.style.setProperty('--text-scale', String(prefs.textScale))
  html.dataset.contrast = prefs.contrast
  html.dataset.motion = prefs.motion
  html.dataset.simplified = String(prefs.simplified)
  html.dataset.font = prefs.legibleFont ? 'lisible' : 'standard'
  window.dispatchEvent(new Event('passerelle:interface'))
}

type Ctx = {
  profile: Profile | null
  /** réglages actuellement appliqués (ceux du profil, ou un aperçu en cours) */
  prefs: InterfacePrefs
  save: (p: Profile) => void
  updateInterface: (patch: Partial<InterfacePrefs>) => void
  /** aperçu temporaire (questionnaire) sans enregistrer */
  preview: (prefs: InterfacePrefs | null) => void
  remove: () => void
}

const ProfileCtx = createContext<Ctx | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(load)
  const [previewPrefs, setPreviewPrefs] = useState<InterfacePrefs | null>(null)
  const prefs = previewPrefs ?? profile?.interface ?? defaultInterface

  useEffect(() => applyInterface(prefs), [prefs])

  const save = useCallback((p: Profile) => {
    setProfile(p)
    setPreviewPrefs(null)
    persist(p)
  }, [])

  const updateInterface = useCallback((patch: Partial<InterfacePrefs>) => {
    setProfile((prev) => {
      if (!prev) return prev
      const next = { ...prev, updatedAt: new Date().toISOString(), interface: { ...prev.interface, ...patch } }
      persist(next)
      return next
    })
  }, [])

  const remove = useCallback(() => {
    setProfile(null)
    setPreviewPrefs(null)
    persist(null)
  }, [])

  const value = useMemo(() => ({ profile, prefs, save, updateInterface, preview: setPreviewPrefs, remove }), [profile, prefs, save, updateInterface, remove])
  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileCtx)
  if (!ctx) throw new Error('useProfile doit être utilisé dans <ProfileProvider>')
  return ctx
}

// Préférences d'accessibilité communes : réglage système OU réglage du profil Passerelle.

/** true si les animations doivent être réduites (système ou profil) */
export function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduit'
}

/** s'abonne aux changements de l'une ou l'autre source ; renvoie la fonction de désabonnement */
export function onMotionChange(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', cb)
  window.addEventListener('passerelle:interface', cb)
  return () => {
    mq.removeEventListener('change', cb)
    window.removeEventListener('passerelle:interface', cb)
  }
}

/** lecture à voix haute (synthèse vocale du navigateur), en français */
export function speak(text: string) {
  if (!('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'fr-FR'
  u.rate = 0.95
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('fr'))
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
  return true
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

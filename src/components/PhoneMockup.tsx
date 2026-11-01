import type { ReactNode } from 'react'

// Maquette de téléphone : l'écran reçoit une capture de l'app ou l'app réelle (iframe sur /app).
// Sur mobile, le téléphone laisse des marges : on doit pouvoir faire défiler la page autour.
export default function PhoneMockup({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[min(372px,78vw)]">
      {/* boutons latéraux */}
      <span aria-hidden="true" className="absolute top-[18%] -left-[3px] h-14 w-[3px] rounded-l bg-[#2a2f5c]" />
      <span aria-hidden="true" className="absolute top-[29%] -left-[3px] h-14 w-[3px] rounded-l bg-[#2a2f5c]" />
      <span aria-hidden="true" className="absolute top-[24%] -right-[3px] h-20 w-[3px] rounded-r bg-[#2a2f5c]" />

      <div className="rounded-[56px] bg-[#0c0f2c] p-[11px] shadow-[0_50px_120px_-40px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(247_249_250/0.12)]">
        <div className="relative overflow-hidden rounded-[45px] bg-navy" style={{ aspectRatio: '390 / 830' }}>
          {/* barre d'état */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between bg-navy px-7 text-[0.8125rem] font-semibold text-paper">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
                <rect x="0" y="7" width="3" height="4" rx="1" />
                <rect x="4.5" y="5" width="3" height="6" rx="1" />
                <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
                <rect x="13.5" y="0" width="3" height="11" rx="1" />
              </svg>
              <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M1 4a9.5 9.5 0 0 1 13 0M3.3 6.4a6 6 0 0 1 8.4 0M5.7 8.7a2.6 2.6 0 0 1 3.6 0" />
              </svg>
              <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
                <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.5" />
                <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
                <path d="M23 4v4" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          {/* îlot de la caméra */}
          <span aria-hidden="true" className="pointer-events-none absolute top-2.5 left-1/2 z-20 h-[26px] w-[104px] -translate-x-1/2 rounded-full bg-black" />

          <div className="absolute inset-x-0 top-11 bottom-5">{children}</div>

          {/* barre d'accueil */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 flex h-5 items-center justify-center bg-navy">
            <span className="h-[5px] w-32 rounded-full bg-paper/60" />
          </div>
        </div>
      </div>
    </div>
  )
}

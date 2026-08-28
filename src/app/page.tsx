'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { GraduationCap } from 'lucide-react'
import { Navbar } from '@/components/platform/navbar'
import { PlatformFooter } from '@/components/platform/footer'
import { MarketplaceView } from '@/components/platform/marketplace'
import { MentorProfileView } from '@/components/platform/mentor-profile'
import { MeetingRoomView } from '@/components/platform/meeting-room'
import DashboardView from '@/components/platform/dashboard'
import OnboardingView from '@/components/platform/onboarding'
import { Toaster } from '@/components/ui/sonner'
import { useAppStore } from '@/lib/store'

export default function Home() {
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)

  // Detecta montagem no cliente sem setState em effect (hidratação segura
  // com o estado persistido do zustand: no servidor, false).
  const emptySubscribe = useCallback(() => () => {}, [])
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  if (!mounted) {
    // Evita mismatch de hidratação com o estado persistido (usuário/logado)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-emerald-950 text-white">
        <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-emerald-600">
          <GraduationCap className="h-8 w-8" />
        </span>
        <p className="text-lg font-extrabold tracking-tight">
          Mentor<span className="text-emerald-300">Hub</span>
        </p>
        <p aria-hidden className="text-xs text-emerald-200/70">
          carregando sua experiência...
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <main className="flex-1" key={user?.id ?? 'guest'}>
        {view.name === 'marketplace' && <MarketplaceView />}
        {view.name === 'mentor' && <MentorProfileView mentorId={view.mentorId} />}
        {view.name === 'dashboard' && <DashboardView />}
        {view.name === 'meeting' && <MeetingRoomView bookingId={view.bookingId} />}
        {view.name === 'onboarding' && <OnboardingView />}
      </main>

      <PlatformFooter />
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}

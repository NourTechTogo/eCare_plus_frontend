import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '@/features/auth/hooks/useAuth'
import * as authService from '@/features/auth/services/authService'
import type { Session } from '@/features/auth/types/auth'
import { setUnauthorizedHandler } from '@/lib/apiClient'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(authService.restoreSession)

  const logout = useCallback(() => {
    authService.logout()
    setSession(null)
  }, [])

  // Jeton refusé par le backend : la session locale n'a plus de valeur.
  useEffect(() => {
    setUnauthorizedHandler(() => { sessionStorage.setItem('ecare.sessionExpired', 'true'); logout() })
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Fin de session à l'expiration du jeton.
  useEffect(() => {
    if (!session) return
    const timer = setTimeout(() => { sessionStorage.setItem('ecare.sessionExpired', 'true'); logout() }, new Date(session.expiresAt).getTime() - Date.now())
    return () => clearTimeout(timer)
  }, [session, logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      login: async (credentials) => setSession(await authService.login(credentials)),
      logout,
      updateUser: (user) => {
        if (!session) return
        const next = { ...session, user }
        authService.saveSession(next)
        setSession(next)
      },
    }),
    [session, logout],
  )

  return <AuthContext value={value}><div key={session?.token ?? 'anonymous'} className="contents">{children}</div></AuthContext>
}

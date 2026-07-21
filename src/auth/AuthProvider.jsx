import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AuthContext from './AuthContext'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (isActive) {
        setSession(currentSession)
        setIsLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isActive) {
        setSession(nextSession)
        setIsLoading(false)
      }
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    isLoading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
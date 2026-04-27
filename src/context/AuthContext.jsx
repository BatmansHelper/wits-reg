import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChange } from '../lib/auth'
import { getUserDoc } from '../lib/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async firebaseUser => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          const snap = await getUserDoc(firebaseUser.uid)
          if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() }
            if (!data.isActive) {
              // Inactive users are signed out
              const { signOut } = await import('../lib/auth')
              await signOut()
              setUser(null)
              setUserDoc(null)
            } else {
              setUserDoc(data)
            }
          } else {
            console.warn('[Auth] No Firestore user doc found for uid:', firebaseUser.uid)
            setUserDoc(null)
          }
        } catch (err) {
          console.error('[Auth] getUserDoc failed — code:', err.code, 'message:', err.message)
          setUserDoc(null)
        }
      } else {
        setUser(null)
        setUserDoc(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, userDoc, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}

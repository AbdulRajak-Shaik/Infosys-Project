import React, { createContext, useContext, useState, useEffect } from 'react'

type LanguageContextValue = {
  currentLanguage: string
  setLanguage: (lang: string) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('selected_language') || 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('selected_language', currentLanguage)
    } catch {}
    try {
      document.documentElement.lang = currentLanguage
      document.documentElement.dir = ['ur', 'ks', 'sd'].includes(currentLanguage) ? 'rtl' : 'ltr'
    } catch {}
  }, [currentLanguage])

  useEffect(() => {
    // Only sync from cross-tab storage events (not same-tab changes)
    const syncLanguage = () => {
      try {
        const stored = localStorage.getItem('selected_language') || 'en'
        setCurrentLanguage(prev => (prev !== stored ? stored : prev))
      } catch {}
    }
    window.addEventListener('storage', syncLanguage)
    return () => {
      window.removeEventListener('storage', syncLanguage)
    }
  }, [])

  const setLanguage = (lang: string) => {
    if (!lang || lang === currentLanguage) return
    try {
      localStorage.setItem('selected_language', lang)
    } catch {}
    // Single direct update — do NOT also dispatch 'languageChange' here;
    // that would synchronously trigger a second setCurrentLanguage call
    // before React commits this one, breaking the hooks count invariant.
    setCurrentLanguage(lang)

    // Sync preferred language to backend if logged in
    import('../services/api')
      .then(({ updateUserLanguage }) => {
        updateUserLanguage(lang).catch(err => {
          console.warn('Failed to sync language to database:', err)
        })
      })
      .catch(err => {
        console.warn('Could not load API helper for language sync:', err)
      })
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}


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
    const syncLanguage = () => {
      try {
        const stored = localStorage.getItem('selected_language') || 'en'
        setCurrentLanguage(prev => (prev !== stored ? stored : prev))
      } catch {}
    }
    window.addEventListener('storage', syncLanguage)
    window.addEventListener('languageChange', syncLanguage)
    return () => {
      window.removeEventListener('storage', syncLanguage)
      window.removeEventListener('languageChange', syncLanguage)
    }
  }, [])

  const setLanguage = (lang: string) => {
    if (!lang || lang === currentLanguage) return
    try {
      localStorage.setItem('selected_language', lang)
    } catch {}
    setCurrentLanguage(lang)
    window.dispatchEvent(new Event('languageChange'))
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


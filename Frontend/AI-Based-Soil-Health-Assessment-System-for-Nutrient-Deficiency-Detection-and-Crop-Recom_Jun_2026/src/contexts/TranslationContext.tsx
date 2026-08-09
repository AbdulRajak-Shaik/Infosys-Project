import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import i18n from '../i18n'

type TranslationsMap = Record<string, string>

interface TranslationContextValue {
  lang: string
  setLang: (l: string) => Promise<void>
  t: (key: string) => string
  translateText: (text: string) => Promise<string>
}

const TranslationContext = createContext<TranslationContextValue | null>(null)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>(() => localStorage.getItem('lang') || 'en')
  const [sarvamCache, setSarvamCache] = useState<Record<string, TranslationsMap>>({})
  const [textCache] = useState<Map<string, Record<string, string>>>(new Map())

  const prefetchTranslations = async (l: string) => {
    if (sarvamCache[l]) return
    try {
      const keys = Object.keys(i18n.getResourceBundle('en', 'translation') || {})
      if (keys.length === 0) return
      const resp = await api.post(`${import.meta.env.VITE_SARVAM_API_URL || '/api'}/translate`, {
        target: l,
        texts: keys.map(k => i18n.t(k, { lng: 'en' })),
      })
      if (resp?.data?.translations && Array.isArray(resp.data.translations)) {
        const map: TranslationsMap = {}
        keys.forEach((k, i) => {
          map[k] = resp.data.translations[i] || i18n.t(k, { lng: l })
        })
        setSarvamCache(prev => ({ ...prev, [l]: map }))
      }
    } catch (err) {
      console.warn('Sarvam translation prefetch failed, using local translations', err)
    }
  }

  useEffect(() => {
    i18n.changeLanguage(lang)
    if (lang !== 'en') {
      prefetchTranslations(lang)
    }
  }, [lang])

  const setLang = async (l: string) => {
    setLangState(l)
    localStorage.setItem('lang', l)
    await prefetchTranslations(l)
  }

  const t = (key: string) => {
    const bundle = sarvamCache[lang]
    if (bundle && bundle[key]) return bundle[key]
    // fallback to i18n bundle (already initialized)
    return i18n.t(key)
  }

  const translateText = async (text: string) => {
    if (!text) return text
    if (lang === 'en') return text
    const langCache = textCache.get(lang) || {}
    if (langCache[text]) return langCache[text]
    try {
      const resp = await api.post(`${import.meta.env.VITE_SARVAM_API_URL || '/api'}/translate`, {
        target: lang,
        texts: [text],
      })
      const translated = resp?.data?.translations?.[0] || text
      textCache.set(lang, { ...langCache, [text]: translated })
      return translated
    } catch (err) {
      console.warn('Sarvam translateText failed, returning original', err)
      return text
    }
  }

  const value = useMemo(() => ({ lang, setLang, t, translateText }), [lang])

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslate() {
  const ctx = useContext(TranslationContext)
  if (!ctx) throw new Error('useTranslate must be used within TranslationProvider')
  return ctx
}

export default TranslationContext

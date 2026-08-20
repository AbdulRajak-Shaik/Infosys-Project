import React, { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { fetchDatabaseTranslations } from './services/api'
import { useLanguage } from './contexts/LanguageContext'
import { TRANSLATIONS } from './translations/index'
import { ADMIN_TRANSLATIONS } from './translations/adminTranslations'

export type LanguageCode = string

export { TRANSLATIONS, ADMIN_TRANSLATIONS }

function unescapeUnicode(str: string): string {
  if (!str || typeof str !== 'string') return ''
  let res = str
  if (res.includes('\\u') || res.includes('\\')) {
    try {
      res = res.replace(/\\+u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      res = res.replace(/\\([^\s\w])/g, '$1')
      res = res.replace(/\\/g, '')
    } catch {
      return str
    }
  }
  return res
}

// Module-level deduplication set for dev-time missing-key logging
const missingKeys = new Map<string, number>()

export function useTranslation() {
  const { currentLanguage } = useLanguage()
  const [dbDict, setDbDict] = useState<Record<string, string>>({})

  useEffect(() => {
    let isMounted = true
    setDbDict({})
    if (currentLanguage && currentLanguage !== 'en') {
      const fetchLang = currentLanguage
      fetchDatabaseTranslations(fetchLang)
        .then(data => {
          if (isMounted && data && Object.keys(data).length > 0) {
            setDbDict(data)
          }
        })
        .catch(() => {})
    }
    return () => {
      isMounted = false
    }
  }, [currentLanguage])

  const t = (key: string): string => {
    if (!key || typeof key !== 'string') return ''
    const cleanKey = key.trim()

    let result = ''
    let found = false
    const activeDict: any = TRANSLATIONS[currentLanguage]
    const adminDict: any = ADMIN_TRANSLATIONS[currentLanguage]

    // Helper: check if value is a real translation (not a stub where value === key)
    const isRealTranslation = (val: string) => val && val !== cleanKey

    // Priority 1: adminTranslations.ts (always has proper translations for admin keys)
    if (adminDict && adminDict[cleanKey] && isRealTranslation(adminDict[cleanKey])) {
      result = adminDict[cleanKey]; found = true
    }
    // Priority 2: index.ts TRANSLATIONS (skip stubs where value === key)
    else if (activeDict && activeDict[cleanKey] && isRealTranslation(activeDict[cleanKey])) {
      result = activeDict[cleanKey]; found = true
    }
    // Priority 3: DB translations
    else if (dbDict[cleanKey]) {
      result = dbDict[cleanKey]; found = true
    }
    // Priority 4: English admin translations
    else {
      const enDict: any = TRANSLATIONS['en'] || {}
      const enAdminDict: any = ADMIN_TRANSLATIONS['en'] || {}
      if (enAdminDict[cleanKey]) {
        result = enAdminDict[cleanKey]; found = true
      } else if (enDict[cleanKey]) {
        result = enDict[cleanKey]; found = true
      }
    }

    if (!found) {
      // Dev-only: log untranslated keys so they can be added to the dictionaries.
      if (import.meta.env?.DEV) {
        const missing = missingKeys.get(cleanKey) || 0
        if (missing < 3) {
          // eslint-disable-next-line no-console
          console.warn(`[i18n] Missing translation key: "${cleanKey}" (lang=${currentLanguage})`)
        }
        missingKeys.set(cleanKey, missing + 1)
      }
      // Never surface raw keys / undefined: fall back to the clean key only as a
      // last resort so the user still sees readable English instead of a camelCase key.
      result = cleanKey
    }
    return unescapeUnicode(String(result ?? ''))
  }

  return { t, currentLanguage }
}

import { useSarvamTranslation } from './services/sarvamClient'
export { useSarvamTranslation }

export function Translate({ text, mode = 'translate', children }: { text: string; mode?: 'translate' | 'transliterate'; children?: (translated: string) => React.ReactNode }) {
  const translated = useSarvamTranslation(text, mode)
  return React.createElement(React.Fragment, null, children ? children(translated) : translated)
}

export function LanguageRuntime({ children }: { children: ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}



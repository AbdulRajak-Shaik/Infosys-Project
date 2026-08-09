import React, { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { fetchDatabaseTranslations } from './services/api'
import { useLanguage } from './contexts/LanguageContext'
import { TRANSLATIONS } from './translations/index'

export type LanguageCode = string

export { TRANSLATIONS }

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

export function useTranslation() {
  const { currentLanguage } = useLanguage()
  const [dbDict, setDbDict] = useState<Record<string, string>>({})

  useEffect(() => {
    let isMounted = true
    if (currentLanguage && currentLanguage !== 'en') {
      fetchDatabaseTranslations(currentLanguage)
        .then(data => {
          if (isMounted && data && Object.keys(data).length > 0) {
            setDbDict(data)
          }
        })
        .catch(() => {})
    } else {
      setDbDict({})
    }
    return () => {
      isMounted = false
    }
  }, [currentLanguage])

  const t = (key: string): string => {
    if (!key || typeof key !== 'string') return ''
    const cleanKey = key.trim()

    let result = ''
    const activeDict = TRANSLATIONS[currentLanguage]
    if (activeDict && activeDict[cleanKey]) {
      result = activeDict[cleanKey]
    } else if (dbDict[cleanKey]) {
      result = dbDict[cleanKey]
    } else {
      const enDict = TRANSLATIONS['en'] || {}
      if (enDict[cleanKey]) {
        result = enDict[cleanKey]
      } else {
        result = cleanKey
      }
    }
    return unescapeUnicode(result)
  }

  return { t, currentLanguage }
}

export function LanguageRuntime({ children }: { children: ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}

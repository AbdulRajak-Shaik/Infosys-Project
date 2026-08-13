/**
 * Locale-aware date and time utilities supporting all 23 Indian regional languages.
 */

const LOCALE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  bn: 'bn-IN',
  pa: 'pa-IN',
  or: 'or-IN',
  as: 'as-IN',
  ur: 'ur-IN',
  mai: 'mai-IN',
  mni: 'mni-IN',
  sat: 'sat-IN',
  brx: 'brx-IN',
  doi: 'doi-IN',
  ks: 'ks-IN',
  kok: 'kok-IN',
  ne: 'ne-IN',
  sa: 'sa-IN',
  sd: 'sd-IN',
}

export function getLocale(langCode: string): string {
  return LOCALE_MAP[langCode] || `${langCode}-IN`
}

/**
 * Returns localized short month name for 0-indexed month (0=Jan, 11=Dec).
 */
export function formatLocalizedMonth(monthIndex: number, langCode: string): string {
  const year = 2026
  const date = new Date(year, monthIndex, 1)
  const locale = getLocale(langCode)
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date)
  } catch {
    return date.toLocaleDateString('en-US', { month: 'short' })
  }
}

/**
 * Formats ISO date string or Date object into localized short date (e.g. "Aug 7").
 */
export function formatLocalizedDate(dateInput: string | number | Date, langCode: string): string {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return String(dateInput)
  const locale = getLocale(langCode)
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date)
  } catch {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

/**
 * Formats ISO date string or Date object into localized full date (e.g. "Aug 6, 2026").
 */
export function formatLocalizedFullDate(dateInput: string | number | Date, langCode: string): string {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return String(dateInput)
  const locale = getLocale(langCode)
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
  } catch {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
}

/**
 * Dynamic relative time formatter (e.g., "2 hours ago", "1 day ago").
 */
export function formatRelativeTime(
  dateInput: number | string | Date,
  tParam?: (key: string) => string
): string {
  const t = typeof tParam === 'function' ? tParam : (k: string) => k
  const now = Date.now()
  const timestamp = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime()
  if (isNaN(timestamp)) return ''

  const diffMs = Math.max(0, now - timestamp)
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSec < 60) {
    return t('justNow') || 'Just now'
  }
  if (diffMin < 60) {
    const unit = t('minsAgo') || 'mins ago'
    return `${diffMin} ${unit}`
  }
  if (diffHours < 24) {
    const unit = diffHours === 1 ? (t('hourAgo') || 'hour ago') : (t('hoursAgo') || 'hours ago')
    return `${diffHours} ${unit}`
  }
  const unit = diffDays === 1 ? (t('dayAgo') || 'day ago') : (t('daysAgo') || 'days ago')
  return `${diffDays} ${unit}`
}

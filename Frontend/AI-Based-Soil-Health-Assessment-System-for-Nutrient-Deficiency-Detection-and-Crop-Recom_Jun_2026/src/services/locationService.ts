/**
 * locationService.ts
 *
 * Centralized location + geolocation service for the AgroAI app.
 *
 * Responsibilities:
 *  - Request browser geolocation permission once
 *  - Reverse geocode lat/lon → precise village/town + district + state label
 *  - Store results in localStorage for app-wide reuse
 *  - Broadcast 'locationUpdated' event so all components react without a page reload
 */

const LOCATION_KEY = 'selected_location'
const COORDS_KEY = 'user_coords'

export interface UserCoords {
  lat: number
  lon: number
}

export interface LocationResult {
  label: string  // e.g. "Kothavalasa, Vizianagaram District, Andhra Pradesh, India"
  coords?: UserCoords
}

// ── Internal helpers ──────────────────────────────────────────────────

function getApiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://127.0.0.1:8000'
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token') || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Broadcast that the location has been updated so all components can react. */
function broadcastLocationUpdate(label: string): void {
  localStorage.setItem(LOCATION_KEY, label)
  window.dispatchEvent(new StorageEvent('storage', { key: LOCATION_KEY, newValue: label }))
  window.dispatchEvent(new CustomEvent('locationUpdated', { detail: { label } }))
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Get the currently stored location label from localStorage.
 * Returns null if nothing has been saved yet.
 */
export function getStoredLocation(): string | null {
  return localStorage.getItem(LOCATION_KEY) || null
}

/**
 * Get the currently stored GPS coordinates from localStorage.
 * Returns null if coordinates were never saved.
 */
export function getStoredCoords(): UserCoords | null {
  try {
    const raw = localStorage.getItem(COORDS_KEY)
    if (raw) return JSON.parse(raw) as UserCoords
  } catch { /* ignore */ }
  return null
}

/**
 * Call the backend /weather/reverse-geocode endpoint to resolve a lat/lon pair
 * into a precise human-readable location label.
 *
 * Falls back to Nominatim directly if the backend is unavailable.
 */
export async function reverseGeocodeCoords(lat: number, lon: number): Promise<string> {
  // Primary: backend endpoint (handles OWM Geo API + Nominatim fallback)
  try {
    const resp = await fetch(
      `${getApiBase()}/weather/reverse-geocode?lat=${lat}&lon=${lon}`,
      { headers: { 'Content-Type': 'application/json', ...getAuthHeader() } }
    )
    if (resp.ok) {
      const data = await resp.json()
      if (data?.label) return String(data.label)
    }
  } catch { /* fall through */ }

  // Fallback: call Nominatim directly from browser
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en&zoom=14`,
      { headers: { 'User-Agent': 'AgroAI-SoilHealth/1.0' } }
    )
    if (resp.ok) {
      const data = await resp.json()
      const addr = data.address || {}
      const place = addr.village || addr.hamlet || addr.suburb || addr.town || addr.city_district || addr.city || ''
      const distRaw = addr.county || addr.state_district || addr.district || ''
      const district = distRaw && !distRaw.toLowerCase().includes('district') ? `${distRaw} District` : distRaw
      const state = addr.state || ''
      const country = addr.country || 'India'
      const parts = [place, district, state, country].filter(Boolean)
      if (parts.length > 1) return parts.join(', ')
    }
  } catch { /* fall through */ }

  // Last resort: just return raw coordinates
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
}

/**
 * Request the browser's geolocation permission and resolve a full location label.
 *
 * - On success: saves coords + label to localStorage, broadcasts 'locationUpdated'
 * - On denial / unavailable: resolves with null (no error thrown)
 */
export async function requestGeolocation(): Promise<LocationResult | null> {
  if (!navigator.geolocation) return null

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        const coords: UserCoords = { lat, lon }

        try {
          const label = await reverseGeocodeCoords(lat, lon)
          localStorage.setItem(COORDS_KEY, JSON.stringify(coords))
          broadcastLocationUpdate(label)
          resolve({ label, coords })
        } catch {
          resolve(null)
        }
      },
      (_err) => {
        // User denied or unavailable — not an error, just resolve null
        resolve(null)
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 300000 }
    )
  })
}

/**
 * Main entry point: get the user's location.
 *
 * 1. If localStorage already has a saved location → return it immediately
 * 2. Otherwise trigger geolocation → resolve → save → broadcast → return
 *
 * Call this on app mount (e.g. in App.tsx or a top-level component).
 */
export async function getOrRequestLocation(): Promise<LocationResult | null> {
  const existing = getStoredLocation()
  if (existing && existing.trim()) {
    const coords = getStoredCoords()
    return { label: existing, coords: coords ?? undefined }
  }
  return requestGeolocation()
}

/**
 * Manually set a location (e.g. when user picks from the list).
 * Optionally pass coordinates for better weather precision.
 */
export function setLocation(label: string, coords?: UserCoords): void {
  if (coords) localStorage.setItem(COORDS_KEY, JSON.stringify(coords))
  broadcastLocationUpdate(label)
}

/**
 * Clear the saved location and coordinates (e.g. on logout).
 */
export function clearLocation(): void {
  localStorage.removeItem(LOCATION_KEY)
  localStorage.removeItem(COORDS_KEY)
}

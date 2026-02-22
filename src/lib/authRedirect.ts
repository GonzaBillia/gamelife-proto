export function getSiteUrl() {
  // Vercel/producción: VITE_SITE_URL="https://tuapp.com"
  // Dev: fallback a window.location.origin
  return import.meta.env.VITE_SITE_URL || window.location.origin
}
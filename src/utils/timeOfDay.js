const listeners = new Set()
let override = null // null = pakai jam sungguhan

export const PRESETS = [
  { id: 'fajar', label: 'Fajar', icon: '🌅', hour: 5.3 },
  { id: 'pagi', label: 'Pagi', icon: '🌤️', hour: 8 },
  { id: 'siang', label: 'Siang', icon: '☀️', hour: 12 },
  { id: 'sore', label: 'Sore', icon: '🌇', hour: 16 },
  { id: 'senja', label: 'Senja', icon: '🌆', hour: 18.1 },
  { id: 'malam', label: 'Malam', icon: '🌙', hour: 22 },
]

export function realHour() {
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600
}

export function getTargetHour() {
  return override ?? realHour()
}

export function getOverride() {
  return override
}

export function setOverride(hour) {
  override = hour
  listeners.forEach((fn) => fn())
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function phaseOf(h) {
  if (h >= 4.5 && h < 6) return PRESETS[0]
  if (h >= 6 && h < 10.5) return PRESETS[1]
  if (h >= 10.5 && h < 14.5) return PRESETS[2]
  if (h >= 14.5 && h < 17.5) return PRESETS[3]
  if (h >= 17.5 && h < 19) return PRESETS[4]
  return PRESETS[5]
}

export function formatHour(h) {
  const hh = String(Math.floor(h)).padStart(2, '0')
  const mm = String(Math.floor((h % 1) * 60)).padStart(2, '0')
  return `${hh}:${mm}`
}
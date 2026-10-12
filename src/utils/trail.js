// Sudut harus sama dengan CameraRig (π/2 + t * 1.5π) supaya jalur
// selalu terlihat di depan kamera. Geser TRAIL_PHASE untuk memindahkan
// jalur ke kiri (+) atau kanan (-) layar.
export const TRAIL_PHASE = 0

export function trailXZ(s) {
  const angle = Math.PI / 2 + s * Math.PI * 1.5 + TRAIL_PHASE
  const r = 82 - 78 * s // dari kaki gunung (r=82) ke puncak (r=4)
  return [Math.cos(angle) * r, Math.sin(angle) * r]
}

export function buildTrailPoints(n) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const [x, z] = trailXZ(i / n)
    pts.push({ x, z })
  }
  return pts
}
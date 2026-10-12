import { createNoise2D } from 'simplex-noise'

// Random seeded supaya bentuk gunung selalu sama setiap reload
export function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const noise2D = createNoise2D(mulberry32(42))

export const TERRAIN_SIZE = 240

export function getHeight(x, z) {
  const d = Math.hypot(x, z)

  // Bentuk kerucut utama gunung
  const peak = Math.pow(Math.max(0, 1 - d / 95), 1.6) * 42

  // Detail permukaan (fBm: beberapa lapis noise)
  let amp = 1
  let freq = 0.02
  let fbm = 0
  for (let i = 0; i < 4; i++) {
    fbm += noise2D(x * freq, z * freq) * amp
    amp *= 0.5
    freq *= 2
  }

  // Makin tinggi, makin kasar
  const roughness = 3 + peak * 0.22
  return peak + fbm * roughness
}
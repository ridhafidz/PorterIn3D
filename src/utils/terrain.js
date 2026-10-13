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

export const SUMMIT_H = 47 // tinggi panggung puncak (satuan dunia)
const SUMMIT_FLAT = 4.5 // radius panggung yang benar-benar datar (kecil, supaya puncak tetap lancip)
const SUMMIT_BLEND = 12 // radius transisi ke lereng

// Posisi papan puncak (tiang bendera ada di 0,0) dan posisi kamera terakhir
export const SUMMIT_CAM = { x: 15, y: SUMMIT_H + 6, z: 8.5 }

// ---------- Sabana / camp area ----------
// flat = radius lapangan datar, blend = radius transisi, tilt = kemiringan lapangan
export const SAV = { x: 28, z: 23, h: 20, flat: 11, blend: 23, tilt: 0.25 }

function smooth(x, a, b) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const mix = (a, b, t) => a + (b - a) * t

function baseHeight(x, z) {
  const d = Math.hypot(x, z)

  // Bentuk kerucut utama gunung
  const peak = Math.pow(Math.max(0, 1 - d / 95), 1.6) * 48

  // Detail permukaan (fBm: beberapa lapis noise)
  let amp = 1
  let freq = 0.02
  let fbm = 0
  for (let i = 0; i < 4; i++) {
    fbm += noise2D(x * freq, z * freq) * amp
    amp *= 0.5
    freq *= 2
  }

  // Makin tinggi makin kasar
  const roughness = 3 + peak * 0.22
  return peak + fbm * roughness
}

// Arah menanjak sabana = menuju puncak
const SAV_LEN = Math.hypot(SAV.x, SAV.z)
const SAV_UX = -SAV.x / SAV_LEN
const SAV_UZ = -SAV.z / SAV_LEN

function savannaTarget(x, z) {
  const uphill = (x - SAV.x) * SAV_UX + (z - SAV.z) * SAV_UZ
  return SAV.h + uphill * SAV.tilt
}

// 1 di dalam lapangan datar, 0 di luar zona transisi
export function savannaFlatWeight(x, z) {
  return 1 - smooth(Math.hypot(x - SAV.x, z - SAV.z), SAV.flat, SAV.blend)
}

// Bobot warna rumput (tepinya dibuat tidak beraturan)
export function savannaGrassWeight(x, z) {
  const d = Math.hypot(x - SAV.x, z - SAV.z) + noise2D(x * 0.08, z * 0.08) * 3
  return 1 - smooth(d, SAV.flat + 1, SAV.flat + 8)
}

export function getHeight(x, z) {
  const d = Math.hypot(x, z)
  let h = baseHeight(x, z)

  // Dataran puncak
  h = mix(h, SUMMIT_H, 1 - smooth(d, SUMMIT_FLAT, SUMMIT_BLEND))

  // Lapangan sabana
  const ws = savannaFlatWeight(x, z)
  if (ws > 0) h = mix(h, savannaTarget(x, z), ws)

  return h
}
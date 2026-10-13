import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { getHeight, SAV, SUMMIT_CAM, SUMMIT_H } from '../../utils/terrain'

// Posisi di orbit gunung: sudut (derajat), jarak dari pusat, tinggi di atas tanah
function orbit(angleDeg, r, off) {
  const a = THREE.MathUtils.degToRad(angleDeg)
  const x = Math.cos(a) * r
  const z = Math.sin(a) * r
  return new THREE.Vector3(x, getHeight(x, z) + off, z)
}

// Satu keyframe per section (scroll 0, .25, .5, .75, 1):
// hero → kaki gunung → lereng hutan → sabana → puncak
const POSITIONS = [
  orbit(90, 105, 16),
  orbit(62, 90, 12),
  orbit(22, 74, 14),
  orbit(6, 55, 10),
  new THREE.Vector3(SUMMIT_CAM.x, SUMMIT_CAM.y, SUMMIT_CAM.z),
]

const TARGETS = [
  new THREE.Vector3(0, 35, 0),
  new THREE.Vector3(0, 30, 0),
  new THREE.Vector3(16, 27, 10),
  new THREE.Vector3(SAV.x - 2, SAV.h + 2.5, SAV.z - 2),
  new THREE.Vector3(0, SUMMIT_H + 4.2, 0),
]

// Kamera melambat saat mendekati tiap keyframe
function easeStops(t, n = 4) {
  const x = t * n
  const i = Math.min(Math.floor(x), n - 1)
  const u = x - i
  const e = u * u * (3 - 2 * u)
  return (i + THREE.MathUtils.lerp(u, e, 0.7)) / n
}

export default function CameraRig() {
  const scroll = useScroll()
  const posCurve = useMemo(() => new THREE.CatmullRomCurve3(POSITIONS), [])
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3(TARGETS), [])

  const camTarget = useRef(new THREE.Vector3())
  const lookTarget = useRef(new THREE.Vector3())
  const lookCurrent = useRef(TARGETS[0].clone())

  useFrame((state, delta) => {
    const t = easeStops(scroll.offset)
    const k = 1 - Math.exp(-delta * 4) // smoothing

    posCurve.getPoint(t, camTarget.current)
    lookCurve.getPoint(t, lookTarget.current)

    const cam = state.camera
    cam.position.lerp(camTarget.current, k)

    // Jaga kamera tidak menembus tanah
    const minY = getHeight(cam.position.x, cam.position.z) + 3
    if (cam.position.y < minY) cam.position.y = minY

    lookCurrent.current.lerp(lookTarget.current, k)
    cam.lookAt(lookCurrent.current)
  })

  return null
}
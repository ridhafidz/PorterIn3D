import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { getHeight } from '../../utils/terrain'

export default function CameraRig() {
  const scroll = useScroll()
  const summitY = useMemo(() => getHeight(0, 0), [])

  const curve = useMemo(() => {
    const points = []
    const steps = 12
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const angle = Math.PI / 2 + t * Math.PI * 1.5 // spiral 270 derajat
      const r = 88 - t * 70 // dari jauh ke dekat puncak
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      points.push(new THREE.Vector3(x, getHeight(x, z) + 10 + t * 6, z))
    }
    return new THREE.CatmullRomCurve3(points)
  }, [])

  const camTarget = useRef(new THREE.Vector3())
  const lookTarget = useRef(new THREE.Vector3())
  const lookCurrent = useRef(new THREE.Vector3(0, summitY * 0.65, 0))

  useFrame((state, delta) => {
    const t = scroll.offset
    const k = 1 - Math.exp(-delta * 4) // smoothing

    curve.getPoint(t, camTarget.current)
    state.camera.position.lerp(camTarget.current, k)

    lookTarget.current.set(0, summitY * (0.65 + 0.3 * t), 0)
    lookCurrent.current.lerp(lookTarget.current, k)
    state.camera.lookAt(lookCurrent.current)
  })

  return null
}
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { getHeight, mulberry32 } from '../../utils/terrain'

const COUNT = 900
const RADIUS = 45
const SUMMIT = getHeight(0, 0)
const BOTTOM = 6
const TOP = SUMMIT + 30

export default function Snow() {
  const scroll = useScroll()
  const points = useRef()

  const data = useMemo(() => {
    const rand = mulberry32(99)
    const base = new Float32Array(COUNT * 3)
    const phase = new Float32Array(COUNT)
    const speed = new Float32Array(COUNT)

    for (let i = 0; i < COUNT; i++) {
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(rand()) * RADIUS
      base[i * 3] = Math.cos(a) * r
      base[i * 3 + 1] = BOTTOM + rand() * (TOP - BOTTOM)
      base[i * 3 + 2] = Math.sin(a) * r
      phase[i] = rand() * Math.PI * 2
      speed[i] = 1.2 + rand() * 1.8
    }
    return { base, phase, speed, positions: base.slice() }
  }, [])

  // Titik bulat lembut (bukan kotak)
  const sprite = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 32, 32)
    return new THREE.CanvasTexture(c)
  }, [])

  useFrame(({ clock }, delta) => {
    const pts = points.current
    // Salju mulai muncul di sekitar Pos 3 dan penuh di puncak
    const fade = THREE.MathUtils.smoothstep(scroll.offset, 0.55, 0.85)
    pts.material.opacity = fade * 0.9
    pts.visible = fade > 0.01
    if (!pts.visible) return

    const { base, phase, speed } = data
    const arr = pts.geometry.attributes.position.array
    const time = clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      let y = arr[i3 + 1] - speed[i] * dt
      if (y < BOTTOM) y = TOP
      arr[i3 + 1] = y
      // Goyang pelan + miring searah angin
      arr[i3] = base[i3] + Math.sin(time * 0.7 + phase[i]) * 1.2 + (TOP - y) * 0.15
      arr[i3 + 2] = base[i3 + 2] + Math.cos(time * 0.5 + phase[i]) * 1.2
    }
    pts.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={points} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        size={0.35}
        sizeAttenuation
        transparent
        depthWrite={false}
        color="#ffffff"
        opacity={0}
      />
    </points>
  )
}
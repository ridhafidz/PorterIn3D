import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SUMMIT_H, mulberry32 } from '../../utils/terrain'

const POLE_H = 10.5
const FLAG_W = 3.6 // proporsi 2:3 sesuai bendera nasional
const FLAG_H = 2.4

function createFlagTexture() {
  const c = document.createElement('canvas')
  c.width = 8
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#e0132b' // merah di atas
  g.fillRect(0, 0, 8, 64)
  g.fillStyle = '#ffffff' // putih di bawah
  g.fillRect(0, 64, 8, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Flag({ texture }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(FLAG_W, FLAG_H, 18, 10)
    g.translate(FLAG_W / 2, -FLAG_H / 2, 0) // sudut kiri-atas menempel di tiang
    g.userData.base = g.attributes.position.array.slice()
    return g
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const pos = geometry.attributes.position
    const base = geometry.userData.base

    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3]
      const y = base[i * 3 + 1]
      const u = x / FLAG_W // 0 di tiang, 1 di ujung bebas
      const amp = u * 0.55 // makin ke ujung makin kuat berkibar
      const wave =
        Math.sin(x * 2.2 - t * 5 + y * 1.1) * amp +
        Math.sin(x * 4.6 - t * 8.5) * amp * 0.25
      pos.setXYZ(
        i,
        x - Math.abs(wave) * 0.1, // kain sedikit menyusut saat bergelombang
        y + Math.sin(x * 2 - t * 3) * 0.05 * u,
        wave
      )
    }
    pos.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <meshStandardMaterial
        map={texture}
        emissiveMap={texture}
        emissive="#ffffff"
        emissiveIntensity={0.3}
        roughness={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default function Summit() {
  const flagPivot = useRef()
  const flagTex = useMemo(createFlagTexture, [])

  const rocks = useMemo(() => {
    const rand = mulberry32(3)
    return Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + rand() * 0.4
      const r = 1.1 + rand() * 0.9
      const s = 0.3 + rand() * 0.4
      return {
        position: [Math.cos(a) * r, s * 0.35, Math.sin(a) * r],
        scale: [s * 1.2, s * 0.8, s],
        rotation: [rand(), rand() * 3, rand()],
      }
    })
  }, [])

  // Bendera menghadap kamera, dengan sedikit goyangan arah angin
  useFrame(({ clock, camera }) => {
    flagPivot.current.rotation.y =
      Math.atan2(camera.position.x, camera.position.z) + Math.sin(clock.elapsedTime * 0.6) * 0.12
  })

  return (
    <group position={[0, SUMMIT_H, 0]}>
      {/* Pondasi dan tiang bendera */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.5, 8]} />
        <meshStandardMaterial color="#9a9a96" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, POLE_H / 2, 0]}>
        <cylinderGeometry args={[0.09, 0.12, POLE_H, 8]} />
        <meshStandardMaterial color="#d9d9d4" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, POLE_H + 0.1, 0]}>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial color="#e6c35c" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Bendera Merah Putih */}
      <group ref={flagPivot} position={[0.08, POLE_H - 0.1, 0]}>
        <Flag texture={flagTex} />
      </group>

      {/* Tumpukan batu di kaki tiang */}
      {rocks.map((r, i) => (
        <mesh key={i} position={r.position} scale={r.scale} rotation={r.rotation}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#8a8680" flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  )
}
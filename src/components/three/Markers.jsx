import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { getHeight } from '../../utils/terrain'
import { trailXZ } from '../../utils/trail'

// s = posisi di jalur (0-1), harus sama dengan titik scroll section-nya
const MARKERS = [
  { s: 0.25, name: 'Basecamp' },
  { s: 0.5, name: 'Pos 2' },
  { s: 0.75, name: 'Pos 3' },
  { s: 1.0, name: 'Puncak' },
]

const FLAG_W = 3
const FLAG_H = 1.8

function Flag() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(FLAG_W, FLAG_H, 14, 8)
    g.translate(FLAG_W / 2, 0, 0) // tepi kiri menempel di tiang
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
      const amp = u * 0.5 // makin ke ujung makin kuat berkibar
      const wave =
        Math.sin(x * 2.4 - t * 5 + y * 1.2) * amp +
        Math.sin(x * 5 - t * 8.5) * amp * 0.25
      pos.setXYZ(
        i,
        x - Math.abs(wave) * 0.12, // kain sedikit menyusut saat bergelombang
        y + Math.sin(x * 2 - t * 3) * 0.04 * u,
        wave
      )
    }
    pos.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#ff6b35"
        emissive="#ff6b35"
        emissiveIntensity={0.3}
        roughness={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function Marker({ s, name }) {
  const scroll = useScroll()
  const group = useRef()
  const flagPivot = useRef()
  const ring = useRef()
  const label = useRef()

  const position = useMemo(() => {
    const [x, z] = trailXZ(s)
    return [x, getHeight(x, z), z]
  }, [s])

  useFrame(({ clock, camera }) => {
    // a = 1 saat section ini aktif, 0 saat jauh
    const a = THREE.MathUtils.clamp(1 - Math.abs(scroll.offset - s) / 0.14, 0, 1)

    group.current.scale.setScalar(0.8 + 0.3 * a)

    const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.12 * a
    ring.current.scale.set(pulse, pulse, pulse)

    // Bendera menghadap kamera, dengan sedikit goyangan arah angin
    const dx = camera.position.x - position[0]
    const dz = camera.position.z - position[2]
    flagPivot.current.rotation.y = Math.atan2(dx, dz) + Math.sin(clock.elapsedTime * 0.6) * 0.12

    if (label.current) {
      label.current.style.opacity = String(Math.min(1, a * 1.5))
    }
  })

  return (
    <group ref={group} position={position}>
      {/* Tiang */}
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 7, 6]} />
        <meshStandardMaterial color="#3b2f2a" roughness={1} />
      </mesh>

      {/* Bendera berkibar */}
      <group ref={flagPivot} position={[0, 6, 0]}>
        <Flag />
      </group>

      {/* Cincin di tanah */}
      <mesh ref={ring} position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.6, 0.14, 8, 40]} />
        <meshStandardMaterial color="#ff6b35" emissive="#ff6b35" emissiveIntensity={0.5} />
      </mesh>

      <Html position={[0, 9, 0]} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
        <div
          ref={label}
          className="whitespace-nowrap rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white shadow-lg"
          style={{ opacity: 0 }}
        >
          {name}
        </div>
      </Html>
    </group>
  )
}

export default function Markers() {
  return (
    <>
      {MARKERS.map((m) => (
        <Marker key={m.name} {...m} />
      ))}
    </>
  )
}
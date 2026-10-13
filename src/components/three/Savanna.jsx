import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { getHeight, mulberry32, SAV, savannaGrassWeight } from '../../utils/terrain'
import { skyState } from '../../utils/skyState'

const TENT_W = 3.2
const TENT_L = 4.2
const TENT_H = 2.4
const GRASS_COUNT = 1300
const GRASS_COLORS = ['#a6a44e', '#b9ae5a', '#8ea04c', '#c4b45e', '#9aa84f']

// angle (derajat) dan r = posisi tenda di sekeliling api unggun
const TENTS = [
  { angle: 15, r: 6.5, color: '#ff7a3d' },
  { angle: 75, r: 8.0, color: '#2f80ed' },
  { angle: 135, r: 6.2, color: '#2fb26b' },
  { angle: 195, r: 8.2, color: '#f2c94c' },
  { angle: 255, r: 6.6, color: '#e5534b' },
  { angle: 315, r: 8.0, color: '#9b6bdc' },
]

const FLAMES = [
  { x: 0, z: 0, r: 0.5, h: 1.5, color: '#ff8a2b' },
  { x: 0.25, z: 0.15, r: 0.35, h: 1.1, color: '#ffc247' },
  { x: -0.2, z: -0.18, r: 0.3, h: 0.9, color: '#ff6a1f' },
]

const STONES = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2
  return [Math.cos(a) * 1.35, 0.12, Math.sin(a) * 1.35]
})

const campY = getHeight(SAV.x, SAV.z)

// Tenda A-frame (prisma segitiga). Pintunya menghadap +z.
function createTentGeometry() {
  const hw = TENT_W / 2
  const hl = TENT_L / 2
  const FL = [-hw, 0, hl]
  const FR = [hw, 0, hl]
  const BL = [-hw, 0, -hl]
  const BR = [hw, 0, -hl]
  const RF = [0, TENT_H, hl]
  const RB = [0, TENT_H, -hl]
  const tris = [
    ...FL, ...RF, ...RB, ...FL, ...RB, ...BL, // sisi kiri
    ...FR, ...RB, ...RF, ...FR, ...BR, ...RB, // sisi kanan
    ...FL, ...FR, ...RF, // depan
    ...BR, ...BL, ...RB, // belakang
  ]
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris, 3))
  g.computeVertexNormals()
  return g
}

function createDoorGeometry() {
  const z = TENT_L / 2 + 0.02
  const w = TENT_W * 0.19
  const g = new THREE.BufferGeometry()
  g.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([-w, 0, z, w, 0, z, 0, TENT_H * 0.72, z], 3)
  )
  g.computeVertexNormals()
  return g
}

// Titik tanah terendah di bawah tenda, supaya tenda tidak melayang di lereng
function groundMin(x, z, rot) {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  const hw = TENT_W / 2
  const hl = TENT_L / 2
  let m = Infinity
  for (const [lx, lz] of [[0, 0], [-hw, -hl], [hw, -hl], [-hw, hl], [hw, hl]]) {
    m = Math.min(m, getHeight(x + lx * c + lz * s, z - lx * s + lz * c))
  }
  return m
}

export default function Savanna() {
  const scroll = useScroll()
  const label = useRef()
  const light = useRef()
  const flames = useRef([])
  const grass = useRef()

  const tentGeo = useMemo(createTentGeometry, [])
  const doorGeo = useMemo(createDoorGeometry, [])

  const tents = useMemo(() => {
    const rand = mulberry32(11)
    return TENTS.map((t) => {
      const a = THREE.MathUtils.degToRad(t.angle)
      const x = SAV.x + Math.cos(a) * t.r
      const z = SAV.z + Math.sin(a) * t.r
      // Pintu tenda menghadap api unggun
      const rot = Math.atan2(SAV.x - x, SAV.z - z) + (rand() - 0.5) * 0.5
      return { x, z, rot, color: t.color, y: groundMin(x, z, rot) - 0.1 }
    })
  }, [])

  const blades = useMemo(() => {
    const rand = mulberry32(21)
    const out = []
    let tries = 0
    while (out.length < GRASS_COUNT && tries < GRASS_COUNT * 6) {
      tries++
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(rand()) * 19
      const x = SAV.x + Math.cos(a) * r
      const z = SAV.z + Math.sin(a) * r
      if (rand() > savannaGrassWeight(x, z)) continue
      if (r < 1.8) continue // jangan menimpa api unggun
      if (tents.some((t) => Math.hypot(t.x - x, t.z - z) < 2.4)) continue

      out.push({
        x,
        y: getHeight(x, z),
        z,
        h: 0.7 + rand() * 1.1,
        tx: (rand() - 0.5) * 0.4,
        tz: (rand() - 0.5) * 0.4,
        rot: rand() * Math.PI * 2,
        color: GRASS_COLORS[Math.floor(rand() * GRASS_COLORS.length)],
      })
    }
    return out
  }, [tents])

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    blades.forEach((b, i) => {
      dummy.position.set(b.x, b.y + b.h * 0.5 - 0.05, b.z)
      dummy.rotation.set(b.tx, b.rot, b.tz)
      dummy.scale.set(1, b.h, 1)
      dummy.updateMatrix()
      grass.current.setMatrixAt(i, dummy.matrix)
      grass.current.setColorAt(i, color.set(b.color))
    })
    grass.current.instanceMatrix.needsUpdate = true
    grass.current.instanceColor.needsUpdate = true
  }, [blades])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    // Api berkedip. Terang saat malam, redup saat siang.
    const flick = 0.85 + 0.15 * Math.sin(t * 11) + 0.07 * Math.sin(t * 23 + 1.3)
    light.current.intensity = (5 + 105 * (1 - skyState.day)) * flick

    flames.current.forEach((m, i) => {
      if (!m) return
      m.scale.y = 1 + 0.22 * Math.sin(t * (9 + i * 3) + i * 2) + 0.08 * Math.sin(t * 21 + i)
      const w = 1 + 0.12 * Math.sin(t * 13 + i * 1.7)
      m.scale.x = w
      m.scale.z = w
    })

    // Label muncul saat section sabana (scroll 0.75) aktif
    const a = THREE.MathUtils.clamp(1 - Math.abs(scroll.offset - 0.75) / 0.14, 0, 1)
    if (label.current) label.current.style.opacity = String(Math.min(1, a * 1.5))
  })

  return (
    <group>
      {tents.map((t, i) => (
        <group key={i} position={[t.x, t.y, t.z]} rotation={[0, t.rot, 0]}>
          <mesh geometry={tentGeo}>
            <meshStandardMaterial color={t.color} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={doorGeo}>
            <meshStandardMaterial color="#14171c" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Api unggun */}
      <group position={[SAV.x, campY, SAV.z]}>
        {STONES.map((p, i) => (
          <mesh key={i} position={p} scale={0.38}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#7b7a77" flatShading roughness={1} />
          </mesh>
        ))}

        <mesh position={[0, 0.18, 0]} rotation={[0, 0.5, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 1.7, 6]} />
          <meshStandardMaterial color="#4a3426" roughness={1} />
        </mesh>
        <mesh position={[0, 0.18, 0]} rotation={[0, -0.9, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 1.7, 6]} />
          <meshStandardMaterial color="#3b2a1e" roughness={1} />
        </mesh>

        {FLAMES.map((f, i) => (
          <mesh
            key={i}
            ref={(el) => {
              flames.current[i] = el
            }}
            position={[f.x, f.h / 2 + 0.15, f.z]}
          >
            <coneGeometry args={[f.r, f.h, 6]} />
            <meshBasicMaterial color={f.color} transparent opacity={0.92} />
          </mesh>
        ))}

        <pointLight ref={light} position={[0, 1.6, 0]} color="#ff9548" distance={26} decay={2} />

        <Html position={[0, 8, 0]} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
          <div
            ref={label}
            className="whitespace-nowrap rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white shadow-lg"
            style={{ opacity: 0 }}
          >
            Camp Area · Sabana
          </div>
        </Html>
      </group>

      {/* Rumput sabana */}
      <instancedMesh ref={grass} args={[null, null, blades.length]} frustumCulled={false}>
        <coneGeometry args={[0.16, 1, 4]} />
        <meshStandardMaterial flatShading roughness={1} />
      </instancedMesh>
    </group>
  )
}
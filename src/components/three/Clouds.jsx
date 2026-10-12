import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Clouds({ count = 16 }) {
  const group = useRef()

  const clouds = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2
        const radius = 70 + Math.random() * 90
        const puffCount = 4 + Math.floor(Math.random() * 3)
        return {
          position: [Math.cos(angle) * radius, 50 + Math.random() * 35, Math.sin(angle) * radius],
          scale: 0.8 + Math.random() * 1.0,
          puffs: Array.from({ length: puffCount }, (_, i) => ({
            position: [(i - puffCount / 2) * 5 + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 5],
            size: 5 + Math.random() * 4,
          })),
        }
      }),
    [count]
  )

  // Awan berputar pelan mengelilingi gunung
  useFrame((_, delta) => {
    group.current.rotation.y += delta * 0.01
  })

  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={c.position} scale={c.scale}>
          {c.puffs.map((p, j) => (
            <mesh key={j} position={p.position} scale={[p.size, p.size * 0.6, p.size]}>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.25}
                flatShading
                roughness={1}
                transparent
                opacity={0.92}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
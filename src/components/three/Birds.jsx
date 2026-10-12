import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from '../../utils/terrain'

const COUNT = 9
const COLOR = '#232a38'
const tmp = new THREE.Vector3()

// Satu sayap = segitiga pipih. Sayap kiri adalah cermin sayap kanan.
function createWingGeometry() {
  const geo = new THREE.BufferGeometry()
  const v = new Float32Array([0, 0, -0.35, 0, 0, 0.45, 2.1, 0, 0.05])
  geo.setAttribute('position', new THREE.BufferAttribute(v, 3))
  return geo
}

function Bird({ index, wing }) {
  const group = useRef()
  const left = useRef()
  const right = useRef()

  const p = useMemo(() => {
    const rand = mulberry32(31 + index * 17)
    return {
      angle: (rand() - 0.5) * 0.7, // posisi dalam kawanan
      radius: 62 + rand() * 16,
      height: 36 + rand() * 14,
      phase: rand() * Math.PI * 2,
      flap: 7 + rand() * 3,
      scale: 1.2 + rand() * 0.6,
    }
  }, [index])

  const orbit = (time, target) => {
    const a = p.angle + time * 0.05
    return target.set(
      Math.cos(a) * p.radius,
      p.height + Math.sin(time * 0.7 + p.phase) * 1.5,
      Math.sin(a) * p.radius
    )
  }

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current.position.copy(orbit(t, tmp))
    group.current.lookAt(orbit(t + 0.3, tmp)) // menghadap arah terbang

    const f = Math.sin(t * p.flap + p.phase) * 0.7
    right.current.rotation.z = f
    left.current.rotation.z = -f
  })

  return (
    <group ref={group} scale={p.scale}>
      <mesh ref={right} geometry={wing}>
        <meshBasicMaterial color={COLOR} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={left} geometry={wing} scale={[-1, 1, 1]}>
        <meshBasicMaterial color={COLOR} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 1.1, 4]} />
        <meshBasicMaterial color={COLOR} />
      </mesh>
    </group>
  )
}

export default function Birds() {
  const wing = useMemo(createWingGeometry, [])
  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => (
        <Bird key={i} index={i} wing={wing} />
      ))}
    </>
  )
}
import { useMemo } from 'react'
import * as THREE from 'three'
import { getHeight } from '../../utils/terrain'
import { buildTrailPoints } from '../../utils/trail'

const HALF_WIDTH = 0.6 // setengah lebar jalur
const LIFT = 0.35 // diangkat sedikit supaya tidak tenggelam di terrain

export default function Trail() {
  const geometry = useMemo(() => {
    const pts = buildTrailPoints(320)
    const positions = []
    const indices = []

    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)]
      const b = pts[Math.min(pts.length - 1, i + 1)]
      let tx = b.x - a.x
      let tz = b.z - a.z
      const len = Math.hypot(tx, tz) || 1
      tx /= len
      tz /= len

      // Tegak lurus arah jalur
      const nx = -tz
      const nz = tx
      const lx = p.x + nx * HALF_WIDTH
      const lz = p.z + nz * HALF_WIDTH
      const rx = p.x - nx * HALF_WIDTH
      const rz = p.z - nz * HALF_WIDTH

      positions.push(lx, getHeight(lx, lz) + LIFT, lz, rx, getHeight(rx, rz) + LIFT, rz)

      if (i < pts.length - 1) {
        const k = i * 2
        indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3)
      }
    })

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#f0e2bd"
        emissive="#a8955f"
        emissiveIntensity={0.35}
        roughness={1}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  )
}
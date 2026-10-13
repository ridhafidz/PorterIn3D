import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getHeight, mulberry32, savannaFlatWeight } from '../../utils/terrain'

const COUNT = 1800
const MAX_Y = 19 // batas ketinggian tumbuh pohon
const PALETTE = ['#1f4d2e', '#2a5e36', '#356b3d', '#1b4332'].map((c) => new THREE.Color(c))

function generateTrees() {
  const rand = mulberry32(7)
  const trees = []
  let tries = 0

  while (trees.length < COUNT && tries < COUNT * 12) {
    tries++
    const angle = rand() * Math.PI * 2
    const r = 14 + rand() * 100
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    if (Math.abs(x) > 115 || Math.abs(z) > 115) continue

    const y = getHeight(x, z)
    if (y < 0.8 || y > MAX_Y) continue

    // Lewati lereng yang terlalu curam
    const sx = (getHeight(x + 1.5, z) - getHeight(x - 1.5, z)) / 3
    const sz = (getHeight(x, z + 1.5) - getHeight(x, z - 1.5)) / 3
    if (Math.hypot(sx, sz) > 0.85) continue

    // Sabana: pohon menipis mendekati lapangan, hilang di dalamnya
    if (rand() < savannaFlatWeight(x, z) * 1.25) continue

    trees.push({
      x,
      y,
      z,
      scale: (0.8 + rand() * 0.8) * (1.15 - (y / MAX_Y) * 0.5), // makin tinggi makin kecil
      rot: rand() * Math.PI * 2,
      color: PALETTE[Math.floor(rand() * PALETTE.length)],
    })
  }
  return trees
}

export default function Trees() {
  const trees = useMemo(generateTrees, [])
  const trunk = useRef()
  const coneLow = useRef()
  const coneHigh = useRef()

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()

    trees.forEach((t, i) => {
      const place = (mesh, yOffset, sc) => {
        dummy.position.set(t.x, t.y - 0.2 + yOffset * t.scale, t.z)
        dummy.rotation.set(0, t.rot, 0)
        dummy.scale.setScalar(t.scale * sc)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      place(trunk.current, 0.5, 1)
      place(coneLow.current, 2.0, 1.25)
      place(coneHigh.current, 3.1, 0.9)
      coneLow.current.setColorAt(i, t.color)
      coneHigh.current.setColorAt(i, t.color)
    })

    ;[trunk, coneLow, coneHigh].forEach((m) => {
      m.current.instanceMatrix.needsUpdate = true
    })
    coneLow.current.instanceColor.needsUpdate = true
    coneHigh.current.instanceColor.needsUpdate = true
  }, [trees])

  return (
    <>
      <instancedMesh ref={trunk} args={[null, null, trees.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.15, 0.2, 1, 5]} />
        <meshStandardMaterial color="#4a3426" roughness={1} />
      </instancedMesh>

      <instancedMesh ref={coneLow} args={[null, null, trees.length]} frustumCulled={false}>
        <coneGeometry args={[1.1, 2.4, 6]} />
        <meshStandardMaterial flatShading roughness={1} />
      </instancedMesh>

      <instancedMesh ref={coneHigh} args={[null, null, trees.length]} frustumCulled={false}>
        <coneGeometry args={[1.1, 2.4, 6]} />
        <meshStandardMaterial flatShading roughness={1} />
      </instancedMesh>
    </>
  )
}
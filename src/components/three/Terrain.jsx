import { useMemo } from 'react'
import * as THREE from 'three'
import { getHeight, TERRAIN_SIZE } from '../../utils/terrain'

const SEGMENTS = 160

// [tinggi, warna]: hutan, rumput, tanah, batu, salju
const STOPS = [
  [0, new THREE.Color('#2e5236')],
  [10, new THREE.Color('#4f7f52')],
  [22, new THREE.Color('#7b6b59')],
  [32, new THREE.Color('#8f8b86')],
  [39, new THREE.Color('#f4f7fa')],
]

function colorForHeight(y, target) {
  if (y <= STOPS[0][0]) return target.copy(STOPS[0][1])
  for (let i = 1; i < STOPS.length; i++) {
    if (y <= STOPS[i][0]) {
      const [h0, c0] = STOPS[i - 1]
      const [h1, c1] = STOPS[i]
      return target.copy(c0).lerp(c1, (y - h0) / (h1 - h0))
    }
  }
  return target.copy(STOPS[STOPS.length - 1][1])
}

export default function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()

    for (let i = 0; i < pos.count; i++) {
      const y = getHeight(pos.getX(i), pos.getZ(i))
      pos.setY(i, y)
      colorForHeight(y, c)
      colors.set([c.r, c.g, c.b], i * 3)
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors flatShading roughness={1} />
    </mesh>
  )
}
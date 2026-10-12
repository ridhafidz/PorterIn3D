import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'

// Posisi matahari di horizontal (radian). Ubah kalau mau sumber cahaya dari sisi lain.
const SUN_AZIMUTH = -0.5

// Tiga fase: fajar (t=0) → pagi (t=0.5) → siang di puncak (t=1)
const KEYS = [
  {
    t: 0,
    top: '#4a5d9a',
    horizon: '#f6b998',
    sun: '#ffb36b',
    light: '#ffb98a',
    lightI: 1.6,
    ambI: 0.55,
    elevation: 0.16, // tinggi matahari (radian)
    fogNear: 45,
    fogFar: 235,
  },
  {
    t: 0.5,
    top: '#5b93d1',
    horizon: '#d7e6ef',
    sun: '#fff0c8',
    light: '#fff1d6',
    lightI: 2.0,
    ambI: 0.6,
    elevation: 0.55,
    fogNear: 40,
    fogFar: 200,
  },
  {
    t: 1,
    top: '#3d86d8',
    horizon: '#dcecf8',
    sun: '#ffffff',
    light: '#ffffff',
    lightI: 2.4,
    ambI: 0.7,
    elevation: 0.95,
    fogNear: 25,
    fogFar: 150,
  },
].map((k) => ({
  ...k,
  top: new THREE.Color(k.top),
  horizon: new THREE.Color(k.horizon),
  sun: new THREE.Color(k.sun),
  light: new THREE.Color(k.light),
}))

const { lerp, smoothstep } = THREE.MathUtils

// Hasil interpolasi disimpan di sini supaya tidak bikin objek baru tiap frame
const out = {
  top: new THREE.Color(),
  horizon: new THREE.Color(),
  sun: new THREE.Color(),
  light: new THREE.Color(),
  lightI: 0,
  ambI: 0,
  elevation: 0,
  fogNear: 0,
  fogFar: 0,
}

function sample(t) {
  let i = 0
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++
  const a = KEYS[i]
  const b = KEYS[i + 1]
  const u = smoothstep(t, a.t, b.t)

  out.top.copy(a.top).lerp(b.top, u)
  out.horizon.copy(a.horizon).lerp(b.horizon, u)
  out.sun.copy(a.sun).lerp(b.sun, u)
  out.light.copy(a.light).lerp(b.light, u)
  out.lightI = lerp(a.lightI, b.lightI, u)
  out.ambI = lerp(a.ambI, b.ambI, u)
  out.elevation = lerp(a.elevation, b.elevation, u)
  out.fogNear = lerp(a.fogNear, b.fogNear, u)
  out.fogFar = lerp(a.fogFar, b.fogFar, u)
}

// Shader langit memakai nilai sRGB langsung supaya warnanya sama persis dengan kabut
const rgb = { r: 0, g: 0, b: 0 }
function setSrgb(vec, color) {
  color.getRGB(rgb, THREE.SRGBColorSpace)
  vec.set(rgb.r, rgb.g, rgb.b)
}

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform vec3 sunColor;
  uniform vec3 sunDir;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 col = mix(horizonColor, topColor, pow(h, 0.55));
    float glow = pow(max(dot(normalize(vDir), sunDir), 0.0), 18.0);
    col += sunColor * glow * 0.55;
    gl_FragColor = vec4(col, 1.0);
  }
`

export default function Atmosphere() {
  const scroll = useScroll()
  const sky = useRef()
  const sun = useRef()
  const ambient = useRef()

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          topColor: { value: new THREE.Vector3() },
          horizonColor: { value: new THREE.Vector3() },
          sunColor: { value: new THREE.Vector3() },
          sunDir: { value: new THREE.Vector3(0, 0.3, -1).normalize() },
        },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    []
  )

  useFrame((state) => {
    const t = scroll.offset
    sample(t)

    // Langit mengikuti kamera supaya tidak pernah "terkejar"
    sky.current.position.copy(state.camera.position)

    const u = material.uniforms
    setSrgb(u.topColor.value, out.top)
    setSrgb(u.horizonColor.value, out.horizon)
    setSrgb(u.sunColor.value, out.sun)

    const el = out.elevation
    const dir = u.sunDir.value
    dir.set(Math.cos(el) * Math.cos(SUN_AZIMUTH), Math.sin(el), Math.cos(el) * Math.sin(SUN_AZIMUTH))

    // Kabut selalu sewarna cakrawala
    const fog = state.scene.fog
    if (fog) {
      fog.color.copy(out.horizon)
      fog.near = out.fogNear
      fog.far = out.fogFar
    }

    sun.current.position.copy(dir).multiplyScalar(120)
    sun.current.color.copy(out.light)
    sun.current.intensity = out.lightI

    ambient.current.color.copy(out.top).lerp(new THREE.Color('#ffffff'), 0.6)
    ambient.current.intensity = out.ambI
  })

  return (
    <>
      <mesh ref={sky} frustumCulled={false} renderOrder={-1}>
        <sphereGeometry args={[400, 32, 16]} />
        <primitive object={material} attach="material" />
      </mesh>
      <ambientLight ref={ambient} />
      <directionalLight ref={sun} />
    </>
  )
}
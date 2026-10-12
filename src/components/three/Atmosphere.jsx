import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { getTargetHour } from '../../utils/timeOfDay'
import { skyState } from '../../utils/skyState'
import { mulberry32 } from '../../utils/terrain'

const { lerp, smoothstep } = THREE.MathUtils

const STAR_COUNT = 1700
const MILKY_WAY_STRENGTH = 0.4

// ---- Arah pita Bima Sakti ------------------------------------------------
// P = titik yang dilewati pita (kira-kira di belakang puncak dari kamera awal)
// T = arah pita (naik ke kanan). Ubah angkanya untuk memutar pita.
const P = new THREE.Vector3(0, 0.45, -1).normalize()
const T = new THREE.Vector3(1, 0.55, 0)
T.addScaledVector(P, -T.dot(P)).normalize()
const GALAXY_N = new THREE.Vector3().crossVectors(P, T).normalize()
const GALAXY_C = P.clone().multiplyScalar(Math.cos(0.45)).addScaledVector(T, Math.sin(0.45))

// ---- Keyframe langit (jam 0-24) ------------------------------------------
const COLOR_FIELDS = ['top', 'horizon', 'sun', 'light', 'hemi', 'cloud']
const NUM_FIELDS = ['glow', 'lightI', 'hemiI', 'fillI', 'stars']

const NIGHT = {
  top: '#040816', horizon: '#101a38', sun: '#000000', glow: 0,
  light: '#9db4ff', lightI: 0.55, hemi: '#2a3a6b', hemiI: 0.42,
  fillI: 0.2, cloud: '#2a3350', stars: 1,
}

const RAW_KEYS = [
  { h: 0, ...NIGHT },
  { h: 4.5, ...NIGHT, top: '#0b1436', horizon: '#2f3a6e', light: '#9aaee8', hemi: '#34447f', cloud: '#3a4268', stars: 0.8 },
  // Fajar
  { h: 5.3, top: '#2b3a7a', horizon: '#f0a38a', sun: '#ffb27a', glow: 0.6, light: '#ffb59a', lightI: 0.9, hemi: '#8a86b8', hemiI: 0.55, fillI: 0.4, cloud: '#e8b6a8', stars: 0.15 },
  // Matahari terbit
  { h: 6.3, top: '#4f7fc4', horizon: '#ffd2a1', sun: '#ffd08a', glow: 0.7, light: '#ffe0b8', lightI: 1.7, hemi: '#a9c4e6', hemiI: 0.8, fillI: 0.8, cloud: '#ffe3cf', stars: 0 },
  // Pagi
  { h: 8, top: '#4a8ad8', horizon: '#cfe3f3', sun: '#fff1c8', glow: 0.4, light: '#fff3dc', lightI: 2.0, hemi: '#b8d2ee', hemiI: 0.9, fillI: 0.9, cloud: '#ffffff', stars: 0 },
  // Siang
  { h: 12, top: '#2f7fe0', horizon: '#d9ecfa', sun: '#ffffff', glow: 0.3, light: '#ffffff', lightI: 2.4, hemi: '#c4dcf5', hemiI: 0.95, fillI: 0.9, cloud: '#ffffff', stars: 0 },
  { h: 14, top: '#2f7fe0', horizon: '#d9ecfa', sun: '#ffffff', glow: 0.3, light: '#ffffff', lightI: 2.4, hemi: '#c4dcf5', hemiI: 0.95, fillI: 0.9, cloud: '#ffffff', stars: 0 },
  // Sore
  { h: 16, top: '#3f82d0', horizon: '#f3e3c4', sun: '#ffe0a0', glow: 0.45, light: '#ffe9c4', lightI: 2.1, hemi: '#c4d6ea', hemiI: 0.9, fillI: 0.9, cloud: '#fff0dd', stars: 0 },
  { h: 17.4, top: '#5b7cc0', horizon: '#ffc78a', sun: '#ffb35c', glow: 0.75, light: '#ffc890', lightI: 1.7, hemi: '#d0b8c0', hemiI: 0.75, fillI: 0.7, cloud: '#ffd6b0', stars: 0 },
  // Senja
  { h: 18.1, top: '#4a3f86', horizon: '#ff8a6b', sun: '#ff7a4a', glow: 0.85, light: '#ff9a78', lightI: 1.0, hemi: '#8a6fa8', hemiI: 0.55, fillI: 0.4, cloud: '#c98aa0', stars: 0.1 },
  { h: 18.9, top: '#1a2257', horizon: '#6b5b95', sun: '#b06080', glow: 0.25, light: '#8fa0e0', lightI: 0.7, hemi: '#4a5290', hemiI: 0.45, fillI: 0.25, cloud: '#4a4a7a', stars: 0.55 },
  // Malam
  { h: 19.8, ...NIGHT },
  { h: 24, ...NIGHT },
]

const KEYS = RAW_KEYS.map((k) => {
  const o = { ...k }
  COLOR_FIELDS.forEach((f) => (o[f] = new THREE.Color(k[f])))
  return o
})

// Hasil interpolasi (dipakai ulang tiap frame supaya tidak bikin objek baru)
const out = { glow: 0, lightI: 0, hemiI: 0, fillI: 0, stars: 0 }
COLOR_FIELDS.forEach((f) => (out[f] = new THREE.Color()))

function sample(h) {
  let i = 0
  while (i < KEYS.length - 2 && h > KEYS[i + 1].h) i++
  const a = KEYS[i]
  const b = KEYS[i + 1]
  const u = smoothstep(h, a.h, b.h)
  COLOR_FIELDS.forEach((f) => out[f].copy(a[f]).lerp(b[f], u))
  NUM_FIELDS.forEach((f) => (out[f] = lerp(a[f], b[f], u)))
}

// ---- Posisi matahari & bulan ---------------------------------------------
// Matahari terbit jam 06 (sisi kanan layar awal), terbenam jam 18 (kiri).
// Bulan terbit jam 18, terbenam jam 06. Sedikit ke arah -z supaya terlihat
// dari kamera awal.
function sunVec(h, target) {
  const a = ((h - 6) / 12) * Math.PI
  return target.set(Math.cos(a), 0.8 * Math.sin(a), -1.3).normalize()
}
function moonVec(h, target) {
  const hn = h >= 12 ? h : h + 24
  const b = ((hn - 18) / 12) * Math.PI
  return target.set(Math.cos(b), 0.8 * Math.sin(b), -1.3).normalize()
}

const sunDir = new THREE.Vector3()
const moonDir = new THREE.Vector3()
const lightDir = new THREE.Vector3()
const tmpA = new THREE.Vector3()
const tmpB = new THREE.Vector3()
const WHITE = new THREE.Color('#ffffff')
const rgb = { r: 0, g: 0, b: 0 }

// Shader langit memakai nilai sRGB langsung supaya warnanya sama dengan kabut
function setSrgb(vec, color) {
  color.getRGB(rgb, THREE.SRGBColorSpace)
  vec.set(rgb.r, rgb.g, rgb.b)
}

// ---- Shader langit -------------------------------------------------------
const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const skyFragment = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform vec3 sunColor;
  uniform vec3 sunDir;
  uniform vec3 moonDir;
  uniform vec3 galaxyN;
  uniform vec3 galaxyC;
  uniform float glow;
  uniform float sunAmt;
  uniform float moonAmt;
  uniform float uNight;
  uniform float mwStrength;
  varying vec3 vDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }

  float fbm4(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float h = clamp(dir.y, 0.0, 1.0);
    vec3 col = mix(horizonColor, topColor, pow(h, 0.55));

    // Matahari: cakram + kilau + cahaya cakrawala di sisi matahari
    float sd = max(dot(dir, sunDir), 0.0);
    float sunGlow = pow(sd, 6.0) * 0.18 + pow(sd, 32.0) * 0.35;
    float sunDisc = smoothstep(0.9993, 0.9997, sd);
    col += sunColor * (sunGlow * glow + sunDisc * 1.4) * sunAmt;

    vec2 hd = normalize(dir.xz + vec2(1e-5));
    vec2 sh = normalize(sunDir.xz + vec2(1e-5));
    float side = pow(max(dot(hd, sh), 0.0), 3.0);
    col += sunColor * glow * 0.45 * side * pow(1.0 - h, 5.0) * sunAmt;

    // Bima Sakti (hanya dihitung saat gelap supaya hemat GPU)
    if (uNight > 0.01) {
      float band = dot(dir, galaxyN);
      float wide = exp(-band * band * 14.0);
      float thin = exp(-band * band * 80.0);
      float n = fbm4(dir * 4.0);
      float dust = smoothstep(0.45, 0.8, fbm3(dir * 8.0 + 5.0));
      float c = pow(max(dot(dir, galaxyC), 0.0), 8.0);
      float mw = (wide * 0.35 + thin * 0.9 + c * 0.8 * thin) * (0.45 + 1.1 * n) * (1.0 - 0.6 * dust);
      vec3 mwCol = mix(vec3(0.30, 0.38, 0.75), vec3(1.0, 0.82, 0.62), clamp(thin * n * 1.6 + c, 0.0, 1.0));
      col += mwCol * mw * mwStrength * uNight * smoothstep(0.0, 0.12, dir.y);
    }

    // Bulan
    float md = max(dot(dir, moonDir), 0.0);
    float moonDisc = smoothstep(0.9990, 0.9993, md) * (0.8 + 0.3 * noise(dir * 70.0));
    float moonHalo = pow(md, 90.0) * 0.5 + pow(md, 12.0) * 0.08;
    col += vec3(0.85, 0.9, 1.0) * (moonDisc * 1.15 + moonHalo) * moonAmt;

    gl_FragColor = vec4(col, 1.0);
  }
`

// ---- Shader bintang ------------------------------------------------------
const starVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uPx;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float tw = 0.75 + 0.25 * sin(uTime * 1.5 + aPhase);
    gl_PointSize = aSize * uPx * (0.9 + 0.2 * tw);
    vColor = aColor;
    vAlpha = uOpacity * tw * smoothstep(0.0, 0.12, normalize(position).y);
  }
`

const starFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`

export default function Atmosphere() {
  const scroll = useScroll()
  const sky = useRef()
  const starsRef = useRef()
  const hemi = useRef()
  const sun = useRef()
  const fill = useRef()
  const hour = useRef(getTargetHour())
  const uiDark = useRef(null)

  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: {
          topColor: { value: new THREE.Vector3() },
          horizonColor: { value: new THREE.Vector3() },
          sunColor: { value: new THREE.Vector3() },
          sunDir: { value: new THREE.Vector3() },
          moonDir: { value: new THREE.Vector3() },
          galaxyN: { value: GALAXY_N },
          galaxyC: { value: GALAXY_C },
          glow: { value: 0 },
          sunAmt: { value: 1 },
          moonAmt: { value: 0 },
          uNight: { value: 0 },
          mwStrength: { value: MILKY_WAY_STRENGTH },
        },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    []
  )

  const starGeo = useMemo(() => {
    const rand = mulberry32(5)
    const pos = new Float32Array(STAR_COUNT * 3)
    const size = new Float32Array(STAR_COUNT)
    const phase = new Float32Array(STAR_COUNT)
    const color = new Float32Array(STAR_COUNT * 3)
    const tints = [
      [1, 1, 1],
      [1, 0.86, 0.72],
      [0.72, 0.82, 1],
    ]

    for (let i = 0; i < STAR_COUNT; i++) {
      const y = 0.02 + rand() * 0.98 // belahan atas langit, sebaran merata
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(1 - y * y)
      pos.set([Math.cos(a) * r * 380, y * 380, Math.sin(a) * r * 380], i * 3)
      size[i] = 1.2 + Math.pow(rand(), 4) * 3.2 // kebanyakan kecil, sedikit yang terang
      phase[i] = rand() * Math.PI * 2
      color.set(tints[Math.floor(rand() * 3)], i * 3)
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    g.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
    return g
  }, [])

  const starMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: starVertex,
        fragmentShader: starFragment,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uPx: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    []
  )

  useEffect(() => () => document.documentElement.classList.remove('sky-dark'), [])

  useFrame((state, delta) => {
    // Jam bergerak halus menuju target lewat jalur terpendek (efek time-lapse)
    const target = getTargetHour()
    const diff = ((target - hour.current + 36) % 24) - 12
    hour.current = (hour.current + diff * (1 - Math.exp(-delta * 2.2)) + 24) % 24
    const h = hour.current

    sample(h)
    sunVec(h, sunDir)
    moonVec(h, moonDir)

    const day = smoothstep(sunDir.y, -0.12, 0.04)
    skyState.day = day
    skyState.stars = out.stars
    skyState.cloud.copy(out.cloud)

    // Langit mengikuti kamera supaya tidak pernah "terkejar"
    sky.current.position.copy(state.camera.position)
    starsRef.current.position.copy(state.camera.position)

    const u = skyMat.uniforms
    setSrgb(u.topColor.value, out.top)
    setSrgb(u.horizonColor.value, out.horizon)
    setSrgb(u.sunColor.value, out.sun)
    u.sunDir.value.copy(sunDir)
    u.moonDir.value.copy(moonDir)
    u.glow.value = out.glow
    u.sunAmt.value = smoothstep(sunDir.y, -0.1, 0.03)
    u.moonAmt.value = smoothstep(moonDir.y, 0, 0.06) * smoothstep(out.stars, 0.3, 0.7)
    u.uNight.value = out.stars

    // Bintang
    starsRef.current.visible = out.stars > 0.01
    starMat.uniforms.uTime.value = state.clock.elapsedTime
    starMat.uniforms.uOpacity.value = out.stars
    starMat.uniforms.uPx.value = state.gl.getPixelRatio()

    // Kabut sewarna cakrawala. Makin dekat puncak makin rapat
    // (menyembunyikan tepi terrain yang berbentuk persegi)
    const t = scroll.offset
    const fog = state.scene.fog
    if (fog) {
      fog.color.copy(out.horizon)
      fog.near = 45 - 20 * t
      fog.far = 235 - 85 * t
    }

    // Arah cahaya utama: matahari di siang hari, bulan di malam hari
    tmpA.set(sunDir.x, sunDir.y * 1.8 + 0.12, sunDir.z)
    tmpB.set(moonDir.x, moonDir.y * 1.8 + 0.12, moonDir.z)
    lightDir.copy(tmpB).lerp(tmpA, day).normalize()

    sun.current.position.copy(lightDir).multiplyScalar(120)
    sun.current.color.copy(out.light)
    sun.current.intensity = out.lightI

    hemi.current.color.copy(out.hemi)
    hemi.current.groundColor.copy(out.hemi).multiplyScalar(0.6)
    hemi.current.intensity = out.hemiI

    // Lampu isi dari arah kamera, supaya sisi gunung yang terlihat tidak gelap
    fill.current.position.copy(state.camera.position)
    fill.current.position.y += 30
    fill.current.color.copy(out.light).lerp(WHITE, 0.5)
    fill.current.intensity = out.fillI

    // Beri tahu CSS kalau langit sedang gelap, supaya teks header ikut terang
    const v = u.topColor.value
    const dark = 0.299 * v.x + 0.587 * v.y + 0.114 * v.z < 0.4
    if (dark !== uiDark.current) {
      uiDark.current = dark
      document.documentElement.classList.toggle('sky-dark', dark)
    }
  })

  return (
    <>
      <mesh ref={sky} frustumCulled={false} renderOrder={-2} material={skyMat}>
        <sphereGeometry args={[400, 32, 16]} />
      </mesh>
      <points
        ref={starsRef}
        frustumCulled={false}
        renderOrder={-1}
        geometry={starGeo}
        material={starMat}
      />
      <hemisphereLight ref={hemi} />
      <directionalLight ref={sun} />
      <directionalLight ref={fill} />
    </>
  )
}
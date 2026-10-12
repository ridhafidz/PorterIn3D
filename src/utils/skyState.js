import * as THREE from 'three'

// Diisi oleh Atmosphere tiap frame, dibaca komponen lain (awan, burung)
export const skyState = {
  day: 1, // 0 = malam, 1 = siang
  stars: 0,
  cloud: new THREE.Color('#ffffff'),
}
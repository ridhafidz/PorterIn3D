import Atmosphere from './Atmosphere'
import Terrain from './Terrain'
import Trail from './Trail'
import Trees from './Trees'
import Markers from './Markers'
import Clouds from './Clouds'
import Birds from './Birds'
import Snow from './Snow'
import CameraRig from './CameraRig'

export default function Scene() {
  return (
    <>
      <color attach="background" args={['#f6b998']} />
      <fog attach="fog" args={['#f6b998', 45, 235]} />

      <Atmosphere />
      <Terrain />
      <Trail />
      <Trees />
      <Markers />
      <Clouds />
      <Birds />
      <Snow />
      <CameraRig />
    </>
  )
}
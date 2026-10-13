import Atmosphere from './Atmosphere'
import Terrain from './Terrain'
import Trees from './Trees'
import Savanna from './Savanna'
import Summit from './Summit'
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
      <Trees />
      <Savanna />
      <Summit />
      <Clouds />
      <Birds />
      <Snow />
      <CameraRig />
    </>
  )
}
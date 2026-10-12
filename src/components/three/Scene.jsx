import Terrain from './Terrain'
import CameraRig from './CameraRig'

export default function Scene() {
  return (
    <>
      <color attach="background" args={['#c9d8e3']} />
      <fog attach="fog" args={['#c9d8e3', 50, 210]} />

      <ambientLight intensity={0.7} />
      <directionalLight position={[60, 80, 40]} intensity={2.2} color="#fff3e0" />

      <Terrain />
      <CameraRig />
    </>
  )
}
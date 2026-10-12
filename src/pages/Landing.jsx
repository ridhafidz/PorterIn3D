import { Canvas } from '@react-three/fiber'
import { ScrollControls, Scroll } from '@react-three/drei'
import Scene from '../components/three/Scene'

const sections = [
  {
    kicker: 'Teman Setia Pendakianmu',
    title: 'Pendakian tanpa ribet.',
    body: 'Pesan porter profesional, sewa gear, dan rencanakan perjalananmu dalam satu tempat.',
    align: 'left',
  },
  {
    kicker: 'Basecamp',
    title: 'Tiket & registrasi',
    body: 'Booking tiket masuk gunung favoritmu tanpa harus membuka web taman nasional satu per satu.',
    align: 'right',
  },
  {
    kicker: 'Pos 2',
    title: 'Sewa Smart Gear',
    body: 'Pilih paket Solo, Nyaman, atau Digital, bukan item satu per satu.',
    align: 'left',
  },
  {
    kicker: 'Pos 3',
    title: 'Porter Matchmaking',
    body: 'Dicocokkan berdasarkan pengalaman di gunung tujuan, bahasa, kondisi fisik, dan ulasan.',
    align: 'right',
  },
  {
    kicker: 'Puncak',
    title: 'Simulasikan pendakianmu',
    body: 'Estimasi biaya, cuaca, dan jalur sebelum kamu berangkat.',
    align: 'left',
  },
]

function Sections() {
  return (
    <div className="w-screen">
      {sections.map((s) => (
        <section
          key={s.title}
          className={`flex h-screen items-center px-6 md:px-20 ${
            s.align === 'right' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div className="max-w-md rounded-2xl bg-white/60 p-6 text-slate-900 shadow-lg backdrop-blur-md">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
              {s.kicker}
            </p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">{s.title}</h2>
            <p className="mt-3 text-slate-700">{s.body}</p>
          </div>
        </section>
      ))}
    </div>
  )
}

export default function Landing() {
  return (
    <div className="h-screen w-screen">
      <header className="pointer-events-none fixed left-0 top-0 z-10 flex w-full items-center justify-between px-6 py-4 md:px-20">
        <span className="text-xl font-bold text-slate-900">PorterIn</span>
        <span className="pointer-events-auto rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
          Get Started
        </span>
      </header>

      <Canvas camera={{ fov: 50, near: 0.1, far: 500, position: [0, 20, 88] }} dpr={[1, 1.5]}>
        <ScrollControls pages={5} damping={0.25}>
          <Scene />
          <Scroll html style={{ width: '100%' }}>
            <Sections />
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  )
}
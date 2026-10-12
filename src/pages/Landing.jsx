import { Canvas } from '@react-three/fiber'
import { ScrollControls, Scroll } from '@react-three/drei'
import Scene from '../components/three/Scene'
import SectionFader from '../components/ui/SectionFader'

const sections = [
  {
    kicker: 'Teman Setia Pendakianmu',
    title: 'Pendakian tanpa ribet.',
    body: 'Pesan porter profesional, sewa gear, dan rencanakan perjalananmu dalam satu tempat.',
    cls: 'justify-start items-end pb-16 md:pb-24',
  },
  {
    kicker: 'Basecamp',
    title: 'Tiket & registrasi',
    body: 'Booking tiket masuk gunung favoritmu tanpa harus membuka web taman nasional satu per satu.',
    cls: 'justify-end items-center',
  },
  {
    kicker: 'Pos 2',
    title: 'Sewa Smart Gear',
    body: 'Pilih paket Solo, Nyaman, atau Digital, bukan item satu per satu.',
    cls: 'justify-start items-center',
  },
  {
    kicker: 'Pos 3',
    title: 'Porter Matchmaking',
    body: 'Dicocokkan berdasarkan pengalaman di gunung tujuan, bahasa, kondisi fisik, dan ulasan.',
    cls: 'justify-end items-center',
  },
  {
    kicker: 'Puncak',
    title: 'Simulasikan pendakianmu',
    body: 'Estimasi biaya, cuaca, dan jalur sebelum kamu berangkat.',
    cls: 'justify-start items-center',
  },
]

function Sections() {
  return (
    <div className="w-screen">
      {sections.map((s) => (
        <section key={s.title} className={`flex h-screen px-6 md:px-20 ${s.cls}`}>
          <div
            data-fade
            className="max-w-sm rounded-2xl bg-white/60 p-6 text-slate-900 shadow-lg backdrop-blur-md md:max-w-md"
          >
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
    <div className="no-scrollbar h-screen w-screen">
      <header className="pointer-events-none fixed left-0 top-0 z-10 flex w-full items-center justify-between px-6 py-4 md:px-20">
        <span className="text-xl font-bold text-slate-900">PorterIn</span>
        <span className="pointer-events-auto rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
          Get Started
        </span>
      </header>

      {/* Progress pendakian */}
      <div className="pointer-events-none fixed right-4 top-1/2 z-10 h-40 w-1 -translate-y-1/2 overflow-hidden rounded-full bg-slate-900/15 md:right-8">
        <div
          data-progress
          className="h-full w-full origin-top rounded-full bg-orange-500"
          style={{ transform: 'scaleY(0)' }}
        />
      </div>

      {/* Hint scroll (hilang setelah mulai scroll) */}
      <div
        data-hint
        className="pointer-events-none fixed bottom-6 left-1/2 z-10 hidden -translate-x-1/2 md:block"
      >
        <span className="inline-block animate-bounce text-xs font-semibold uppercase tracking-widest text-white/90">
          Scroll untuk mendaki ↓
        </span>
      </div>

      <Canvas camera={{ fov: 55, near: 0.1, far: 600, position: [0, 16, 105] }} dpr={[1, 1.5]}>
        <ScrollControls pages={5} damping={0.25}>
          <Scene />
          <SectionFader count={5} />
          <Scroll html style={{ width: '100%' }}>
            <Sections />
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  )
}
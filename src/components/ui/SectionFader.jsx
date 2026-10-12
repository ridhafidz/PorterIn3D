import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MathUtils } from 'three'

const { clamp, smoothstep } = MathUtils

export default function SectionFader({ count }) {
  const scroll = useScroll()
  const cards = useRef([])
  const progress = useRef(null)
  const hint = useRef(null)

  useFrame(() => {
    // Elemen HTML dirender sedikit setelah canvas, jadi dicari sampai ketemu
    if (cards.current.length !== count) {
      cards.current = Array.from(document.querySelectorAll('[data-fade]'))
    }
    if (!progress.current) progress.current = document.querySelector('[data-progress]')
    if (!hint.current) hint.current = document.querySelector('[data-hint]')

    const o = scroll.offset

    cards.current.forEach((el, i) => {
      // d = jarak ke tengah section ini (satuan: satu layar). 0 = pas di tengah
      const d = o * (count - 1) - i
      const a = 1 - smoothstep(Math.abs(d), 0.3, 0.75)
      el.style.opacity = a.toFixed(3)
      el.style.transform = `translateY(${(d * 50).toFixed(1)}px) scale(${(0.96 + 0.04 * a).toFixed(3)})`
    })

    if (progress.current) progress.current.style.transform = `scaleY(${o.toFixed(3)})`
    if (hint.current) hint.current.style.opacity = String(1 - clamp(o * 12, 0, 1))
  })

  return null
}
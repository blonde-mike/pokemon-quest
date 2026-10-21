'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GameInputProvider, useInputDispatch, type GameButton } from './input'

export const SCREEN_W = 240
export const SCREEN_H = 160

function pickScale(availW: number, availH: number): number {
  const raw = Math.min(availW / SCREEN_W, availH / SCREEN_H)
  if (raw >= 2) return Math.floor(raw)
  return Math.max(1, Math.floor(raw * 4) / 4)
}

function Controller() {
  const press = useInputDispatch()
  const btn = (button: GameButton, label: string, extra = '') => (
    <button
      type="button"
      aria-label={button}
      onPointerDown={(e) => {
        e.preventDefault()
        press({ button, key: '' })
      }}
      className={`pixel-btn select-none touch-none ${extra}`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex w-full max-w-sm items-center justify-between px-6 py-4 md:hidden">
      <div className="grid grid-cols-3 grid-rows-3 gap-1">
        <div />
        {btn('up', '▲')}
        <div />
        {btn('left', '◀')}
        <div />
        {btn('right', '▶')}
        <div />
        {btn('down', '▼')}
        <div />
      </div>
      <div className="flex items-end gap-3">
        {btn('b', 'B', 'pixel-btn-round')}
        {btn('a', 'A', 'pixel-btn-round mb-6')}
      </div>
    </div>
  )
}

/**
 * Fixed 240x160 logical screen, integer-scaled to fit, pixel font, touch pad.
 * Children are laid out in logical pixels with absolute positioning.
 */
export default function GameScreen({ children }: { children: ReactNode }) {
  const areaRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setScale(pickScale(width - 8, height - 8))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <GameInputProvider>
      <div className="fixed inset-0 flex flex-col items-center bg-[#0f0f1a] text-[#1b1b2f]">
        <div ref={areaRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div
            className="pixel-bezel"
            style={{ width: SCREEN_W * scale, height: SCREEN_H * scale }}
          >
            <div
              className="pixel-screen font-pixel relative overflow-hidden bg-[#f8f8f8] text-[8px] leading-[12px]"
              style={{
                width: SCREEN_W,
                height: SCREEN_H,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              {children}
            </div>
          </div>
        </div>
        <Controller />
      </div>
    </GameInputProvider>
  )
}

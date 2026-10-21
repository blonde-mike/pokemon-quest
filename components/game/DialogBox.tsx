'use client'

import { useEffect, useState } from 'react'
import PixelSprite from './PixelSprite'
import { ARROW_DOWN } from '@/lib/pixel/sprites'
import { useGameInput } from './input'

// 240px screen, 2px border, 2px inner ring, 8px padding each side: 216px / 8px glyphs.
export const DIALOG_COLS = 26

/** Word-wrap to a fixed column count so typewriter reveal never reflows. */
export function wrapText(text: string, cols = DIALOG_COLS): string {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(' ')) {
      if (line.length === 0) {
        line = word
      } else if (line.length + 1 + word.length <= cols) {
        line += ' ' + word
      } else {
        lines.push(line)
        line = word
      }
    }
    lines.push(line)
  }
  return lines.join('\n')
}

type Props = {
  text: string
  /** Show the blinking "more" arrow. */
  showArrow?: boolean
  y?: number
  height?: number
}

/** The GB-style text frame. Dumb: renders exactly the text it is given. */
export default function DialogBox({ text, showArrow = false, y = 104, height = 56 }: Props) {
  return (
    <div
      className="pixel-frame absolute left-0 right-0 whitespace-pre px-[8px] py-[6px]"
      style={{ top: y, height }}
    >
      {text}
      {showArrow && (
        <div className="pixel-blink absolute" style={{ right: 6, bottom: 2 }}>
          <PixelSprite sprite={ARROW_DOWN} />
        </div>
      )}
    </div>
  )
}

type SequenceProps = {
  pages: readonly string[]
  onFinished: () => void
  /** When false, ignores input (another element owns the A button). */
  active?: boolean
  y?: number
  height?: number
}

/**
 * Typewriter dialog over several pages. A finishes the current page, then
 * turns the page, then calls onFinished. Mount with a `key` per sequence so
 * state resets.
 */
export function DialogSequence({ pages, onFinished, active = true, y, height }: SequenceProps) {
  const [page, setPage] = useState(0)
  const [shown, setShown] = useState(0)
  const full = wrapText(pages[page] ?? '')
  const done = shown >= full.length

  useEffect(() => {
    if (done) return
    const id = setInterval(() => setShown((n) => Math.min(full.length, n + 1)), 28)
    return () => clearInterval(id)
  }, [done, full.length])

  useGameInput((e) => {
    if (!active || e.button !== 'a') return
    if (!done) {
      setShown(full.length)
    } else if (page + 1 < pages.length) {
      setPage(page + 1)
      setShown(0)
    } else {
      onFinished()
    }
  })

  return <DialogBox text={full.slice(0, shown)} showArrow={done} y={y} height={height} />
}

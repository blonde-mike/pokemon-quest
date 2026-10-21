'use client'

import { useState } from 'react'
import { useGameInput } from './input'

const ROWS: readonly (readonly string[])[] = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
  ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '-'],
  ['0', '1', '2', '3', '4', '5', '6', '7', '8'],
  ['9', 'DEL', 'END'],
]

const GRID_X = 48
const GRID_Y = 38
const CELL_W = 16
const ROW_H = 13
const TYPEABLE = /^[A-Za-z0-9 .'-]$/

type Props = Readonly<{
  value: string
  max?: number
  onChange: (next: string) => void
  onSubmit: () => void
}>

/** Gen-1 style letter grid. Also accepts direct keyboard typing. */
export default function NameEntry({ value, max = 12, onChange, onSubmit }: Props) {
  const [row, setRow] = useState(0)
  const [col, setCol] = useState(0)

  const append = (ch: string) => {
    if (value.length < max) onChange(value + ch)
  }

  const activate = (cell: string) => {
    if (cell === 'DEL') onChange(value.slice(0, -1))
    else if (cell === 'END') {
      if (value.trim()) onSubmit()
    } else append(cell)
  }

  useGameInput((e) => {
    if (e.key === 'Enter') {
      if (value.trim()) onSubmit()
      return
    }
    if (e.key === 'Backspace') {
      onChange(value.slice(0, -1))
      return
    }
    if (TYPEABLE.test(e.key)) {
      append(e.key.toUpperCase())
      return
    }
    const lastRow = ROWS.length - 1
    switch (e.button) {
      case 'up':
        if (row === lastRow) {
          setRow(lastRow - 1)
          setCol(Math.min(8, col * 3 + 1))
        } else if (row > 0) {
          setRow(row - 1)
        }
        break
      case 'down':
        if (row === lastRow - 1) {
          setRow(lastRow)
          setCol(Math.min(ROWS[lastRow].length - 1, Math.floor(col / 3)))
        } else if (row < lastRow - 1) {
          setRow(row + 1)
        }
        break
      case 'left':
        setCol((c) => (c > 0 ? c - 1 : ROWS[row].length - 1))
        break
      case 'right':
        setCol((c) => (c < ROWS[row].length - 1 ? c + 1 : 0))
        break
      case 'a':
        activate(ROWS[row][col])
        break
      case 'b':
        onChange(value.slice(0, -1))
        break
    }
  })

  const slots = value.padEnd(max, '_').split('')

  return (
    <>
      <div className="absolute" style={{ left: 8, top: 6 }}>
        YOUR NAME?
      </div>
      <div className="absolute flex" style={{ left: 8, top: 20 }}>
        {slots.map((ch, i) => (
          <span key={i} style={{ width: 10 }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
        <span className="pixel-blink" style={{ marginLeft: 2 }}>
          {value.length < max ? '<' : ''}
        </span>
      </div>

      {ROWS.map((cells, r) =>
        cells.map((cell, c) => {
          const wide = cell.length > 1
          const x = r === ROWS.length - 1 && c > 0 ? GRID_X + CELL_W * (2 + (c - 1) * 3) : GRID_X + CELL_W * c
          const w = wide ? CELL_W * 3 : CELL_W
          const selected = r === row && c === col
          return (
            <div
              key={`${r}-${c}`}
              className={`absolute text-center ${selected ? 'bg-[#1b1b2f] text-[#f8f8f8]' : ''}`}
              style={{ left: x, top: GRID_Y + ROW_H * r, width: w, height: 12, lineHeight: '12px' }}
            >
              {cell}
            </div>
          )
        })
      )}
    </>
  )
}

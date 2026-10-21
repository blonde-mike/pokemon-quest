import type { CSSProperties } from 'react'
import { PALETTE, type SpriteMap } from '@/lib/pixel/sprites'

type Props = {
  sprite: SpriteMap
  /** Logical pixels per sprite pixel. */
  scale?: number
  className?: string
  style?: CSSProperties
  title?: string
}

type Run = { x: number; y: number; w: number; color: string }

function toRuns(sprite: SpriteMap): Run[] {
  const runs: Run[] = []
  sprite.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      if (ch === '.') {
        x++
        continue
      }
      let end = x + 1
      while (end < row.length && row[end] === ch) end++
      runs.push({ x, y, w: end - x, color: PALETTE[ch] ?? '#ff00ff' })
      x = end
    }
  })
  return runs
}

/** Renders a character-map sprite as crisp SVG rects. Server-safe. */
export default function PixelSprite({ sprite, scale = 1, className, style, title }: Props) {
  const h = sprite.length
  const w = sprite[0]?.length ?? 0
  const runs = toRuns(sprite)

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      shapeRendering="crispEdges"
      className={className}
      style={{ display: 'block', imageRendering: 'pixelated', ...style }}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
    >
      {runs.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </svg>
  )
}

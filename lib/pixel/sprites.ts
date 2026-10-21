// Original pixel art, authored as character maps. One char = one pixel.
// '.' is transparent. Every other char maps to PALETTE.
// Rendered by components/game/PixelSprite.tsx. Keep rows equal width.

export const PALETTE: Record<string, string> = {
  k: '#1b1b2f', // outline
  w: '#ffffff',
  d: '#555566', // dark grey
  m: '#9a9aa8', // mid grey
  h: '#e8e8e8', // hair / light grey
  p: '#f4c7a1', // skin
  c: '#5a3a2a', // brown
  t: '#8b5a2b', // wood
  o: '#f28c28', // orange
  O: '#c9571a', // dark orange
  y: '#ffe08a', // cream
  Y: '#ffd23f', // yellow flame
  r: '#e63946', // red flame
  R: '#d7263d', // pokeball red
  b: '#4a9fe0', // blue
  B: '#2d6fb0', // dark blue
  l: '#a8dcff', // light blue
  g: '#5cb85c', // green
  G: '#2f7a3a', // dark green
  L: '#a7e36a', // light green
}

export type SpriteMap = readonly string[]

export const FLAMELING: SpriteMap = [
  '................',
  '....kkkkk.......',
  '...kooooook.....',
  '..koooooooook...',
  '..kowkooooook...',
  '..koooooooook...',
  '...kooooooook...',
  '....kooooook....',
  '...koooyyook....',
  '..kooyyyyyook.Yk',
  '..kooyyyyyookYYk',
  '..kooyyyyookrYrk',
  '...kooooooookrrk',
  '....kookkook.kk.',
  '....kook..kook..',
  '.....kk....kk...',
]

export const AQUAPUP: SpriteMap = [
  '................',
  '.kk.........kk..',
  'kbbk.......kbbk.',
  'kbbbkkkkkkkbbbk.',
  'kbbbbbbbbbbbbbk.',
  '.kbbwkbbbbbwkbk.',
  '.kbbbbbbbbbbbbk.',
  '.kbbbbkkkbbbbk..',
  '..kbbbbbbbbbbk..',
  '..kbblwwwwlbbk..',
  '..kbblwwwwlbbk..',
  '..kbbblwwlbbbk..',
  '...kbbbbbbbbkk..',
  '...kbbkkkkbbk...',
  '...kbbk..kbbk...',
  '....kk....kk....',
]

export const LEAFLING: SpriteMap = [
  '.......kk.......',
  '......kLLk......',
  '.....kLLLLk.....',
  '......kLLk......',
  '....kkkggkkk....',
  '...kgggggggggk..',
  '..kggwkgggwkggk.',
  '..kgggggggggggk.',
  '..kggGgggggGggk.',
  '..kgggggkkgggkk.',
  '..kgggggggggggk.',
  '...kgggggggggk..',
  '....kgggggggk...',
  '.....kkgggkk....',
  '....kGGk.kGGk...',
  '.....kk...kk....',
]

export const POKEBALL: SpriteMap = [
  '....kkkk....',
  '..kkRRRRkk..',
  '.kRRRRRRRRk.',
  '.kRRwRRRRRk.',
  'kRRRRRRRRRRk',
  'kkkkkkkkkkkk',
  'kwwwwkkwwwwk',
  'kwwwkwwkwwwk',
  '.kwwwkkwwwk.',
  '.kwwwwwwwwk.',
  '..kkwwwwkk..',
  '....kkkk....',
]

export const PROFESSOR: SpriteMap = [
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhhhhhhhk...',
  '...khhkkkkhhk...',
  '...kppppppppk...',
  '...kpkppppkpk...',
  '...kppppppppk...',
  '....kpphhppk....',
  '.....kppppk.....',
  '....kkkkkkkk....',
  '..kkwwwkkwwwkk..',
  '.kwwwwwkkwwwwwk.',
  '.kwwwwwkkwwwwwk.',
  'kwwwwwwkkwwwwwwk',
  'kwkwwwwkkwwwwkwk',
  'kwkwwwwkkwwwwkwk',
  'kpkwwwwkkwwwwkpk',
  'kkkwwwwkkwwwwkkk',
  '...kwwwwwwwwk...',
  '...kwwwwwwwwk...',
  '...kcccckcccck..',
  '...kcccckcccck..',
  '...kcccckcccck..',
  '...kkkkk.kkkkk..',
]

export const ARROW_RIGHT: SpriteMap = [
  'k.......',
  'kk......',
  'kkk.....',
  'kkkk....',
  'kkk.....',
  'kk......',
  'k.......',
  '........',
]

export const ARROW_DOWN: SpriteMap = [
  '........',
  'kkkkkkk.',
  '.kkkkk..',
  '..kkk...',
  '...k....',
  '........',
  '........',
  '........',
]

export const SPRITES = {
  FLAMELING,
  AQUAPUP,
  LEAFLING,
  POKEBALL,
  PROFESSOR,
  ARROW_RIGHT,
  ARROW_DOWN,
} as const

export type SpriteName = keyof typeof SPRITES

/** Species name (as stored in pokemon_species) to sprite. */
export const SPECIES_SPRITES: Record<string, SpriteMap> = {
  Flameling: FLAMELING,
  Aquapup: AQUAPUP,
  Leafling: LEAFLING,
}

/** Throws if any sprite has ragged rows or unknown palette chars. */
export function validateSprites(): void {
  for (const [name, sprite] of Object.entries(SPRITES)) {
    const width = sprite[0].length
    sprite.forEach((row, i) => {
      if (row.length !== width) {
        throw new Error(`${name} row ${i} has width ${row.length}, expected ${width}`)
      }
      for (const ch of row) {
        if (ch !== '.' && !(ch in PALETTE)) {
          throw new Error(`${name} row ${i} uses unknown palette char "${ch}"`)
        }
      }
    })
  }
}

import { UserPokemon, PokemonSpecies } from './database'

export type PokemonWithSpecies = UserPokemon & {
  species: PokemonSpecies
}

export type BattleAction = {
  type: 'attack' | 'use_item' | 'switch' | 'run'
  pokemonId?: string
  itemId?: number
  targetId?: string
}

export type BattleState = {
  battleId: string
  playerPokemon: PokemonWithSpecies
  opponentPokemon: PokemonWithSpecies
  turn: number
  isPlayerTurn: boolean
  battleLog: string[]
  status: 'active' | 'won' | 'lost' | 'fled'
}

export type TypeEffectiveness = {
  [key: string]: {
    strong: string[]
    weak: string[]
    immune: string[]
  }
}

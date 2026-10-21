import { PokemonWithSpecies } from '@/types/game'

export const TYPE_CHART: { [key: string]: { strong: string[], weak: string[], immune: string[] } } = {
  Fire: { strong: ['Grass'], weak: ['Water', 'Rock'], immune: [] },
  Water: { strong: ['Fire', 'Rock'], weak: ['Grass', 'Electric'], immune: [] },
  Grass: { strong: ['Water', 'Rock'], weak: ['Fire', 'Flying'], immune: [] },
  Electric: { strong: ['Water', 'Flying'], weak: ['Ground'], immune: [] },
  Flying: { strong: ['Grass', 'Fighting'], weak: ['Electric', 'Rock'], immune: ['Ground'] },
  Rock: { strong: ['Fire', 'Flying'], weak: ['Water', 'Grass'], immune: [] },
  Ground: { strong: ['Electric', 'Fire', 'Rock'], weak: ['Water', 'Grass'], immune: ['Electric'] },
  Fighting: { strong: ['Normal', 'Rock'], weak: ['Flying', 'Psychic'], immune: [] },
  Psychic: { strong: ['Fighting', 'Poison'], weak: ['Bug', 'Ghost'], immune: [] },
  Poison: { strong: ['Grass'], weak: ['Ground', 'Psychic'], immune: [] },
  Bug: { strong: ['Grass', 'Psychic'], weak: ['Fire', 'Flying', 'Rock'], immune: [] },
  Ghost: { strong: ['Psychic', 'Ghost'], weak: ['Ghost'], immune: ['Normal', 'Fighting'] },
  Normal: { strong: [], weak: ['Fighting'], immune: ['Ghost'] },
}

export function calculateDamage(
  attacker: PokemonWithSpecies,
  defender: PokemonWithSpecies
): { damage: number; effectiveness: number; message: string } {
  const attackerType = attacker.species.type_primary
  const defenderType = defender.species.type_primary
  const defenderType2 = defender.species.type_secondary

  // Base damage calculation
  let baseDamage = Math.floor(
    ((2 * attacker.level / 5 + 2) * attacker.attack * 60) /
    (defender.defense * 50) + 2
  )

  // Type effectiveness
  let effectiveness = 1.0
  const typeMatchup = TYPE_CHART[attackerType]

  if (typeMatchup) {
    if (typeMatchup.immune.includes(defenderType)) {
      effectiveness = 0
    } else if (typeMatchup.strong.includes(defenderType)) {
      effectiveness = 2.0
    } else if (typeMatchup.weak.includes(defenderType)) {
      effectiveness = 0.5
    }

    // Check secondary type
    if (defenderType2 && effectiveness !== 0) {
      if (typeMatchup.immune.includes(defenderType2)) {
        effectiveness = 0
      } else if (typeMatchup.strong.includes(defenderType2)) {
        effectiveness *= 2.0
      } else if (typeMatchup.weak.includes(defenderType2)) {
        effectiveness *= 0.5
      }
    }
  }

  // Random factor (0.85 to 1.0)
  const randomFactor = 0.85 + Math.random() * 0.15

  const finalDamage = Math.max(1, Math.floor(baseDamage * effectiveness * randomFactor))

  let message = ''
  if (effectiveness === 0) {
    message = "It doesn't affect the foe!"
  } else if (effectiveness >= 2) {
    message = "It's super effective!"
  } else if (effectiveness <= 0.5) {
    message = "It's not very effective..."
  }

  return { damage: finalDamage, effectiveness, message }
}

export function calculateExperience(
  defeatedPokemon: PokemonWithSpecies,
  isWildBattle: boolean
): number {
  const baseExp = Math.floor(
    (defeatedPokemon.level * 50) * (isWildBattle ? 1 : 1.5)
  )
  return baseExp
}

export function checkLevelUp(
  currentExp: number,
  expToNext: number,
  level: number
): { leveledUp: boolean; newLevel: number; newExpToNext: number } {
  if (currentExp >= expToNext) {
    const newLevel = level + 1
    const remainingExp = currentExp - expToNext
    const newExpToNext = Math.floor(100 * Math.pow(1.1, newLevel - 1))

    return {
      leveledUp: true,
      newLevel,
      newExpToNext,
    }
  }

  return {
    leveledUp: false,
    newLevel: level,
    newExpToNext: expToNext,
  }
}

export function checkEvolution(
  pokemon: PokemonWithSpecies
): { canEvolve: boolean; evolvesIntoId: number | null } {
  const species = pokemon.species

  if (species.evolution_level && species.evolves_into) {
    if (pokemon.level >= species.evolution_level) {
      return {
        canEvolve: true,
        evolvesIntoId: species.evolves_into,
      }
    }
  }

  return {
    canEvolve: false,
    evolvesIntoId: null,
  }
}

export function determineFirstAttacker(
  pokemon1: PokemonWithSpecies,
  pokemon2: PokemonWithSpecies
): 'player' | 'opponent' {
  if (pokemon1.speed > pokemon2.speed) return 'player'
  if (pokemon2.speed > pokemon1.speed) return 'opponent'

  // Speed tie, random
  return Math.random() < 0.5 ? 'player' : 'opponent'
}

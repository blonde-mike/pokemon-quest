export type Profile = {
  id: string
  trainer_name: string
  money: number
  badges: number
  created_at: string
  updated_at: string
}

export type PokemonSpecies = {
  id: number
  name: string
  base_hp: number
  base_attack: number
  base_defense: number
  base_speed: number
  type_primary: string
  type_secondary: string | null
  sprite_url: string | null
  evolution_level: number | null
  evolves_into: number | null
  created_at: string
}

export type UserPokemon = {
  id: string
  user_id: string
  species_id: number
  nickname: string | null
  level: number
  current_hp: number
  max_hp: number
  attack: number
  defense: number
  speed: number
  experience: number
  experience_to_next_level: number
  is_in_party: boolean
  created_at: string
  updated_at: string
}

export type Battle = {
  id: string
  player1_id: string
  player2_id: string | null
  is_wild_battle: boolean
  winner_id: string | null
  experience_gained: number
  money_gained: number
  started_at: string
  ended_at: string | null
  battle_log: unknown
}

export type BattleParticipant = {
  id: string
  battle_id: string
  user_id: string
  pokemon_id: string
  damage_dealt: number
  damage_taken: number
  fainted: boolean
}

export type Trade = {
  id: string
  sender_id: string
  receiver_id: string
  sender_pokemon_id: string
  receiver_pokemon_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: string
  completed_at: string | null
}

export type Item = {
  id: number
  name: string
  description: string | null
  type: string
  effect_value: number | null
  price: number
  sprite_url: string | null
  created_at: string
}

export type UserInventory = {
  id: string
  user_id: string
  item_id: number
  quantity: number
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      pokemon_species: {
        Row: PokemonSpecies
        Insert: Omit<PokemonSpecies, 'id' | 'created_at'>
        Update: Partial<Omit<PokemonSpecies, 'id' | 'created_at'>>
      }
      user_pokemon: {
        Row: UserPokemon
        Insert: Omit<UserPokemon, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserPokemon, 'id' | 'created_at'>>
      }
      battles: {
        Row: Battle
        Insert: Omit<Battle, 'id' | 'started_at'>
        Update: Partial<Omit<Battle, 'id' | 'started_at'>>
      }
      battle_participants: {
        Row: BattleParticipant
        Insert: Omit<BattleParticipant, 'id'>
        Update: Partial<Omit<BattleParticipant, 'id'>>
      }
      trades: {
        Row: Trade
        Insert: Omit<Trade, 'id' | 'created_at'>
        Update: Partial<Omit<Trade, 'id' | 'created_at'>>
      }
      items: {
        Row: Item
        Insert: Omit<Item, 'id' | 'created_at'>
        Update: Partial<Omit<Item, 'id' | 'created_at'>>
      }
      user_inventory: {
        Row: UserInventory
        Insert: Omit<UserInventory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserInventory, 'id' | 'created_at'>>
      }
    }
    Functions: {
      create_trainer: {
        Args: { p_trainer_name: string; p_starter_species_id: number }
        Returns: string
      }
    }
  }
}

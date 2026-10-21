# Pokemon Game - Supabase Database Schema

## Overview
Database schema for Pokemon-like game with battles, trading, and progression.

## Tables

### 1. `profiles`
User profile data linked to Supabase Auth users.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_name TEXT UNIQUE NOT NULL,
  money INTEGER DEFAULT 3000,
  badges INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `pokemon_species`
Static Pokemon species data (shared across all users).

```sql
CREATE TABLE pokemon_species (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  base_hp INTEGER NOT NULL,
  base_attack INTEGER NOT NULL,
  base_defense INTEGER NOT NULL,
  base_speed INTEGER NOT NULL,
  type_primary TEXT NOT NULL,
  type_secondary TEXT,
  sprite_url TEXT,
  evolution_level INTEGER,
  evolves_into INTEGER REFERENCES pokemon_species(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. `user_pokemon`
Individual Pokemon owned by users.

```sql
CREATE TABLE user_pokemon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  species_id INTEGER NOT NULL REFERENCES pokemon_species(id),
  nickname TEXT,
  level INTEGER DEFAULT 5,
  current_hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  attack INTEGER NOT NULL,
  defense INTEGER NOT NULL,
  speed INTEGER NOT NULL,
  experience INTEGER DEFAULT 0,
  experience_to_next_level INTEGER DEFAULT 100,
  is_in_party BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. `battles`
Battle history between users or vs wild Pokemon.

```sql
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES profiles(id),
  player2_id UUID REFERENCES profiles(id),
  is_wild_battle BOOLEAN DEFAULT FALSE,
  winner_id UUID REFERENCES profiles(id),
  experience_gained INTEGER DEFAULT 0,
  money_gained INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  battle_log JSONB
);
```

### 5. `battle_participants`
Pokemon that participated in battles.

```sql
CREATE TABLE battle_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  pokemon_id UUID NOT NULL REFERENCES user_pokemon(id),
  damage_dealt INTEGER DEFAULT 0,
  damage_taken INTEGER DEFAULT 0,
  fainted BOOLEAN DEFAULT FALSE
);
```

### 6. `trades`
Trading history between users.

```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  sender_pokemon_id UUID NOT NULL REFERENCES user_pokemon(id),
  receiver_pokemon_id UUID NOT NULL REFERENCES user_pokemon(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### 7. `items`
Static item catalog.

```sql
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- potion, pokeball, evolution, battle
  effect_value INTEGER,
  price INTEGER NOT NULL,
  sprite_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. `user_inventory`
Items owned by users.

```sql
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_user_pokemon_user_id ON user_pokemon(user_id);
CREATE INDEX idx_user_pokemon_in_party ON user_pokemon(user_id, is_in_party) WHERE is_in_party = TRUE;
CREATE INDEX idx_battles_player1 ON battles(player1_id);
CREATE INDEX idx_battles_player2 ON battles(player2_id);
CREATE INDEX idx_trades_sender ON trades(sender_id);
CREATE INDEX idx_trades_receiver ON trades(receiver_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_user_inventory_user ON user_inventory(user_id);
```

## Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pokemon ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Pokemon policies
CREATE POLICY "Users can view own pokemon" ON user_pokemon FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pokemon" ON user_pokemon FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pokemon" ON user_pokemon FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pokemon" ON user_pokemon FOR DELETE USING (auth.uid() = user_id);

-- Battles policies
CREATE POLICY "Users can view own battles" ON battles FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);
CREATE POLICY "Users can insert battles" ON battles FOR INSERT WITH CHECK (auth.uid() = player1_id);
CREATE POLICY "Users can update own battles" ON battles FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Trades policies
CREATE POLICY "Users can view relevant trades" ON trades FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create trades" ON trades FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update relevant trades" ON trades FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Inventory policies
CREATE POLICY "Users can view own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own inventory" ON user_inventory FOR ALL USING (auth.uid() = user_id);
```

## Seed Data

### Starter Pokemon Species

```sql
INSERT INTO pokemon_species (name, base_hp, base_attack, base_defense, base_speed, type_primary, type_secondary, evolution_level, sprite_url) VALUES
  ('Flameling', 39, 52, 43, 65, 'Fire', NULL, 16, '/sprites/flameling.png'),
  ('Blazard', 58, 64, 58, 80, 'Fire', 'Flying', 36, '/sprites/blazard.png'),
  ('Infernix', 78, 84, 78, 100, 'Fire', 'Flying', NULL, '/sprites/infernix.png'),
  
  ('Aquapup', 44, 48, 65, 43, 'Water', NULL, 16, '/sprites/aquapup.png'),
  ('Hydrohound', 59, 63, 80, 58, 'Water', NULL, 36, '/sprites/hydrohound.png'),
  ('Tsunamax', 79, 83, 100, 78, 'Water', NULL, NULL, '/sprites/tsunamax.png'),
  
  ('Leafling', 45, 49, 49, 45, 'Grass', NULL, 16, '/sprites/leafling.png'),
  ('Vinebeast', 60, 62, 63, 60, 'Grass', 'Poison', 32, '/sprites/vinebeast.png'),
  ('Floratitan', 80, 82, 83, 80, 'Grass', 'Poison', NULL, '/sprites/floratitan.png');

-- Set evolution chains
UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Blazard') WHERE name = 'Flameling';
UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Infernix') WHERE name = 'Blazard';
UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Hydrohound') WHERE name = 'Aquapup';
UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Tsunamax') WHERE name = 'Hydrohound';
UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Vinebeast') WHERE name = 'Leafling';
UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Floratitan') WHERE name = 'Vinebeast';
```

### Basic Items

```sql
INSERT INTO items (name, description, type, effect_value, price, sprite_url) VALUES
  ('Potion', 'Restores 20 HP', 'potion', 20, 200, '/sprites/potion.png'),
  ('Super Potion', 'Restores 50 HP', 'potion', 50, 700, '/sprites/super-potion.png'),
  ('Pokeball', 'Catches wild Pokemon', 'pokeball', 50, 200, '/sprites/pokeball.png'),
  ('Great Ball', 'Better catch rate', 'pokeball', 75, 600, '/sprites/great-ball.png'),
  ('Ultra Ball', 'Best catch rate', 'pokeball', 90, 1200, '/sprites/ultra-ball.png'),
  ('Rare Candy', 'Increases level by 1', 'evolution', 1, 5000, '/sprites/rare-candy.png');
```

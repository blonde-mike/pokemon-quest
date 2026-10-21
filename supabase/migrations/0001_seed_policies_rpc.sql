-- Pokemon Quest: seed data, public-read policies, atomic trainer creation.
-- Idempotent. Paste into Supabase SQL Editor and run once (safe to re-run).
-- Assumes the tables from DATABASE_SCHEMA.md already exist.

-- ---------------------------------------------------------------------------
-- 1. Seed species (skips rows that already exist)
-- ---------------------------------------------------------------------------
INSERT INTO pokemon_species
  (name, base_hp, base_attack, base_defense, base_speed, type_primary, type_secondary, evolution_level)
VALUES
  ('Flameling',  39, 52, 43,  65, 'Fire',  NULL,     16),
  ('Blazard',    58, 64, 58,  80, 'Fire',  'Flying', 36),
  ('Infernix',   78, 84, 78, 100, 'Fire',  'Flying', NULL),
  ('Aquapup',    44, 48, 65,  43, 'Water', NULL,     16),
  ('Hydrohound', 59, 63, 80,  58, 'Water', NULL,     36),
  ('Tsunamax',   79, 83, 100, 78, 'Water', NULL,     NULL),
  ('Leafling',   45, 49, 49,  45, 'Grass', NULL,     16),
  ('Vinebeast',  60, 62, 63,  60, 'Grass', 'Poison', 32),
  ('Floratitan', 80, 82, 83,  80, 'Grass', 'Poison', NULL)
ON CONFLICT (name) DO NOTHING;

UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Blazard')    WHERE name = 'Flameling';
UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Infernix')   WHERE name = 'Blazard';
UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Hydrohound') WHERE name = 'Aquapup';
UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Tsunamax')   WHERE name = 'Hydrohound';
UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Vinebeast')  WHERE name = 'Leafling';
UPDATE pokemon_species SET evolves_into = (SELECT id FROM pokemon_species WHERE name = 'Floratitan') WHERE name = 'Vinebeast';

-- ---------------------------------------------------------------------------
-- 2. Seed items
-- ---------------------------------------------------------------------------
INSERT INTO items (name, description, type, effect_value, price) VALUES
  ('Potion',       'Restores 20 HP',       'potion',    20, 200),
  ('Super Potion', 'Restores 50 HP',       'potion',    50, 700),
  ('Pokeball',     'Catches wild Pokemon', 'pokeball',  50, 200),
  ('Great Ball',   'Better catch rate',    'pokeball',  75, 600),
  ('Ultra Ball',   'Best catch rate',      'pokeball',  90, 1200),
  ('Rare Candy',   'Increases level by 1', 'evolution',  1, 5000)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Static tables: RLS on, everyone may read, nobody may write via API
-- ---------------------------------------------------------------------------
ALTER TABLE pokemon_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE items           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read species" ON pokemon_species;
CREATE POLICY "Anyone can read species" ON pokemon_species FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read items" ON items;
CREATE POLICY "Anyone can read items" ON items FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- 4. Atomic trainer creation: profile + starter + starting items in one tx
--    SECURITY INVOKER, so existing RLS policies still apply to each insert.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_trainer(p_trainer_name text, p_starter_species_id integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_name       text := btrim(p_trainer_name);
  v_species    pokemon_species%ROWTYPE;
  v_pokemon_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_name IS NULL OR length(v_name) < 1 OR length(v_name) > 12 THEN
    RAISE EXCEPTION 'Trainer name must be 1 to 12 characters';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_uid) THEN
    RAISE EXCEPTION 'This account already has a trainer';
  END IF;

  SELECT * INTO v_species
  FROM pokemon_species
  WHERE id = p_starter_species_id
    AND name IN ('Flameling', 'Aquapup', 'Leafling');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid starter Pokemon';
  END IF;

  BEGIN
    INSERT INTO profiles (id, trainer_name, money, badges)
    VALUES (v_uid, v_name, 3000, 0);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'That trainer name is already taken';
  END;

  INSERT INTO user_pokemon
    (user_id, species_id, level, current_hp, max_hp, attack, defense, speed,
     experience, experience_to_next_level, is_in_party)
  VALUES
    (v_uid, v_species.id, 5, v_species.base_hp, v_species.base_hp,
     v_species.base_attack, v_species.base_defense, v_species.base_speed,
     0, 100, true)
  RETURNING id INTO v_pokemon_id;

  INSERT INTO user_inventory (user_id, item_id, quantity)
  SELECT v_uid, id, 5 FROM items WHERE name = 'Potion'
  ON CONFLICT (user_id, item_id) DO NOTHING;

  INSERT INTO user_inventory (user_id, item_id, quantity)
  SELECT v_uid, id, 10 FROM items WHERE name = 'Pokeball'
  ON CONFLICT (user_id, item_id) DO NOTHING;

  RETURN v_pokemon_id;
END;
$$;

REVOKE ALL ON FUNCTION create_trainer(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_trainer(text, integer) TO authenticated;

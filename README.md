# Pokemon Quest 🎮

A nostalgic Pokemon-like game built with Next.js, Supabase, and deployed on Vercel. Battle wild Pokemon, trade with other trainers, level up your team, and relive the classic Pokemon experience!

![Pokemon Quest](https://img.shields.io/badge/Status-Live-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-green)

## ✨ Features

### 🎯 Core Gameplay
- **Battle System** - Turn-based combat with wild Pokemon
- **Type Effectiveness** - Full type chart (Fire, Water, Grass, etc.)
- **Experience & Leveling** - Pokemon gain EXP and level up
- **Evolution System** - Pokemon evolve at specific levels
- **Trading System** - Trade Pokemon with other trainers
- **Inventory Management** - Collect and use items (Potions, Pokeballs, etc.)

### 🔐 Authentication & Profiles
- Supabase Auth integration
- Trainer profiles with unique names
- Persistent game data across sessions

### 🎨 Nostalgic UI
- Pixel-art inspired design
- Classic Pokemon color scheme
- Retro font styling
- Mobile-responsive layout

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deployment**: Vercel
- **State Management**: React Hooks + Supabase Real-time

## 📊 Database Schema

The game uses 8 main tables:

1. **profiles** - User/trainer data
2. **pokemon_species** - Static Pokemon species data
3. **user_pokemon** - Individual Pokemon owned by users
4. **battles** - Battle history and results
5. **battle_participants** - Pokemon in each battle
6. **trades** - Trading records between players
7. **items** - Item catalog (Potions, Pokeballs, etc.)
8. **user_inventory** - Items owned by each user

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete SQL schema.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### 1. Clone & Install

```bash
cd pokemon-game
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL from `DATABASE_SCHEMA.md` in the Supabase SQL Editor
3. Copy your project URL and anon key

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Import project in Vercel Dashboard
3. Add environment variables
4. Deploy

### Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🎮 How to Play

### 1. Create Account
- Sign up with email/password
- Choose your trainer name
- Select your starter Pokemon (Flameling 🔥, Aquapup 💧, or Leafling 🌿)

### 2. Battle Wild Pokemon
- Click "BATTLE" from the main menu
- Fight wild Pokemon to earn XP and money
- Use "ATTACK" to deal damage
- Run away if needed

### 3. Level Up & Evolve
- Pokemon gain experience from battles
- Level up to increase stats
- Evolve at specific levels

### 4. Trade with Others
- Click "TRADE" from the main menu
- Search for other trainers
- Offer Pokemon trades
- Accept/reject incoming trade offers

### 5. Manage Your Team
- View your party on the main screen
- Check Pokemon stats (HP, ATK, DEF, SPD)
- Use items from your inventory

## 🎯 Game Mechanics

### Battle System
- **Turn-based combat**
- **Speed determines turn order**
- **Type effectiveness** (2x damage, 0.5x damage, or immune)
- **Random damage variance** (85-100% of calculated damage)

### Experience Formula
```
Base EXP = Defeated Level × 50 × (Wild: 1.0, Trainer: 1.5)
```

### Level Up Requirements
```
EXP to Next Level = 100 × 1.1^(Level - 1)
```

### Type Chart
| Attacker | Strong Against | Weak Against |
|----------|---------------|--------------|
| Fire 🔥   | Grass         | Water, Rock  |
| Water 💧  | Fire, Rock    | Grass, Electric |
| Grass 🌿  | Water, Rock   | Fire, Flying |
| Electric ⚡| Water, Flying | Ground       |

## 📁 Project Structure

```
pokemon-game/
├── app/
│   ├── auth/
│   │   ├── login/          # Login/signup page
│   │   └── setup/          # Trainer setup (choose starter)
│   ├── game/               # Main game dashboard
│   ├── battle/             # Battle interface
│   ├── trade/              # Trading interface
│   └── page.tsx            # Landing page
├── lib/
│   ├── supabase/           # Supabase client/server setup
│   └── battle.ts           # Battle mechanics & calculations
├── types/
│   ├── database.ts         # Database type definitions
│   └── game.ts             # Game logic types
├── components/             # Reusable UI components
└── DATABASE_SCHEMA.md      # Complete database schema
```

## 🔒 Security & RLS

Row Level Security (RLS) is enabled on all tables:
- Users can only view/edit their own data
- Public read access for species/items
- Trade operations require both parties' consent

## 🐛 Known Issues & Future Enhancements

### Current Limitations
- Trading requires manual Pokemon selection (simplified UX)
- No catching mechanic yet (Pokeballs are decorative)
- No wild encounters while walking (direct battle mode only)
- No multiplayer battles (only vs wild Pokemon)

### Planned Features
- [ ] Catching wild Pokemon with Pokeballs
- [ ] Multiplayer trainer battles
- [ ] World map with encounters
- [ ] More Pokemon species (currently 9 starters)
- [ ] Abilities and moves system
- [ ] Items usage in battle
- [ ] Badges and progression system
- [ ] Leaderboards
- [ ] Real-time notifications
- [ ] Pokemon sprites/artwork

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This is a fan project for educational purposes. Pokemon is a trademark of Nintendo/Game Freak/Creatures Inc.

## 🙏 Acknowledgments

- Built with the [Agent Team Kit](https://github.com/anthropics/agent-team-kit)
- Inspired by classic Pokemon games
- Created with Claude Code agents

## 📧 Support

For issues or questions:
- Open a GitHub issue
- Check the [Database Schema](./DATABASE_SCHEMA.md) for SQL setup
- Review Supabase logs for auth/database errors

---

**Made with ❤️ by trainers, for trainers!**

*Gotta Code 'Em All!* 🎮✨

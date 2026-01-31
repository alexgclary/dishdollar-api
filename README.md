# DishDollar

A recipe and meal planning app that helps users discover healthy, affordable recipes and purchase ingredients at real-time prices from their preferred grocery stores.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an `.env.local` file (optional - app works in demo mode without these):
   ```
   # Supabase Configuration (optional)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Backend API (optional)
   VITE_API_BASE_URL=your_heroku_backend_url
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Demo Mode

The app works fully in demo mode without any external services. All data is stored in localStorage. This is great for:
- Testing and development
- Demonstrations
- Quick setup without backend configuration

### Production Mode

For production, configure Supabase for:
- User authentication
- Data persistence
- Cross-device sync

## Deployment

### Vercel (Frontend)

```bash
vercel deploy
```

### Heroku (Backend)

```bash
git push heroku main
```

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (frontend), Heroku (backend)

## Features

- Recipe discovery and management
- Meal planning calendar
- Shopping list generation
- Budget tracking
- Pantry management
- Multiple dietary preferences support

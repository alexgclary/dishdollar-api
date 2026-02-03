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

3. Copy the environment example file:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your environment variables (see [Environment Variables](#environment-variables) section)

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

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | No* | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No* | Supabase anonymous key |
| `VITE_INSTACART_API_KEY` | No | Instacart Developer Platform API key |

*App runs in demo mode (localStorage) if Supabase is not configured.

---

## Integrations

### Instacart Developer Platform

The Instacart integration enables shoppable recipe pages, nearby retailer lookup, and affiliate revenue.

#### Features
- **Shoppable Recipes**: One-click "Add to Cart" for all ingredients
- **Nearby Retailers**: Find stores with Instacart delivery
- **Affiliate Revenue**: 5% commission on completed orders

#### Setup

1. **Apply for API Access**: [Instacart Developer Platform](https://www.instacart.com/company/business/developers)
2. **Build Integration**: Use `src/services/instacart.js`
3. **Add API Key**: Set `VITE_INSTACART_API_KEY` in `.env.local`

#### Usage

```javascript
import { createShoppableRecipe, getNearbyRetailers } from '@/services/instacart';

// Create shoppable recipe page
const { recipe_url } = await createShoppableRecipe(recipe, {
  linkback_url: 'https://dishdollar.com/recipe/123'
});

// Find nearby stores
const { retailers } = await getNearbyRetailers({ postal_code: '80202' });
```

See [INSTACART_ONBOARDING.md](./INSTACART_ONBOARDING.md) for detailed setup instructions.

### Kroger API (Fallback)

Real-time pricing from Kroger & affiliated stores (King Soopers, Ralphs, Fred Meyer, etc.). Used as primary pricing source and fallback when Instacart is unavailable.

---

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

 

# DishDollar

Recipe discovery and meal planning app that helps users find recipes and purchase ingredients through Instacart delivery.

## Features

- **Recipe Discovery** - Browse and search recipes from popular food blogs
- **Recipe Import** - Parse any recipe URL to extract ingredients and instructions
- **Instacart Integration** - One-click shopping for recipe ingredients via Instacart
- **Kroger Pricing** - Real-time pricing for Kroger-family stores
- **Meal Planning** - Plan your weekly meals and generate shopping lists
- **Pantry Tracking** - Track what you have to avoid duplicate purchases
- **Dietary Preferences** - Filter recipes by cuisine, diet, and allergies

## Tech Stack

| Layer | Technology | Deployment |
|-------|------------|------------|
| Frontend | React 18 + Vite + Tailwind CSS | Vercel |
| Backend | Node.js + Express | Heroku |
| Database | Supabase (PostgreSQL) | Supabase Cloud |
| Auth | Supabase Auth (Google OAuth) | Supabase Cloud |

### Frontend Dependencies
- React Router v6
- TanStack Query (React Query)
- shadcn/ui components
- Framer Motion
- Lucide React icons

### Backend Dependencies
- Express.js
- Cheerio (HTML parsing)
- @supabase/supabase-js

### External APIs
- **Instacart Developer Platform** - Shopping links and retailer lookup
- **Kroger API** - Store locations and product pricing

## Project Structure

```
dishdollar-api/
├── src/                              # Frontend React app
│   ├── components/
│   │   ├── stores/                   # Store selector components
│   │   ├── recipes/                  # Recipe cards, filters
│   │   ├── onboarding/               # Onboarding flow
│   │   └── ui/                       # shadcn/ui components
│   ├── pages/
│   │   ├── Home.jsx                  # Recipe discovery
│   │   ├── RecipeDetails.jsx         # Single recipe view
│   │   ├── ShoppingList.jsx          # Shopping list
│   │   ├── MealPlanner.jsx           # Meal planning
│   │   └── Onboarding.jsx            # New user setup
│   ├── services/                     # API client utilities
│   └── hooks/                        # Custom React hooks
│
├── budgetbite-api-backend/           # Backend Express server
│   ├── server.js                     # API routes
│   ├── package.json
│   └── .env.example
│
├── .env.development                  # Frontend dev config
├── .env.production                   # Frontend prod config
└── package.json                      # Frontend dependencies
```

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Kroger Developer Account (for pricing features)
- Instacart Developer Account (for shopping links)
- Supabase project (for auth and database)

### Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file (if not exists)
cp .env.example .env.development

# Start development server
npm run dev
# Runs on http://localhost:5173
```

### Backend Setup

```bash
cd budgetbite-api-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API credentials

# Start development server
npm run dev
# Runs on http://localhost:3000
```

### Demo Mode

The app works in demo mode without external services - data stored in localStorage. Great for testing and development.

## Environment Variables

### Frontend (.env.development / .env.production)

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL
VITE_API_BASE_URL=http://localhost:3000  # or Heroku URL for production
```

### Backend (.env)

```bash
# Kroger API (https://developer.kroger.com)
KROGER_CLIENT_ID=your_kroger_client_id
KROGER_CLIENT_SECRET=your_kroger_client_secret

# Instacart IDP API (https://docs.instacart.com/developer_platform_api/)
INSTACART_API_URL=https://connect.dev.instacart.tools  # or connect.instacart.com for prod
INSTACART_API_KEY=your_instacart_api_key

# Supabase (for URL caching)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Server
PORT=3000

# Optional: Log requests without calling APIs
DRY_RUN=false
```

## Backend API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and feature flags.

### Instacart Integration

**Create Recipe Page**
```
POST /api/instacart/recipe
```
Creates a shoppable recipe page on Instacart. Returns URL to Instacart Marketplace.

Request:
```json
{
  "title": "Chicken Stir Fry",
  "image_url": "https://...",
  "ingredients": [
    { "name": "chicken breast", "quantity": 2, "unit": "lb" }
  ],
  "servings": 4,
  "recipe_id": "optional-for-caching"
}
```

Response:
```json
{
  "url": "https://www.instacart.com/store/recipes/...",
  "cached": false
}
```

**Create Shopping List**
```
POST /api/instacart/shopping-list
```
Creates a shopping list page on Instacart.

**Get Retailers**
```
GET /api/instacart/retailers?postal_code=80202
```
Returns available Instacart retailers for a ZIP code.

### Kroger Integration

```
GET /api/kroger/locations?zip=80202&radius=10
```
Returns Kroger-family store locations near a ZIP code.

```
GET /api/kroger/products?term=chicken&locationId=01234567
```
Searches for products at a specific Kroger location.

```
POST /api/prices/search
```
Gets real-time prices for a list of ingredients from Kroger.

```
POST /api/prices/estimate
```
Returns estimated prices when real-time pricing unavailable.

### Recipe Parsing

```
POST /api/recipe/parse
```
Parses a recipe URL and extracts structured data.

```
POST /api/recipe/parse-with-prices
```
Parses recipe URL and includes Kroger pricing.

```
POST /api/recipes/discover
```
Discovers recipes by category and dietary preferences.

## Deployment

### Frontend (Vercel)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

Or manually:
```bash
npm run build
vercel deploy
```

### Backend (Heroku)

```bash
cd budgetbite-api-backend

# Login to Heroku
heroku login

# Create app (first time only)
heroku create budgetbite-api

# Set environment variables
heroku config:set KROGER_CLIENT_ID=xxx
heroku config:set KROGER_CLIENT_SECRET=xxx
heroku config:set INSTACART_API_KEY=xxx
heroku config:set INSTACART_API_URL=https://connect.instacart.com
heroku config:set SUPABASE_URL=xxx
heroku config:set SUPABASE_SERVICE_KEY=xxx

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## Database Schema

Key tables in Supabase:

- **profiles** - User preferences, preferred_retailer_key, location
- **recipes** - Saved/imported recipes
- **meal_plans** - Weekly meal planning
- **shopping_lists** - User shopping lists
- **pantry_items** - Pantry inventory
- **instacart_recipe_links** - URL cache (13-day expiry)

## Resources

- [Instacart Developer Platform Docs](https://docs.instacart.com/developer_platform_api/)
- [Kroger Developer Portal](https://developer.kroger.com/)
- [Supabase Documentation](https://supabase.com/docs)

## License

MIT

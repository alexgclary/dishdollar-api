# DishDollar - Executive Summary

## Overview

**DishDollar** is a recipe and meal planning web application designed to help users discover healthy, affordable recipes and purchase ingredients at real-time prices from their preferred grocery stores. The app bridges the gap between recipe discovery and practical grocery shopping.

---

## Core Functions

### User Features

| Feature | Description |
|---------|-------------|
| **Recipe Discovery** | AI-powered recipe suggestions based on user preferences, dietary restrictions, and budget |
| **Recipe Import** | Extract recipes from popular cooking websites with automatic ingredient parsing |
| **Real-Time Pricing** | Live ingredient pricing from Kroger-family stores |
| **Meal Planning** | Weekly meal planning with drag-and-drop calendar interface |
| **Shopping List** | Auto-generated shopping lists from recipes with pantry item exclusion |
| **Budget Tracking** | Monitor grocery spending against weekly/monthly budgets |
| **Pantry Management** | Track items you already have to reduce shopping costs |
| **User Profiles** | Personalized experience with cuisine preferences and dietary restrictions |

### Recipe Sources

The app can import recipes from:
- AllRecipes, NYT Cooking, Epicurious, Serious Eats
- Bon Appetit, Food Network, Simply Recipes
- Half Baked Harvest, Budget Bytes, Skinnytaste
- BBC Good Food, and more

### Supported Cuisines
Italian, Mexican, Indian, Chinese, American, Mediterranean, Japanese, Thai, French, Korean, Vietnamese, Greek, Spanish, Middle Eastern, Brazilian, Caribbean, Ethiopian, German

### Dietary Options
Vegetarian, Vegan, Keto, Paleo, Pescatarian, Gluten-Free, Dairy-Free, Carnivore, Low-Carb, Halal, Kosher, Whole30

---

## Technical Architecture

### Application Structure

```
Frontend (React/Vite)     -->    Vercel (Hosting)
         |
         v
Backend API (Node.js)     -->    Heroku (API Services)
         |
         v
Database (PostgreSQL)     -->    Supabase (Auth + Data)
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + Vite | User interface |
| Styling | Tailwind CSS + shadcn/ui | Design system |
| State Management | TanStack Query (React Query) | Data fetching & caching |
| Animations | Framer Motion | UI animations |
| Routing | React Router v6 | Client-side routing |
| Backend API | Node.js/Express | Recipe parsing, Kroger API |
| Database | PostgreSQL (Supabase) | User data, recipes, meal plans |
| Authentication | Supabase Auth | Email + Google OAuth |
| Hosting (Frontend) | Vercel | Auto-deploy from GitHub |
| Hosting (Backend) | Heroku | API services |

### Key Dependencies

```json
{
  "react": "18.2.0",
  "vite": "6.1.0",
  "@supabase/supabase-js": "2.39.0",
  "@tanstack/react-query": "5.84.1",
  "framer-motion": "11.16.4",
  "tailwindcss": "3.4.17",
  "lucide-react": "0.475.0"
}
```

---

## Accounts & Services Reference

### Service Accounts

| Service | Purpose | Dashboard URL |
|---------|---------|---------------|
| **GitHub** | Source code repository | https://github.com/alexgclary/budgetbite |
| **Vercel** | Frontend hosting & deployment | https://vercel.com/dashboard |
| **Supabase** | Database & authentication | https://supabase.com/dashboard |
| **Heroku** | Backend API hosting | https://dashboard.heroku.com |
| **Kroger Developer** | Grocery pricing API | https://developer.kroger.com |

### Environment Variables

#### Frontend (Vercel)
```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

#### Backend (Heroku)
```
DATABASE_URL=<supabase-connection-string>
SUPABASE_SERVICE_KEY=<service-role-key>
KROGER_CLIENT_ID=<kroger-api-client-id>
KROGER_CLIENT_SECRET=<kroger-api-client-secret>
```

### API Endpoints

| Endpoint | Base URL |
|----------|----------|
| Frontend | https://dishdollar.vercel.app (or custom domain) |
| Backend API | https://budgetbite-api-69cb51842c10.herokuapp.com |

---

## User Guide

### Getting Started (New Users)

1. **Visit the App** - Navigate to the DishDollar website
2. **Create Account** - Sign up with email or Google
3. **Complete Onboarding**:
   - Enter your name
   - Set your location (for store pricing)
   - Select your preferred grocery store
   - Choose your favorite cuisines
   - Set dietary preferences (optional)
   - Configure your household size and budget
   - Select pantry items you already have
   - Enable notifications (optional)
4. **Explore Recipes** - Browse personalized recipe suggestions
5. **Import Recipes** - Paste URLs from your favorite recipe sites
6. **Plan Meals** - Drag recipes to your weekly calendar
7. **Generate Shopping List** - Automatically create lists from meal plans

### Key User Actions

#### Importing a Recipe
1. Go to "Add Recipe"
2. Paste a recipe URL from a supported site
3. Click "Extract Recipe"
4. Review ingredients and pricing
5. Mark any items you have in your pantry
6. Click "Save Recipe" or "Add to Shopping List"

#### Creating a Meal Plan
1. Navigate to "Meal Plan"
2. Browse your saved recipes
3. Drag recipes to days of the week
4. View the combined shopping list
5. Check off items as you shop

#### Using the Shopping List
1. Open "Shopping List"
2. View items grouped by recipe or category
3. Check off items as you add them to cart
4. Use "Copy to Clipboard" for store apps
5. Clear checked items when done

---

## Admin Guide

### Accessing the Admin Dashboard

1. Log in with an admin email account
   - Configured admins: `alex@dishdollar.app`, `admin@dishdollar.app`
2. Navigate to `/Admin` or access through developer tools
3. View real-time statistics

### Admin Dashboard Features

| Section | Description |
|---------|-------------|
| **Total Users** | Count of registered accounts |
| **Total Recipes** | Recipes in the database |
| **Meal Plans** | Active user meal plans |
| **Auth Providers** | Breakdown by Email/Google/Demo |
| **Recent Signups** | Latest user registrations |

### Database Management (Supabase)

#### Accessing Supabase
1. Log in at https://supabase.com/dashboard
2. Select your project
3. Navigate to "Table Editor" for data

#### Key Tables

| Table | Purpose |
|-------|---------|
| `user_profiles` | User preferences, settings, onboarding data |
| `recipes` | Stored recipes with ingredients |
| `saved_recipes` | User's saved/favorited recipes |
| `meal_plans` | Weekly meal planning data |
| `budget_entries` | Budget tracking records |
| `shopping_lists` | Persisted shopping lists |
| `pantry_items` | User's pantry inventory |

#### Common Admin Tasks

**View All Users:**
```sql
SELECT * FROM user_profiles ORDER BY created_date DESC;
```

**Check Recipe Count by Cuisine:**
```sql
SELECT unnest(cuisines) as cuisine, COUNT(*)
FROM recipes
GROUP BY cuisine
ORDER BY count DESC;
```

**Find Active Users (last 7 days):**
```sql
SELECT * FROM user_profiles
WHERE updated_at > NOW() - INTERVAL '7 days';
```

### Backend API (Heroku)

#### Accessing Heroku
1. Log in at https://dashboard.heroku.com
2. Select the `budgetbite-api` app
3. View logs: Click "More" > "View logs"

#### Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/recipe/parse` | POST | Extract recipe from URL |
| `/api/recipe/parse-with-prices` | POST | Extract with Kroger pricing |
| `/api/recipes/discover` | POST | AI recipe discovery |
| `/api/kroger/locations` | GET | Find Kroger stores by ZIP |
| `/api/prices/estimate` | POST | Estimate ingredient prices |

#### Viewing Logs
```bash
heroku logs --tail --app budgetbite-api
```

#### Restarting the API
```bash
heroku restart --app budgetbite-api
```

### Vercel Deployment

#### Accessing Vercel
1. Log in at https://vercel.com/dashboard
2. Select the DishDollar project
3. View deployments and logs

#### Triggering a Deployment
- Push to `main` branch for automatic deploy
- Or click "Redeploy" in Vercel dashboard

#### Checking Build Status
- View in Vercel dashboard under "Deployments"
- Failed builds show error logs

### Kroger API Integration

The app uses Kroger's API for real-time pricing. Supported store chains:
- Kroger, Ralphs, Fred Meyer, King Soopers
- Smith's, Fry's, Harris Teeter, QFC
- Food 4 Less, Pick N Save, Metro Market
- Mariano's, Dillons, Baker's, City Market

#### API Limits
- Check developer.kroger.com for current rate limits
- API keys are stored in Heroku environment variables

---

## Development Commands

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

### Deployment

```bash
# Frontend (auto-deploys on push to main)
git push origin main

# Backend (Heroku)
git push heroku main

# View Heroku logs
heroku logs --tail
```

---

## File Structure

```
budgetbite_claude/
├── src/
│   ├── api/              # API clients (Supabase)
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── recipes/      # Recipe-specific components
│   │   ├── budget/       # Budget tracking components
│   │   └── onboarding/   # Onboarding flow components
│   ├── pages/            # Page components
│   │   ├── Home.jsx      # Main dashboard
│   │   ├── AddRecipe.jsx # Recipe import
│   │   ├── MealPlanner.jsx # Weekly planning
│   │   ├── ShoppingList.jsx # Shopping lists
│   │   ├── Budget.jsx    # Budget tracking
│   │   ├── Profile.jsx   # User settings
│   │   ├── Admin.jsx     # Admin dashboard
│   │   └── Onboarding.jsx # New user setup
│   ├── services/         # Business logic
│   │   ├── auth.js       # Authentication
│   │   ├── entities.js   # Data models
│   │   └── recipeDiscovery.js # Recipe fetching
│   └── utils/            # Helper functions
├── public/               # Static assets
├── CLAUDE.md             # Development guide
├── EXECUTIVE_SUMMARY.md  # This file
└── package.json          # Dependencies
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Onboarding loops** | Clear localStorage: `localStorage.clear()` |
| **Recipes not loading** | Check Supabase connection and API keys |
| **Prices not showing** | Verify Kroger API credentials in Heroku |
| **Login not working** | Check Supabase Auth settings and OAuth redirect URLs |
| **Deploy failed** | Check Vercel build logs for errors |

### Support Resources

- **CLAUDE.md** - Detailed development instructions
- **Supabase Docs** - https://supabase.com/docs
- **Vercel Docs** - https://vercel.com/docs
- **Heroku Docs** - https://devcenter.heroku.com

---

## Future Roadmap

- **Instacart Integration** - Multi-store support via Instacart Developer Platform
- **Affiliate Program** - Monetization through Instacart affiliate commissions
- **Recipe Website Scanning** - Automated daily scanning for new recipes
- **Fresh Ingredient Preferences** - Smart filtering for fresh vs pre-packaged items
- **Enhanced AI Discovery** - Claude Opus integration for better ingredient parsing

---

*Last Updated: January 30, 2026*
*Version: 2.0*

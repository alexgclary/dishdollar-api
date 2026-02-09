# CLAUDE.md - DishDollar Development Guide

## Project Overview

**DishDollar** is a recipe discovery and meal planning app that helps users find recipes and purchase ingredients from their preferred grocery stores. The app bridges recipe discovery with practical grocery shopping by generating shoppable links through Instacart's Developer Platform.

### Core Features
- Parse recipe URLs and extract structured ingredient lists
- Generate Instacart shopping links for any recipe
- Connect users to their preferred grocery retailers
- Support for Kroger-family stores with direct pricing
- Meal planning and shopping list management
- Pantry tracking to avoid duplicate purchases

---

## Tech Stack

| Layer | Technology | Deployment |
|-------|------------|------------|
| Frontend | React 18 + Vite + Tailwind CSS | Vercel |
| Backend | Node.js + Express | Heroku |
| Database | Supabase (PostgreSQL) | Supabase Cloud |
| Auth | Supabase Auth | Supabase Cloud |
| Repository | GitHub (DishDollar-API) | Connected to Vercel |

### Frontend Dependencies
- React Router v6 for navigation
- TanStack Query for data fetching
- shadcn/ui component library
- Framer Motion for animations
- Lucide React for icons

### Backend Dependencies
- Express.js for API routes
- Cheerio for HTML parsing (recipe extraction)
- @supabase/supabase-js for caching

---

## API Integrations

### Instacart Developer Platform (IDP)

**Important**: Instacart IDP generates **links** to Instacart Marketplace pages. It does NOT:
- Provide pricing data
- Create carts directly in our app
- Show individual store locations (only retailer brands)
- Embed checkout in our app

**Current Status**: Development API key (sandbox environment)

#### Base URLs
```
Development: https://connect.dev.instacart.tools
Production:  https://connect.instacart.com
```

#### Authentication
```
Authorization: Bearer <INSTACART_API_KEY>
Content-Type: application/json
```

#### Endpoints We Use

**1. Create Recipe Page**
```
POST /idp/v1/products/recipe
```
Creates a shoppable recipe page on Instacart. Returns a URL where users can add all ingredients to their cart.

Request:
```json
{
  "title": "Recipe Name",
  "image_url": "https://...",
  "servings": 4,
  "cooking_time": 30,
  "ingredients": [
    {
      "name": "chicken breast",
      "display_text": "2 lbs boneless chicken breast",
      "measurements": [
        { "quantity": 2, "unit": "pound" }
      ]
    }
  ],
  "landing_page_configuration": {
    "partner_linkback_url": "https://dishdollar.com/recipe/123",
    "enable_pantry_items": true
  }
}
```

Response:
```json
{
  "products_link_url": "https://www.instacart.com/store/recipes/abc123..."
}
```

**2. Create Shopping List Page**
```
POST /idp/v1/products/products_link
```
Creates a shopping list page on Instacart for arbitrary items.

Request:
```json
{
  "items": [
    { "name": "milk", "quantity": 1 },
    { "name": "eggs", "quantity": 12 }
  ]
}
```

Response:
```json
{
  "products_link_url": "https://www.instacart.com/store/lists/xyz789..."
}
```

**3. Get Nearby Retailers**
```
GET /idp/v1/retailers?postal_code=XXXXX&country_code=US
```
Returns retailer brands available in the user's area.

Response:
```json
{
  "retailers": [
    {
      "retailer_key": "king_soopers",
      "name": "King Soopers",
      "logo_url": "https://..."
    },
    {
      "retailer_key": "safeway",
      "name": "Safeway",
      "logo_url": "https://..."
    }
  ]
}
```

#### Pre-selecting a Retailer
Append `?retailer_key=<key>` to any generated Instacart URL to pre-select the user's preferred store:
```
https://www.instacart.com/store/recipes/abc123?retailer_key=king_soopers
```

#### User Flow
1. User clicks "Shop with Instacart" button
2. Frontend calls our backend API
3. Backend calls Instacart IDP endpoint
4. Backend returns the generated URL (with retailer_key appended if user has preference)
5. Frontend redirects user to Instacart
6. User selects store (if not pre-selected), reviews products, checks out on Instacart

---

### Kroger API

Direct integration with Kroger-family stores. Provides real-time pricing (unlike Instacart).

#### Base URL
```
https://api.kroger.com/v1
```

#### Authentication
OAuth 2.0 Client Credentials flow:
```
POST /connect/oauth2/token
Authorization: Basic base64(client_id:client_secret)
Body: grant_type=client_credentials&scope=product.compact
```

#### Endpoints

**Find Stores**
```
GET /locations?filter.zipCode.near=80202&filter.radiusInMiles=10
```

**Search Products**
```
GET /products?filter.term=chicken&filter.locationId=01234567
```

#### Supported Store Chains
Kroger, Ralphs, King Soopers, Fry's, Smith's, Fred Meyer, QFC, Harris Teeter, Food 4 Less, Pick 'n Save, Metro Market, Mariano's, Dillons, Baker's, City Market

---

## Backend API Endpoints

**Base URL**: `https://budgetbite-api-69cb51842c10.herokuapp.com`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with feature flags |
| POST | `/api/instacart/recipe` | Create Instacart recipe page |
| POST | `/api/recipe/parse` | Parse recipe from URL |
| POST | `/api/recipe/parse-with-prices` | Parse recipe + get Kroger prices |
| GET | `/api/kroger/locations` | Find Kroger stores by ZIP |
| GET | `/api/kroger/products` | Search Kroger products |
| POST | `/api/prices/search` | Get prices for ingredient list |
| POST | `/api/prices/estimate` | Estimate prices (fallback) |
| POST | `/api/recipes/discover` | Discover recipes by category |

---

## Database Schema (Supabase)

### Core Tables

**profiles**
- User profile data with RLS
- `preferred_retailer_key` - saved Instacart retailer preference
- `preferred_store` - legacy store name field
- `location` - JSON with zip_code, city, state

**recipes**
- Saved/imported recipes
- Links to ingredients, instructions

**meal_plans**
- Weekly meal planning data
- Links to recipes by day/meal

**shopping_lists**
- User shopping lists
- Items with quantities, checked status

**pantry_items**
- User's pantry inventory
- Used for excluding items from shopping

**instacart_recipe_links** (cache table)
- Caches generated Instacart URLs
- Expires after 13 days (Instacart links expire after 14)
- Keyed by: recipe_id, ingredients_hash, servings

---

## Project Structure

```
budgetbite_claude/
├── src/                          # Frontend source
│   ├── components/
│   │   ├── stores/               # Store selector components
│   │   ├── recipes/              # Recipe cards, filters
│   │   ├── onboarding/           # Onboarding flow
│   │   └── ui/                   # shadcn/ui components
│   ├── pages/
│   │   ├── Home.jsx              # Recipe discovery
│   │   ├── RecipeDetails.jsx     # Single recipe view
│   │   ├── ShoppingList.jsx      # Shopping list management
│   │   ├── MealPlanner.jsx       # Meal planning
│   │   └── Onboarding.jsx        # New user setup
│   ├── services/
│   │   ├── instacart.js          # Instacart client utilities
│   │   └── recipeDiscovery.js    # Recipe fetching
│   ├── hooks/
│   │   └── useKrogerPricing.js   # Kroger pricing hook
│   └── lib/
│       └── AuthContext.jsx       # Auth state management
│
├── budgetbite-api-backend/       # Backend (separate deployment)
│   ├── server.js                 # Express app + all routes
│   ├── migrations/               # Database migrations
│   ├── package.json              # Backend dependencies
│   └── .env.example              # Environment template
│
├── .env.development              # Frontend dev environment
├── .env.production               # Frontend prod environment
└── package.json                  # Frontend dependencies
```

---

## Environment Variables

### Frontend (.env.development / .env.production)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_INSTACART_API_KEY=your-instacart-key
VITE_INSTACART_ENV=sandbox  # or "production"
```

### Backend (.env)
```bash
# Kroger API
KROGER_CLIENT_ID=your-client-id
KROGER_CLIENT_SECRET=your-client-secret

# Instacart API
INSTACART_API_KEY=your-api-key
INSTACART_ENV=sandbox  # or "production"

# Supabase (for caching)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Server
PORT=3000
```

---

## Development Workflow

### Local Development

**Frontend:**
```bash
cd budgetbite_claude
npm install
npm run dev
# Runs on http://localhost:5173
```

**Backend:**
```bash
cd budgetbite_claude/budgetbite-api-backend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Deployment

**Frontend (Vercel):**
- Automatic deployment on push to main
- Or manual: `vercel deploy`

**Backend (Heroku):**
```bash
cd budgetbite-api-backend
git push heroku main
```

**View Logs:**
```bash
heroku logs --tail --app budgetbite-api
```

---

## Current Priorities

### Immediate
1. **Store Selector Onboarding** - Call Instacart retailers endpoint with ZIP, show available brands, save preference
2. **Append retailer_key** - All generated Instacart URLs should include user's preferred retailer
3. **Centralize API_BASE** - Move hardcoded Heroku URL to environment variable

### Short-term
4. **Production Instacart Key** - Apply for production access, update environment
5. **Affiliate Tracking** - Add UTM parameters for Instacart affiliate program
6. **Recipe URL Caching** - Ensure cache is working to reduce API calls

### Backlog
- Kroger OAuth user flow for personalized pricing
- Meal plan to bulk shopping list generation
- Pantry-aware ingredient filtering
- Recipe website scraping automation

---

## Key Implementation Notes

### "Shop with Instacart" Button
```javascript
// Frontend: RecipeDetails.jsx
const handleShopWithInstacart = async () => {
  setLoading(true);

  // Call our backend, not Instacart directly
  const response = await fetch(`${API_BASE}/api/instacart/recipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: recipe.title,
      image_url: recipe.image_url,
      ingredients: recipe.ingredients,
      servings: recipe.servings,
      recipe_id: recipe.id
    })
  });

  const data = await response.json();

  if (data.products_link_url) {
    // Append retailer_key if user has preference
    let url = data.products_link_url;
    if (userProfile?.preferred_retailer_key) {
      url += `?retailer_key=${userProfile.preferred_retailer_key}`;
    }
    window.open(url, '_blank');
  }

  setLoading(false);
};
```

### Ingredient Name Cleaning
Before sending to Instacart, clean ingredient names:
```javascript
// Remove quantities, measurements, prep instructions
"2 lbs boneless chicken breast, cubed" -> "chicken breast"
"1/2 cup fresh spinach, washed" -> "spinach"
```

The backend handles this in the `cleanIngredientName()` function.

### URL Caching
The backend caches Instacart URLs in Supabase to:
- Reduce API calls for the same recipe
- Speed up repeat visits
- Cache expires after 13 days (before Instacart's 14-day expiry)

---

## Testing Checklist

### Instacart Integration
- [ ] Retailers endpoint returns stores for valid ZIP
- [ ] Recipe endpoint generates valid URL
- [ ] Generated URLs work (redirect to Instacart)
- [ ] retailer_key parameter pre-selects store
- [ ] URL caching works (second request returns cached URL)

### Kroger Integration
- [ ] OAuth token refresh works
- [ ] Location search returns nearby stores
- [ ] Product search returns relevant results
- [ ] Prices are attached to parsed recipes

### Recipe Parsing
- [ ] Parses major recipe sites (AllRecipes, Budget Bytes, etc.)
- [ ] Extracts title, image, ingredients, instructions
- [ ] Handles various ingredient formats

---

## Resources

- **Instacart IDP Docs**: https://docs.instacart.com/developer_platform_api/
- **Kroger Developer Portal**: https://developer.kroger.com/
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Heroku Dashboard**: https://dashboard.heroku.com/apps/budgetbite-api

---

*Last Updated: February 2025*

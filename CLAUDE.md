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

**Current Status**: Development API key (Public API - Sandbox Environment)

**CRITICAL LIMITATION**: The Instacart IDP Public API does **NOT** provide:
- ❌ Product pricing data
- ❌ Product listings or SKUs
- ❌ Inventory/availability information
- ❌ Real-time product search
- ✅ **ONLY generates shoppable cart links** to Instacart Marketplace

**Future Upgrade Path**: Apply for **Instacart IDP Partner API** once MVP is live:
- ✅ Real-time product search with pricing
- ✅ Product availability data
- ✅ Retailer location finder
- 📋 Requires: Working demo → Approval process (~3 weeks)

**Important**: Instacart IDP generates **links** to Instacart Marketplace pages. It does NOT:
- Provide pricing data directly to our app
- Create carts visible in our app
- Show individual store locations (only retailer brands)
- Embed checkout in our app

**User Flow**: User clicks "Shop with Instacart" → Redirected to Instacart.com → Reviews products → Checks out on Instacart

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

### Spoonacular API

**Purpose**: Package-based price estimation and recipe data enrichment

**Status**: Active (Primary pricing source until Instacart Partner API access)

#### Base URL
```
https://api.spoonacular.com
```

#### Authentication
API Key in query parameter or header:
```
?apiKey=YOUR_API_KEY
```

#### Key Endpoints

**Get Ingredient Information**
```
GET /food/ingredients/{id}/information?amount=1&unit=jar
```
Returns estimated price for purchasable package size.

**Parse Ingredients**
```
POST /recipes/parseIngredients
```
Converts ingredient text to structured data with pricing estimates.

**Grocery Product Search**
```
GET /food/products/search?query=mayonnaise&number=5
```
Finds actual grocery products with package sizes and prices.

#### Package-Based Pricing Configuration

**Critical**: Configure API calls to request package-level pricing, NOT unit-level:

```javascript
// WRONG - Returns price for 2 tbsp ($0.16)
const response = await fetch(
  `https://api.spoonacular.com/food/ingredients/estimate?
   ingredientName=mayonnaise&
   amount=2&
   unit=tablespoon`
);

// RIGHT - Returns price for jar ($5.99)
const response = await fetch(
  `https://api.spoonacular.com/food/products/search?
   query=mayonnaise&
   number=1`
);
// Then extract package size and price from product data
```

**Implementation Strategy**:
1. Search for product by ingredient name
2. Get first result (most popular product)
3. Extract: `title` (e.g., "Hellmann's Real Mayo 30oz"), `price`, `image`
4. Store in `product_packages` cache table
5. Display: "Mayonnaise (jar) - $5.99" with tooltip "Recipe uses 2 tbsp"

#### Rate Limits
- Free tier: 150 requests/day
- Paid tier: Based on plan
- **Recommendation**: Cache all price lookups in database

---

### ~~Kroger API~~ (DEPRECATED - Removed)

**Decision**: Abandoned Kroger API integration

**Reasoning**:
- Creates imbalanced UX (all Kroger stores vs limited other brands)
- Instacart coverage includes Kroger-family stores anyway
- Maintenance overhead not justified
- User feedback: Prefer consistency across all stores

**Migration Path**: All pricing now handled via Spoonacular → Future Instacart Partner API

---

## Backend API Endpoints

**Base URL**: `https://budgetbite-api-69cb51842c10.herokuapp.com`

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with feature flags |
| POST | `/api/instacart/recipe` | Create Instacart recipe cart link |
| POST | `/api/recipe/parse` | Parse recipe from URL |
| POST | `/api/recipes/discover` | Discover recipes by category |

### Pricing Endpoints (NEW)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prices/package-lookup` | Get package-based price for ingredient |
| POST | `/api/prices/recipe-total` | Calculate total recipe cost (pantry-aware) |
| POST | `/api/prices/meal-plan-aggregate` | Aggregate & optimize meal plan shopping list |
| PUT | `/api/pantry/toggle/:recipeId/:ingredientId` | Toggle ingredient pantry status |
| GET | `/api/pantry/:userId` | Get user's pantry items |

### Deprecated Endpoints (Removed)

| Method | Endpoint | Status |
|--------|----------|--------|
| ~~GET~~ | ~~/api/kroger/locations~~ | REMOVED - Kroger API deprecated |
| ~~GET~~ | ~~/api/kroger/products~~ | REMOVED - Kroger API deprecated |
| ~~POST~~ | ~~/api/recipe/parse-with-prices~~ | REMOVED - Replaced with package-lookup |
| ~~POST~~ | ~~/api/prices/search~~ | REMOVED - Unit-based pricing deprecated |
| ~~POST~~ | ~~/api/prices/estimate~~ | REMOVED - Replaced with package-lookup |

---

## Database Schema (Supabase)

### Core Tables

**profiles**
- User profile data with RLS
- `preferred_retailer_key` - saved Instacart retailer preference
- `preferred_store` - legacy store name field
- `location` - JSON with zip_code, city, state
- `pantry_items` - JSON array of items user has on hand (from onboarding)

**recipes**
- Saved/imported recipes
- Links to ingredients, instructions
- `base_price` - Total cost if buying all ingredients
- `pantry_aware_price` - Cost after excluding pantry items

**meal_plans**
- Weekly meal planning data
- Links to recipes by day/meal
- `aggregated_shopping_list` - JSON of shared ingredients across recipes

**shopping_lists**
- User shopping lists
- Items with quantities, checked status
- `source` - 'manual' | 'recipe' | 'meal_plan'

**pantry_items** (NEW - individual table)
- User's pantry inventory
- `user_id`, `ingredient_name`, `has_item` (boolean)
- Used for excluding items from shopping & price calculation
- Synced with onboarding data

**product_packages** (NEW - caching table)
- Cached package-level pricing from Spoonacular
- `ingredient_name`, `product_title`, `package_size`, `price`, `image_url`
- `source` - 'spoonacular' | 'user_submitted' | 'instacart_partner'
- `last_updated` - Timestamp for cache invalidation (7-day expiry)
- Indexed by `ingredient_name` for fast lookups

**recipe_ingredients** (NEW - junction table with pricing)
- Links recipes to ingredients with quantities
- `recipe_id`, `ingredient_name`, `amount`, `unit`
- `package_id` - FK to product_packages
- `is_pantry_item` - Boolean (user toggle)
- `display_price` - Package price or $0 if pantry item
- Enables per-ingredient cost tracking

**meal_plan_aggregation** (NEW - smart shopping optimization)
- Aggregated ingredients across a meal plan
- `meal_plan_id`, `ingredient_name`, `total_amount`, `total_unit`
- `package_id`, `shared_across_recipes` - Array of recipe IDs using this ingredient
- `amortized_cost_per_recipe` - Package price / number of recipes
- Auto-calculated when meal plan is updated

**instacart_recipe_links** (existing - cache table)
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
# Spoonacular API (Primary pricing source)
SPOONACULAR_API_KEY=your-spoonacular-key

# Instacart API
INSTACART_API_KEY=your-api-key
INSTACART_ENV=sandbox  # or "production"

# Supabase (for caching and database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Server
PORT=3000

# Deprecated (Remove these)
# KROGER_CLIENT_ID=removed
# KROGER_CLIENT_SECRET=removed
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

## Current Priorities (February 2026)

### 🚨 CRITICAL - Pricing Architecture Overhaul
**Status**: In Development  
**Goal**: Move from inaccurate unit-based pricing to package-based pricing with pantry awareness

#### Phase 1: Package-Based Pricing (Week 1)
- Configure Spoonacular to estimate based on purchasable units (jars, bottles, bunches)
- Create `product_packages` table to cache package information
- Update frontend to show: "Mayonnaise (30oz jar) - $5.99 ⓘ Recipe uses 2 tbsp"
- Remove Kroger API integration (creates imbalanced UX - Instacart covers all stores anyway)

#### Phase 2: Pantry Awareness (Week 2)  
- Individual ingredient toggle: "Have it" vs "Need to buy"
- Integration with onboarding pantry data
- Two price views: "Total cost" vs "Cost for you"
- Real-time cost recalculation on toggle

#### Phase 3: Smart Shopping List Aggregation (Week 3)
- Multi-recipe ingredient analysis across meal plan
- Shared ingredient detection (mayo used in 3 recipes → buy once)
- Amortized cost allocation per recipe
- Optimized shopping list with quantities

### 🐛 Critical Bug Fixes
1. **Account Deletion Error** - "not authenticated" error in Profile.jsx → Check Supabase auth state
2. **Recipe Discovery Endpoint** - `/api/discover-recipes` returns 404 → Endpoint not created or wrong URL

### 📋 Immediate Next Steps
1. **Apply for Instacart Partner API** - Get access to real pricing/product data (currently only have Public API for cart links)
2. **Production Instacart Key** - Migrate from sandbox to production after MVP testing
3. **Affiliate Tracking** - Add UTM parameters for Instacart affiliate commission program

### Backlog
- Price update cron job (daily refresh of cached Spoonacular prices)
- Recipe website scraping automation (Firecrawl + AI normalization)
- User-generated price database (crowdsourced real prices over time)
- Advanced meal planning features (budget constraints, leftover optimization)

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

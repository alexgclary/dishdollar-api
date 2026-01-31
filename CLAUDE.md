# CLAUDE.md - DishDollar Development Guide

## Project Overview

**DishDollar** is a recipe and meal planning app that helps users discover healthy, affordable recipes and purchase ingredients at real-time prices from their preferred grocery stores. The app bridges the gap between recipe discovery and practical grocery shopping by providing intelligent ingredient parsing, smart product matching, and direct store integration.

### Core Value Proposition
- Parse recipe URLs and extract ingredient lists with preserved measurements
- Connect users to actual grocery products with current pricing from local stores
- Recommend high-quality, fresh ingredients at affordable prices
- Account for pantry items users already have
- Support multiple dietary preferences and cuisine types

---

## Current Architecture

### Tech Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React/Vite + Tailwind CSS | User interface |
| Hosting (Frontend) | Vercel | Frontend deployment |
| Backend | Heroku | API services, Kroger integration |
| Database | Supabase (PostgreSQL) | Auth, user data, recipes, meal plans |
| Version Control | GitHub | Single repository (monorepo structure assumed) |
| AI Layer | Claude Opus 4.5 | Ingredient parsing, recipe discovery |

### Current Database Schema (Supabase)
- User profiles (with row-level security)
- Recipes
- Meal plans
- Saved recipes
- Budget tracking
- Shopping lists
- Pantry items

### Existing Integrations
- **Kroger API**: General API key for product searches (keep as fallback)

---

## Development Goals

### Primary Goals
1. **Multi-Store Integration**: Allow users to select their preferred grocery store (Kroger, Whole Foods, Walmart, Safeway, Costco, Publix, etc.)
2. **Real-Time Pricing**: Display current prices for ingredients when discovering recipes
3. **Smart Recipe Discovery**: AI-powered system that finds healthy, affordable recipes based on:
   - User's dietary preferences
   - Items already in their pantry
   - Budget constraints

### Secondary Goals
4. **Recipe Website Scanning**: Daily automated scanning of top recipe websites for new content
5. **Fresh Ingredient Preference**: Smart filtering to prioritize fresh butcher/produce items over pre-packaged when user prefers
6. **Monetization**: Instacart affiliate program integration for commission on completed orders

---

## Grocery Store API Strategy

### PRIMARY: Instacart Developer Platform (IDP)

**This is the recommended primary integration.** IDP provides access to 85,000+ stores across 1,500+ retail banners in the US and Canada.

#### Why Instacart IDP
- Single API integration covers ALL target stores (Kroger, Whole Foods, Walmart, Safeway, Costco, Publix, and more)
- Purpose-built Recipe API with ingredient-to-product matching
- Built-in pantry exclusion feature (`enable_pantry_items`)
- Health filters: ORGANIC, GLUTEN_FREE, FAT_FREE, VEGAN, KOSHER, SUGAR_FREE, LOW_FAT
- Affiliate program for monetization (5% commission on cart value, 7-day attribution window)
- Trusted by NYT Cooking, WeightWatchers, Jow (similar use cases)

#### IDP API Endpoints to Implement
```
POST /idp/v1/products/recipe    # Create shoppable recipe page
POST /idp/v1/products/list      # Create shopping list
```

#### Recipe API Request Structure
```json
{
  "title": "Recipe Name",
  "image_url": "https://...",
  "servings": 4,
  "cooking_time": 30,
  "ingredients": [
    {
      "name": "spinach",              // Generic name only
      "display_text": "1 cup fresh spinach",
      "measurements": [
        { "quantity": 1, "unit": "cup" },
        { "quantity": 30, "unit": "gram" }  // Multiple units improve matching
      ],
      "filters": {
        "brand_filters": ["Organic Girl"],
        "health_filters": ["ORGANIC"]
      }
    }
  ],
  "landing_page_configuration": {
    "partner_linkback_url": "https://dishdollar.com/recipe/123",
    "enable_pantry_items": true    // CRITICAL: Enables pantry exclusion
  }
}
```

#### IDP Onboarding Steps
1. Apply at https://www.instacart.com/company/business/developers
2. Build integration & submit demo (avg 19 days)
3. Receive production API key (1-2 business days after approval)
4. Join Impact affiliate program (invitation sent after live integration)

#### Monetization via IDP Affiliate
- **Commission**: 5% of total cart value on completed orders
- **New Customer Bonus**: Up to $10 CPA for new user signups
- **Subscription Bonus**: $20 per Instacart+ subscription
- **Attribution Window**: 7 days from click
- **Minimum Payout**: $20 (via PayPal or ACH)
- **Tracking**: Via Impact platform with UTM parameters

### FALLBACK: Kroger API (Already Implemented)

Keep existing Kroger integration as:
1. Fallback when Instacart is unavailable
2. Price comparison option for users
3. Direct store integration without delivery fees

### Store API Availability Summary

| Store | Public API | Recommendation |
|-------|------------|----------------|
| Kroger | ✅ Yes | Keep as fallback |
| Whole Foods | ❌ No | Use Instacart IDP |
| Walmart | ❌ Deprecated | Use Instacart IDP |
| Safeway | ❌ No | Use Instacart IDP |
| Publix | ❌ No | Use Instacart IDP |
| Costco | ❌ No | Use Instacart IDP |

---

## AI Layer Implementation

### Claude Opus 4.5 Integration

Use Claude Opus 4.5 for:

#### 1. Ingredient Name Pre-Processing
**Problem**: Raw ingredient text like "1/2 tsp freshly ground black pepper" returns incorrect products (e.g., beef patties).

**Solution**: Pre-process ingredients through Claude before product search:

```python
INGREDIENT_CLEANING_PROMPT = """
Extract the core ingredient name for grocery product search.

Input: "1/2 tsp freshly ground black pepper"
Output: {"search_term": "black pepper", "category": "spices", "department": "pantry"}

Input: "2 lbs boneless, skinless chicken breast"
Output: {"search_term": "chicken breast boneless skinless", "category": "poultry", "department": "meat"}

Input: "1 cup baby spinach, washed"
Output: {"search_term": "baby spinach", "category": "leafy greens", "department": "produce"}

Rules:
- Remove quantities, measurements, and preparation instructions
- Keep essential descriptors (boneless, fresh, organic)
- Identify product category and store department
- Return JSON format for structured processing
"""
```

#### 2. Ingredient Variation Mapping
Build a mapping layer for common variations:

```json
{
  "ingredient_mappings": {
    "freshly ground black pepper": "black pepper",
    "evoo": "extra virgin olive oil",
    "parm": "parmesan cheese",
    "veggie broth": "vegetable broth",
    "greek yogurt plain": "plain greek yogurt"
  },
  "category_mappings": {
    "black pepper": {"category": "spices", "department": "pantry"},
    "spinach": {"category": "leafy_greens", "department": "produce", "prefer_fresh": true},
    "chicken breast": {"category": "poultry", "department": "meat", "prefer_fresh": true}
  }
}
```

#### 3. Recipe Discovery & Website Scanning
Use Claude to:
- Identify trending recipes from target websites
- Extract structured recipe data (ingredients, instructions, nutrition)
- Categorize by cuisine type and dietary preferences
- Score recipes for health and affordability

---

## Smart Product Matching System

### Fresh vs Pre-Packaged Filtering

Implement user preference system in onboarding:

```javascript
// User preference schema addition
{
  "fresh_preference": "fresh_only" | "prefer_fresh" | "no_preference",
  "departments_to_prefer": ["produce", "meat", "seafood", "deli", "bakery"],
  "keywords_to_exclude": ["frozen", "pre-packaged", "ready-to-eat", "processed", "canned"]
}
```

### Product Scoring Algorithm

```javascript
function scoreProduct(product, userPreferences, ingredient) {
  let score = 100;
  
  // Freshness scoring (if user prefers fresh)
  if (userPreferences.fresh_preference !== "no_preference") {
    if (ingredient.prefer_fresh) {
      // Boost fresh department items
      if (["produce", "meat", "seafood", "deli", "bakery"].includes(product.department)) {
        score += 30;
      }
      // Penalize excluded keywords
      const lowerName = product.name.toLowerCase();
      for (const keyword of userPreferences.keywords_to_exclude) {
        if (lowerName.includes(keyword)) {
          score -= 50;
        }
      }
    }
  }
  
  // Quality brand preference (from existing logic)
  const qualityBrands = ["Old El Paso", "McCormick", "Kraft", "Organic Girl", "365", "Boar's Head"];
  if (qualityBrands.some(brand => product.brand?.includes(brand))) {
    score += 20;
  }
  
  // Store brand penalty (adjustable)
  if (product.brand?.toLowerCase().includes("private selection")) {
    score -= 10;
  }
  
  // Image availability
  if (product.image_url) {
    score += 5;
  }
  
  // Price per unit efficiency
  if (product.price_per_unit) {
    // Lower price per unit = better value
    score += Math.max(0, 20 - (product.price_per_unit * 2));
  }
  
  return score;
}
```

### Minimum Quantity Calculation

When a recipe calls for a specific amount, find the smallest available package:

```javascript
function findOptimalPackage(ingredient, availableProducts) {
  const requiredAmount = convertToStandardUnit(ingredient.quantity, ingredient.unit);
  
  // Sort by package size (ascending)
  const sortedProducts = availableProducts
    .map(p => ({
      ...p,
      packageAmount: convertToStandardUnit(p.size, p.sizeUnit),
      meetsRequirement: convertToStandardUnit(p.size, p.sizeUnit) >= requiredAmount
    }))
    .filter(p => p.meetsRequirement)
    .sort((a, b) => a.packageAmount - b.packageAmount);
  
  // Return smallest package that meets requirement
  return sortedProducts[0] || null;
}
```

---

## Recipe Website Scraping

### Target Websites (Priority Order)

#### User Favorites
1. Natasha's Kitchen (natashaskitchen.com)
2. Half Baked Harvest (halfbakedharvest.com)
3. Defined Dish (thedefineddish.com)
4. AllRecipes (allrecipes.com)
5. Whole30 (whole30.com)

#### Healthy/Budget Focused
6. Budget Bytes (budgetbytes.com)
7. Skinnytaste (skinnytaste.com)
8. Minimalist Baker (minimalistbaker.com)
9. Love and Lemons (loveandlemons.com)
10. Cookie and Kate (cookieandkate.com)

#### High-Quality Popular Sites
11. Pinch of Yum (pinchofyum.com)
12. Serious Eats (seriouseats.com)
13. Gimme Some Oven (gimmesomeoven.com)
14. Simply Recipes (simplyrecipes.com)
15. Smitten Kitchen (smittenkitchen.com)

#### Plant-Based Specialists
16. Oh She Glows (ohsheglows.com)
17. Deliciously Ella (deliciouslyella.com)
18. A Couple Cooks (acouplecooks.com)

### Scraping Schedule
- **Daily**: Automated scan of all target websites for new recipes
- **On-Demand**: User-triggered refresh button (already built)

### Recipe Extraction Schema

```json
{
  "source_url": "https://...",
  "source_site": "halfbakedharvest.com",
  "title": "Recipe Title",
  "description": "...",
  "image_url": "https://...",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "total_time_minutes": 45,
  "servings": 4,
  "cuisine_type": "Mediterranean",
  "diet_tags": ["gluten-free", "dairy-free"],
  "ingredients": [
    {
      "original_text": "1 cup baby spinach, washed",
      "parsed_name": "baby spinach",
      "quantity": 1,
      "unit": "cup",
      "preparation": "washed",
      "is_optional": false
    }
  ],
  "instructions": ["Step 1...", "Step 2..."],
  "nutrition": {
    "calories": 350,
    "protein_g": 25,
    "carbs_g": 30,
    "fat_g": 15
  },
  "extracted_at": "2025-01-29T00:00:00Z"
}
```

---

## MCP Server Integration

### Recommended MCP Servers for DishDollar

#### 1. Puppeteer/Playwright (Recipe Scraping)
**Purpose**: Automate recipe website scraping with browser rendering

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp/puppeteer"]
    }
  }
}
```

**Use Cases**:
- Navigate to recipe pages
- Handle JavaScript-rendered content
- Extract structured recipe data
- Take screenshots for debugging

#### 2. FireCrawl (AI-Powered Scraping)
**Purpose**: Extract structured data from websites using AI

**Use Cases**:
- Intelligent recipe extraction without manual selectors
- Handle varying recipe card formats across sites
- Clean, structured JSON output

#### 3. Supabase MCP (Database Operations)
**Purpose**: Direct database interactions from Claude Code

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server"]
    }
  }
}
```

**Use Cases**:
- Query recipes and user data
- Manage pantry items
- Update meal plans
- Debug database issues

#### 4. PostgreSQL MCP (Natural Language Queries)
**Purpose**: Query database using natural language

**Use Cases**:
- "Find all users who saved Mediterranean recipes"
- "Show recipes that use chicken and have less than 500 calories"
- Complex analytics queries without writing SQL

#### 5. Zapier MCP (Automation)
**Purpose**: Cross-app automation workflows

**Use Cases**:
- Send weekly meal plan summaries via email
- Notify users when new recipes match their preferences
- Sync with Google Calendar for meal planning
- Post new recipes to social media

#### 6. Gmail MCP (Newsletter Import)
**Purpose**: Import recipes from email newsletters

**Use Cases**:
- Parse recipe newsletters from subscribed food bloggers
- Extract recipes shared via email
- Import shopping lists from email

---

## Supported Cuisines & Diets

### Cuisine Types (Current)
Italian, Mexican, Indian, Chinese, American, Mediterranean, Japanese, Thai, French, Korean, Vietnamese, Greek, Spanish, Middle Eastern, Brazilian, Caribbean, Ethiopian, German

### Diet Types (Expand to Support All)
- Vegetarian
- Vegan
- Keto / Low-Carb
- Paleo
- Whole30
- Gluten-Free
- Dairy-Free
- Mediterranean
- DASH
- Low-Sodium
- Pescatarian
- Nut-Free
- Egg-Free
- Soy-Free
- Kosher
- Halal

---

## Pantry Management

### Current Pantry Items (Onboarding Step 5)

#### Oils & Fats
Olive oil, Vegetable oil, Butter

#### Basics
Salt, Pepper, Sugar, Flour, Rice, Pasta, Eggs, Milk, Bread

#### Spices
Garlic, Onions, Cumin, Paprika, Oregano, Basil, Cinnamon, Chili powder, Turmeric, Ginger, Bay leaves, Thyme

#### Condiments
Soy sauce, Hot sauce, Mustard, Ketchup, Mayo, Vinegar, Honey, Maple syrup

#### Kitchen Tools
Pots, Pans, Blender, Mixer, Air fryer, Instant Pot, Oven, Grill, Food processor, Slow cooker

### Expanded Pantry Categories (To Add)

#### Canned Goods
Diced tomatoes, Tomato paste, Coconut milk, Chickpeas, Black beans, Chicken broth, Vegetable broth

#### Grains & Starches
Quinoa, Oats, Couscous, Breadcrumbs, Cornstarch, Baking powder, Baking soda, Yeast

#### Nuts & Seeds
Almonds, Walnuts, Peanuts, Sesame seeds, Chia seeds, Flaxseed

#### Dairy & Alternatives
Cream cheese, Sour cream, Heavy cream, Greek yogurt, Parmesan cheese, Cheddar cheese

#### Additional Spices
Rosemary, Sage, Nutmeg, Cloves, Cardamom, Cayenne, Italian seasoning, Taco seasoning, Curry powder, Smoked paprika, Red pepper flakes

#### Sauces & Pastes
Tomato sauce, Pesto, Salsa, Tahini, Fish sauce, Oyster sauce, Hoisin sauce, Sriracha, Worcestershire sauce

#### Baking
Vanilla extract, Cocoa powder, Chocolate chips, Brown sugar, Powdered sugar

### Pantry Search Enhancement
Add "More" pill button that triggers search for:
- Full ingredient database from recipes
- Common grocery items by category
- Recently used ingredients from user's history

---

## User Onboarding Flow

### Current Steps
1. Account creation (basic info)
2. [Unknown - verify]
3. [Unknown - verify]
4. [Unknown - verify]
5. Pantry setup

### Proposed Addition
Add to onboarding (before or after pantry):

**Fresh Ingredient Preferences**
```
"How do you prefer your meats and produce?"

○ Fresh only - I prefer buying from the butcher counter and fresh produce section
○ Prefer fresh - Show me fresh options first, but include pre-packaged if needed  
○ No preference - Show me all available options

[Optional] Exclude these types:
☐ Frozen items
☐ Pre-packaged/ready-to-eat
☐ Canned goods
☐ Processed foods
```

---

## API Architecture (To Build)

### Proposed API Structure

```
/api/v1/
├── auth/
│   ├── login
│   ├── register
│   └── refresh
├── recipes/
│   ├── GET /                    # List recipes
│   ├── GET /:id                 # Get recipe detail
│   ├── POST /extract            # Extract from URL
│   ├── POST /discover           # AI recipe discovery
│   └── GET /trending            # Trending recipes
├── ingredients/
│   ├── POST /parse              # Parse ingredient text (Claude)
│   ├── GET /search              # Search products
│   └── GET /map                 # Get ingredient mappings
├── stores/
│   ├── GET /                    # List available stores
│   ├── GET /nearby              # Find nearby stores
│   └── POST /products           # Search store products
├── pantry/
│   ├── GET /                    # Get user pantry
│   ├── POST /                   # Add to pantry
│   ├── DELETE /:id              # Remove from pantry
│   └── GET /suggestions         # Suggested pantry items
├── shopping/
│   ├── POST /cart               # Create shopping cart
│   ├── GET /cart                # Get current cart
│   └── POST /checkout           # Generate Instacart link
├── meal-plans/
│   ├── GET /                    # Get meal plans
│   ├── POST /                   # Create meal plan
│   └── POST /generate           # AI-generated meal plan
└── users/
    ├── GET /profile
    ├── PATCH /preferences
    └── GET /history
```

---

## Development Commands

### Local Development
```bash
# Frontend (Vercel)
cd frontend
npm install
npm run dev

# Backend (Heroku)
cd backend
npm install
npm run dev

# Database (Supabase)
supabase start
supabase db push
```

### Deployment
```bash
# Frontend
vercel deploy

# Backend
git push heroku main

# Database migrations
supabase db push --linked
```

---

## Environment Variables

### Frontend (.env.local)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=
VITE_INSTACART_PARTNER_ID=
```

### Backend (.env)
```
DATABASE_URL=
SUPABASE_SERVICE_KEY=
KROGER_CLIENT_ID=
KROGER_CLIENT_SECRET=
INSTACART_API_KEY=
ANTHROPIC_API_KEY=
IMPACT_PARTNER_ID=
```

---

## Testing Checklist

### Ingredient Parsing Tests
- [ ] "1/2 tsp freshly ground black pepper" → black pepper (spices)
- [ ] "2 lbs boneless skinless chicken breast" → chicken breast (meat)
- [ ] "1 cup baby spinach, washed" → baby spinach (produce)
- [ ] "EVOO for drizzling" → extra virgin olive oil (oils)
- [ ] "3 cloves garlic, minced" → garlic (produce)

### Product Matching Tests
- [ ] Fresh preference filters out frozen items
- [ ] Minimum quantity returns smallest viable package
- [ ] Quality brands score higher than store brands
- [ ] Pantry items show as "in pantry" in recipe view

### Store Integration Tests
- [ ] Instacart recipe page generation works
- [ ] Affiliate tracking parameters included
- [ ] Store selection persists for user
- [ ] Fallback to Kroger when needed

---

## Key Contacts & Resources

### Instacart Developer Platform
- Apply: https://www.instacart.com/company/business/developers
- Docs: https://docs.instacart.com/developer_platform_api/
- Affiliate: https://www.instacart.com/company/affiliate

### Kroger Developer Portal
- Docs: https://developer.kroger.com/

### Supabase
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs

---

## Notes for Claude Code

When working on this project:

1. **Always pre-process ingredients** through Claude before searching store APIs
2. **Preserve original recipe formatting** in display while using parsed data for searches
3. **Test with edge cases**: unusual measurements, brand-specific ingredients, international ingredients
4. **Prioritize Instacart IDP** for new store integrations - don't build separate scrapers for each store
5. **Include affiliate tracking** in all Instacart URLs for monetization
6. **Respect user preferences** for fresh vs pre-packaged at every product selection point
7. **Handle pantry items gracefully** - show in recipe but mark as "in pantry" with toggle option

---

*Last Updated: January 29, 2025*
*Version: 2.0 - Multi-Store Expansion*

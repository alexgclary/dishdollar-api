# BudgetBite Quick Reference Card

## 🎯 Primary Integration: Instacart Developer Platform

### API Endpoint
```
POST https://connect.instacart.com/idp/v1/products/recipe
```

### Header
```
Authorization: Bearer <API-key>
```

### Key Features
- ✅ 85,000+ stores (Kroger, Whole Foods, Walmart, Safeway, Costco, Publix)
- ✅ Recipe-to-shopping cart API
- ✅ Pantry item exclusion built-in
- ✅ Health filters (ORGANIC, GLUTEN_FREE, VEGAN, KOSHER, etc.)
- ✅ 5% affiliate commission on orders

---

## 🔧 Ingredient Parsing Flow

```
Raw Text → Claude Opus 4.5 → Clean Name → Store API → Products
    ↓              ↓              ↓           ↓
"1/2 tsp     Extract core   "black      Search +
freshly      ingredient     pepper"     Score
ground       + category
black
pepper"
```

---

## 📊 Product Scoring Algorithm

| Factor | Points |
|--------|--------|
| Fresh department (meat/produce/deli) | +30 |
| Quality brand (McCormick, etc.) | +20 |
| Has product image | +5 |
| Good price-per-unit | +0-20 |
| Contains "frozen/pre-packaged" | -50 |
| Store brand | -10 |

---

## 🥗 Recipe Websites (Priority)

### Tier 1 (User Favorites)
1. natashaskitchen.com
2. halfbakedharvest.com
3. thedefineddish.com
4. allrecipes.com
5. whole30.com

### Tier 2 (Healthy/Budget)
6. budgetbytes.com
7. skinnytaste.com
8. minimalistbaker.com
9. loveandlemons.com
10. cookieandkate.com

---

## 🍳 Supported Cuisines

Italian | Mexican | Indian | Chinese | American | Mediterranean
Japanese | Thai | French | Korean | Vietnamese | Greek
Spanish | Middle Eastern | Brazilian | Caribbean | Ethiopian | German

---

## 🥬 Diet Filters

Vegetarian | Vegan | Keto | Paleo | Whole30 | Gluten-Free
Dairy-Free | Mediterranean | DASH | Low-Sodium | Pescatarian
Nut-Free | Egg-Free | Soy-Free | Kosher | Halal

---

## 💾 Database Tables (Supabase)

```
users
├── profiles
├── preferences (diet, fresh_preference)
├── pantry_items
recipes
├── ingredients
├── nutrition
meal_plans
├── plan_recipes
shopping_lists
├── list_items
saved_recipes
```

---

## 🔌 MCP Servers

| Server | Use Case |
|--------|----------|
| Puppeteer | Recipe scraping |
| FireCrawl | AI extraction |
| Supabase | Database ops |
| PostgreSQL | NL queries |
| Zapier | Automation |
| GitHub | Repo management |

---

## 💰 Monetization

### Instacart Affiliate (via Impact)
- **Order commission**: 5% of cart
- **New customer**: Up to $10
- **Subscription**: $20
- **Cookie**: 7 days
- **Min payout**: $20

### UTM Parameters
```
?utm_campaign=instacart-idp
&utm_medium=affiliate
&utm_source=instacart_idp
&utm_term=partnertype-mediapartner
&utm_content=campaignid-20313_partnerid-{ID}
```

---

## 🧪 Test Cases

```bash
# Ingredient parsing
"1/2 tsp freshly ground black pepper" → "black pepper"
"2 lbs boneless skinless chicken" → "chicken breast boneless skinless"
"EVOO for drizzling" → "extra virgin olive oil"

# Product matching
Fresh spinach → Score > Frozen spinach
Deli turkey → Score > Pre-packaged turkey
```

---

## 🚀 Key Commands

```bash
# Local dev
npm run dev           # Start frontend
npm run api           # Start backend

# Deploy
vercel deploy         # Frontend
git push heroku main  # Backend

# Database
supabase db push      # Push migrations
supabase gen types    # Generate TypeScript types
```

---

## 📞 Resources

- Instacart IDP: https://docs.instacart.com/developer_platform_api/
- Kroger API: https://developer.kroger.com/
- Supabase: https://supabase.com/docs
- Anthropic: https://docs.anthropic.com/

---

*Quick Reference v2.0 - Multi-Store Edition*

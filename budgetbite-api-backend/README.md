# BudgetBite API

Backend API for BudgetBite/DishDollar app - handles Kroger pricing, recipe parsing, and Instacart integration.

## Endpoints

### Kroger API
- `GET /api/kroger/locations?zip=80525&radius=10` - Find stores by ZIP
- `GET /api/kroger/products?term=chicken&locationId=123` - Search products

### Recipe Parsing
- `POST /api/recipe/parse` - Parse recipe from URL (body: `{ url: "..." }`)
- `POST /api/recipe/parse-with-prices` - Parse recipe with Kroger prices

### Instacart Integration
- `POST /api/instacart/recipe` - Create shoppable recipe page on Instacart

### Price Services
- `POST /api/prices/search` - Search Kroger prices for multiple ingredients
- `POST /api/prices/estimate` - Estimate prices from database

### Recipe Discovery
- `POST /api/recipes/discover` - Discover recipes by category/diet

### Health Check
- `GET /api/health` - Server status and configuration

## Environment Variables

```
# Kroger API
KROGER_CLIENT_ID=your_kroger_client_id
KROGER_CLIENT_SECRET=your_kroger_client_secret

# Instacart API
INSTACART_ENV=sandbox  # or 'production'
INSTACART_API_KEY=your_instacart_api_key

# Supabase (for caching)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

## Deploy to Heroku

```bash
heroku create budgetbite-api
heroku config:set KROGER_CLIENT_ID=your_client_id
heroku config:set KROGER_CLIENT_SECRET=your_client_secret
heroku config:set INSTACART_ENV=sandbox
heroku config:set INSTACART_API_KEY=your_api_key
heroku config:set SUPABASE_URL=your_supabase_url
heroku config:set SUPABASE_SERVICE_KEY=your_service_key
git push heroku main
```

## Local Development

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

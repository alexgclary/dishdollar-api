# Instacart Developer Platform (IDP) Onboarding Guide

## Overview

This guide walks through the process of integrating BudgetBite with Instacart's Developer Platform to enable multi-store grocery shopping and affiliate monetization.

---

## Step 1: Apply for IDP Access

### Application URL
https://www.instacart.com/company/business/developers

### Required Information
- Business name: BudgetBite
- Business type: Meal planning app
- Contact details
- Description of intended use case
- Expected user base/traffic

### Use Case Description Template
```
BudgetBite is a recipe and meal planning application that helps users discover 
healthy, affordable recipes based on their dietary preferences and pantry items. 

We want to integrate Instacart's Developer Platform to:
1. Enable users to purchase recipe ingredients from their preferred local stores
2. Provide real-time pricing to help users budget their grocery shopping
3. Support health filters (organic, gluten-free, etc.) to match user preferences
4. Leverage pantry item exclusion to avoid duplicate purchases

Our target audience includes health-conscious home cooks in the US who want 
to eat well on a budget. We expect to drive [X] monthly active users to 
Instacart for grocery purchases.
```

### Timeline
- Application review: ~1 week
- Build & demo submission: ~19 days (average)
- Demo approval & production key: 1-2 business days

---

## Step 2: Development Integration

### API Endpoints

#### Base URLs
- Development: `https://connect.dev.instacart.tools`
- Production: `https://connect.instacart.com`

#### Authentication
```bash
curl --request POST \
  --url https://connect.instacart.com/idp/v1/products/recipe \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <API-key>' \
  --header 'Content-Type: application/json'
```

### Create Recipe Page API

#### Endpoint
`POST /idp/v1/products/recipe`

#### Request Body
```json
{
  "title": "Mediterranean Chicken Bowl",
  "image_url": "https://budgetbite.app/images/recipes/med-chicken-bowl.jpg",
  "author": "BudgetBite",
  "servings": 4,
  "cooking_time": 35,
  "external_reference_id": "budgetbite-recipe-12345",
  "expires_in": 2592000,
  "instructions": [
    "Season chicken with oregano, salt, and pepper",
    "Grill chicken for 6-7 minutes per side",
    "Prepare quinoa according to package directions",
    "Assemble bowls with quinoa, chicken, vegetables, and tzatziki"
  ],
  "ingredients": [
    {
      "name": "chicken breast",
      "display_text": "1.5 lbs boneless, skinless chicken breast",
      "measurements": [
        { "quantity": 1.5, "unit": "pound" },
        { "quantity": 680, "unit": "gram" }
      ],
      "filters": {
        "health_filters": ["ORGANIC"]
      }
    },
    {
      "name": "quinoa",
      "display_text": "1 cup quinoa",
      "measurements": [
        { "quantity": 1, "unit": "cup" }
      ]
    },
    {
      "name": "cucumber",
      "display_text": "1 large cucumber, diced",
      "measurements": [
        { "quantity": 1, "unit": "each" }
      ]
    },
    {
      "name": "cherry tomatoes",
      "display_text": "1 pint cherry tomatoes, halved",
      "measurements": [
        { "quantity": 1, "unit": "pint" }
      ]
    },
    {
      "name": "feta cheese",
      "display_text": "4 oz crumbled feta cheese",
      "measurements": [
        { "quantity": 4, "unit": "ounce" }
      ]
    },
    {
      "name": "tzatziki sauce",
      "display_text": "1 cup tzatziki sauce",
      "measurements": [
        { "quantity": 1, "unit": "cup" }
      ]
    }
  ],
  "landing_page_configuration": {
    "partner_linkback_url": "https://budgetbite.app/recipe/med-chicken-bowl",
    "enable_pantry_items": true
  }
}
```

#### Response
```json
{
  "products_link_url": "https://www.instacart.com/store/recipes/12345?utm_campaign=..."
}
```

### Supported Units of Measurement
- Volume: cup, tablespoon, teaspoon, fluid_ounce, pint, quart, gallon, milliliter, liter
- Weight: ounce, pound, gram, kilogram
- Count: each, dozen, bunch, head, clove, slice, piece
- Length: inch (for produce like ginger)

### Health Filters
- `ORGANIC`
- `GLUTEN_FREE`
- `FAT_FREE`
- `VEGAN`
- `KOSHER`
- `SUGAR_FREE`
- `LOW_FAT`

---

## Step 3: Demo Submission

### Requirements
- Working integration in development environment
- Demonstrate recipe page creation
- Show user flow from recipe discovery to Instacart checkout
- Include proper branding and attribution

### Demo Checklist
- [ ] Recipe page generates successfully
- [ ] Ingredients map to correct products
- [ ] Health filters apply correctly
- [ ] Pantry exclusion works
- [ ] Link-back URL configured
- [ ] Error handling implemented
- [ ] Loading states shown to user

---

## Step 4: Affiliate Program Setup

### After Production Approval
1. Receive invitation email to join Impact affiliate program
2. Create Impact account at impact.com
3. Provide business information for payment setup
4. Receive Partner ID for tracking

### URL Parameters for Tracking
After receiving your Impact Partner ID, append these parameters to all Instacart URLs:

```
?utm_campaign=instacart-idp
&utm_medium=affiliate
&utm_source=instacart_idp
&utm_term=partnertype-mediapartner
&utm_content=campaignid-20313_partnerid-{YOUR_PARTNER_ID}
```

### Commission Structure
| Event | Commission |
|-------|------------|
| Completed order | 5% of cart value |
| New customer activation | Up to $10 CPA |
| Instacart+ subscription | $20 |

### Exclusions
- Alcohol
- Restaurant orders
- Prescriptions
- Gift cards

### Payment Details
- Minimum payout: $20
- Payment methods: PayPal, ACH
- Payment frequency: Monthly
- Attribution window: 7 days

---

## Step 5: Production Launch

### Pre-Launch Checklist
- [ ] Production API key configured
- [ ] Affiliate tracking parameters added
- [ ] Error monitoring in place
- [ ] Analytics tracking user conversions
- [ ] Terms of service updated
- [ ] Privacy policy includes Instacart data sharing

### Best Practices

#### Caching Recipe URLs
- Cache generated recipe page URLs
- Only regenerate when recipe content changes
- Set appropriate `expires_in` value (default: 31 days)

#### Ingredient Best Practices
- Use generic product names in `name` field
- Put full text with quantities in `display_text`
- Provide multiple measurement units for better matching
- Spell brand names exactly as they appear on Instacart

#### User Experience
- Show loading state while generating Instacart link
- Handle API errors gracefully
- Provide fallback options (Kroger direct, manual shopping list)
- Display estimated total before redirect

---

## Troubleshooting

### Common Issues

#### Products Not Matching
- Check ingredient `name` is generic (no quantities or prep instructions)
- Verify brand name spelling in filters
- Try without health filters to see base matches

#### Low Store Coverage
- User may be in area with limited Instacart coverage
- Show fallback option to Kroger or manual list

#### Affiliate Tracking Not Working
- Verify Partner ID in URL parameters
- Check Impact dashboard for click events
- Ensure production URLs (not development)

### Support Contacts
- IDP Technical: Contact via developer portal
- Affiliate Questions: Via Impact platform
- General: https://www.instacart.com/company/contact

---

## Code Examples

### React Component for Instacart Button

```jsx
import { useState } from 'react';

function InstacartButton({ recipe, userPreferences }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleShopWithInstacart = async () => {
    setLoading(true);
    setError(null);

    try {
      // Filter out pantry items if enabled
      const ingredientsToShop = recipe.ingredients.filter(
        ing => !userPreferences.pantryItems.includes(ing.parsed_name)
      );

      // Create Instacart recipe page
      const response = await fetch('/api/v1/shopping/instacart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe: {
            ...recipe,
            ingredients: ingredientsToShop
          },
          healthFilters: userPreferences.healthFilters,
          enablePantryItems: true
        })
      });

      const data = await response.json();
      
      if (data.products_link_url) {
        // Open Instacart in new tab
        window.open(data.products_link_url, '_blank');
      }
    } catch (err) {
      setError('Unable to connect to Instacart. Please try again.');
      console.error('Instacart error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShopWithInstacart}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
    >
      {loading ? (
        <span>Preparing your cart...</span>
      ) : (
        <>
          <InstacartIcon />
          <span>Shop with Instacart</span>
        </>
      )}
    </button>
  );
}
```

### Backend API Route (Node.js/Express)

```javascript
const express = require('express');
const router = express.Router();

const INSTACART_API_URL = process.env.INSTACART_API_URL || 'https://connect.instacart.com';
const INSTACART_API_KEY = process.env.INSTACART_API_KEY;
const IMPACT_PARTNER_ID = process.env.IMPACT_PARTNER_ID;

router.post('/instacart', async (req, res) => {
  try {
    const { recipe, healthFilters, enablePantryItems } = req.body;

    // Transform ingredients to Instacart format
    const ingredients = recipe.ingredients.map(ing => ({
      name: ing.parsed_name,
      display_text: ing.original_text,
      measurements: ing.measurements || [{ quantity: ing.quantity, unit: ing.unit }],
      filters: {
        health_filters: healthFilters || []
      }
    }));

    // Create recipe page on Instacart
    const response = await fetch(`${INSTACART_API_URL}/idp/v1/products/recipe`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${INSTACART_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: recipe.title,
        image_url: recipe.image_url,
        servings: recipe.servings,
        cooking_time: recipe.total_time_minutes,
        external_reference_id: `budgetbite-${recipe.id}`,
        expires_in: 2592000, // 30 days
        ingredients,
        landing_page_configuration: {
          partner_linkback_url: `https://budgetbite.app/recipe/${recipe.slug}`,
          enable_pantry_items: enablePantryItems
        }
      })
    });

    const data = await response.json();

    // Add affiliate tracking parameters
    if (data.products_link_url) {
      const url = new URL(data.products_link_url);
      url.searchParams.set('utm_campaign', 'instacart-idp');
      url.searchParams.set('utm_medium', 'affiliate');
      url.searchParams.set('utm_source', 'instacart_idp');
      url.searchParams.set('utm_term', 'partnertype-mediapartner');
      url.searchParams.set('utm_content', `campaignid-20313_partnerid-${IMPACT_PARTNER_ID}`);
      
      data.products_link_url = url.toString();
    }

    res.json(data);
  } catch (error) {
    console.error('Instacart API error:', error);
    res.status(500).json({ error: 'Failed to create Instacart shopping page' });
  }
});

module.exports = router;
```

---

*This guide should be updated as the IDP program evolves. Check https://docs.instacart.com/developer_platform_api/ for the latest documentation.*

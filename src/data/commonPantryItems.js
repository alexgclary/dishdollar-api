// 100 most common pantry, refrigerator, and freezer staples
// Organized by category for the onboarding pantry selector

export const pantryCategories = {
  'Oils & Fats': [
    'Olive Oil', 'Vegetable Oil', 'Canola Oil', 'Coconut Oil', 'Avocado Oil',
    'Sesame Oil', 'Butter', 'Ghee', 'Cooking Spray', 'Lard',
  ],
  'Grains & Starches': [
    'White Rice', 'Brown Rice', 'Jasmine Rice', 'Basmati Rice', 'Quinoa',
    'Oats (Rolled)', 'Pasta (Spaghetti)', 'Pasta (Penne)', 'Pasta (Macaroni)',
    'Egg Noodles', 'Couscous', 'Bread', 'Tortillas (Flour)', 'Tortillas (Corn)',
    'Pita Bread', 'Breadcrumbs', 'Panko', 'Cornmeal', 'Crackers',
  ],
  'Baking Essentials': [
    'All-Purpose Flour', 'Whole Wheat Flour', 'Bread Flour', 'Almond Flour',
    'Granulated Sugar', 'Brown Sugar', 'Powdered Sugar', 'Baking Soda',
    'Baking Powder', 'Cornstarch', 'Yeast', 'Vanilla Extract',
    'Cocoa Powder', 'Chocolate Chips',
  ],
  'Canned & Jarred': [
    'Canned Tomatoes (Diced)', 'Tomato Paste', 'Tomato Sauce', 'Canned Beans (Black)',
    'Canned Beans (Kidney)', 'Canned Chickpeas', 'Canned Corn', 'Canned Tuna',
    'Canned Coconut Milk', 'Chicken Broth', 'Beef Broth', 'Vegetable Broth',
    'Olives', 'Pickles', 'Capers', 'Roasted Red Peppers', 'Salsa (Jarred)',
    'Peanut Butter', 'Jam/Jelly', 'Applesauce',
  ],
  'Condiments & Sauces': [
    'Soy Sauce', 'Hot Sauce', 'Ketchup', 'Yellow Mustard', 'Dijon Mustard',
    'Mayonnaise', 'White Vinegar', 'Apple Cider Vinegar', 'Balsamic Vinegar',
    'Rice Vinegar', 'Worcestershire Sauce', 'BBQ Sauce', 'Sriracha',
    'Tahini', 'Fish Sauce', 'Hoisin Sauce', 'Oyster Sauce', 'Teriyaki Sauce',
    'Honey', 'Maple Syrup', 'Ranch Dressing', 'Italian Dressing',
  ],
  'Dairy & Eggs': [
    'Eggs', 'Milk', 'Heavy Cream', 'Sour Cream', 'Cream Cheese',
    'Shredded Cheese (Cheddar)', 'Shredded Cheese (Mozzarella)', 'Parmesan Cheese',
    'Yogurt (Plain)', 'Butter (Unsalted)',
  ],
  'Nuts, Seeds & Dried Fruit': [
    'Almonds', 'Walnuts', 'Peanuts', 'Raisins', 'Chia Seeds',
  ],
};

// Flat list of all pantry items
export const allPantryItems = Object.values(pantryCategories).flat();

// Top picks shown as pills (most universally owned)
export const topPantryItems = [
  'Olive Oil', 'Butter', 'White Rice', 'Pasta (Spaghetti)', 'Bread',
  'All-Purpose Flour', 'Granulated Sugar', 'Eggs', 'Milk',
  'Soy Sauce', 'Ketchup', 'Mayonnaise', 'Hot Sauce', 'Honey',
  'Canned Tomatoes (Diced)', 'Chicken Broth', 'Peanut Butter',
  'Baking Soda', 'Baking Powder', 'Cornstarch', 'Vanilla Extract',
  'Tortillas (Flour)', 'Shredded Cheese (Cheddar)', 'Oats (Rolled)',
];

export default allPantryItems;

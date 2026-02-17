// 100 most common kitchen spices, herbs, and seasonings
// Organized by category for the onboarding pantry selector

export const spiceCategories = {
  'Everyday Essentials': [
    'Salt', 'Black Pepper', 'Garlic Powder', 'Onion Powder', 'Paprika',
    'Crushed Red Pepper Flakes', 'Italian Seasoning', 'Chili Powder',
    'Cumin', 'Cinnamon',
  ],
  'Dried Herbs': [
    'Oregano', 'Basil', 'Thyme', 'Rosemary', 'Parsley',
    'Dill', 'Bay Leaves', 'Sage', 'Tarragon', 'Marjoram',
    'Chives', 'Mint', 'Cilantro (Dried)', 'Herbes de Provence', 'Fines Herbes',
  ],
  'Warm & Baking Spices': [
    'Nutmeg', 'Cloves', 'Allspice', 'Cardamom', 'Ginger (Ground)',
    'Vanilla Extract', 'Pumpkin Pie Spice', 'Apple Pie Spice', 'Anise Seed',
    'Mace',
  ],
  'Heat & Chili': [
    'Cayenne Pepper', 'Smoked Paprika', 'Chipotle Powder', 'Ancho Chili Powder',
    'Habanero Powder', 'Jalapeño Powder', 'Ghost Pepper Flakes',
    'Aleppo Pepper', 'Gochugaru (Korean Chili Flakes)', 'Tajín',
  ],
  'Global & Specialty': [
    'Turmeric', 'Curry Powder', 'Garam Masala', 'Chinese Five Spice',
    'Star Anise', 'Lemongrass (Dried)', 'Saffron', 'Sumac',
    'Za\'atar', 'Ras el Hanout', 'Berbere', 'Jerk Seasoning',
    'Furikake', 'Togarashi (Shichimi)', 'Tandoori Masala',
  ],
  'Seeds & Whole Spices': [
    'Cumin Seeds', 'Coriander Seeds', 'Fennel Seeds', 'Mustard Seeds',
    'Celery Seeds', 'Caraway Seeds', 'Sesame Seeds', 'Poppy Seeds',
    'Peppercorns (Whole)', 'Juniper Berries',
  ],
  'Salts & Blends': [
    'Sea Salt', 'Kosher Salt', 'Garlic Salt', 'Celery Salt',
    'Onion Salt', 'Seasoned Salt', 'Old Bay Seasoning', 'Taco Seasoning',
    'Ranch Seasoning', 'Everything Bagel Seasoning', 'Lemon Pepper',
    'Steak Seasoning', 'Poultry Seasoning', 'Cajun Seasoning', 'Creole Seasoning',
  ],
  'Fresh Aromatics': [
    'Garlic (Fresh)', 'Onions', 'Ginger (Fresh)', 'Shallots', 'Scallions',
    'Leeks', 'Chives (Fresh)', 'Cilantro (Fresh)', 'Basil (Fresh)',
    'Rosemary (Fresh)', 'Thyme (Fresh)', 'Mint (Fresh)', 'Parsley (Fresh)',
    'Jalapeños', 'Serrano Peppers',
  ],
};

// Flat list of all spices for quick access
export const allSpices = Object.values(spiceCategories).flat();

// Top picks shown as pills (most universally owned)
export const topSpices = [
  'Salt', 'Black Pepper', 'Garlic Powder', 'Onion Powder', 'Paprika',
  'Cumin', 'Oregano', 'Basil', 'Cinnamon', 'Chili Powder',
  'Italian Seasoning', 'Thyme', 'Cayenne Pepper', 'Turmeric',
  'Ginger (Ground)', 'Rosemary', 'Bay Leaves', 'Crushed Red Pepper Flakes',
  'Parsley', 'Garlic (Fresh)', 'Onions', 'Nutmeg', 'Curry Powder',
  'Smoked Paprika',
];

export default allSpices;

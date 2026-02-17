// 100 most common kitchen tools and equipment
// Organized by category for the onboarding pantry selector

export const toolCategories = {
  'Cookware': [
    'Nonstick Skillet', 'Cast Iron Skillet', 'Stainless Steel Pan', 'Saucepan (Small)',
    'Saucepan (Large)', 'Stock Pot', 'Dutch Oven', 'Wok', 'Griddle',
    'Sauté Pan', 'Roasting Pan', 'Baking Sheet', 'Casserole Dish',
  ],
  'Bakeware': [
    'Cake Pan', 'Muffin Tin', 'Loaf Pan', 'Pie Dish', 'Cookie Sheet',
    'Bundt Pan', 'Springform Pan', 'Cooling Rack', '9x13 Baking Dish',
    'Ramekins', 'Pizza Stone',
  ],
  'Knives & Cutting': [
    'Chef\'s Knife', 'Paring Knife', 'Bread Knife', 'Serrated Knife',
    'Kitchen Shears', 'Cutting Board (Wood)', 'Cutting Board (Plastic)',
    'Knife Sharpener', 'Mandoline Slicer', 'Pizza Cutter',
  ],
  'Utensils': [
    'Spatula', 'Wooden Spoon', 'Tongs', 'Whisk', 'Ladle',
    'Slotted Spoon', 'Rubber Spatula', 'Potato Masher', 'Meat Tenderizer',
    'Rolling Pin', 'Pastry Brush', 'Ice Cream Scoop', 'Can Opener',
    'Bottle Opener', 'Corkscrew', 'Garlic Press',
  ],
  'Measuring & Prep': [
    'Measuring Cups', 'Measuring Spoons', 'Kitchen Scale', 'Meat Thermometer',
    'Mixing Bowls', 'Colander', 'Fine Mesh Strainer', 'Grater (Box)',
    'Microplane/Zester', 'Vegetable Peeler', 'Citrus Juicer',
    'Salad Spinner', 'Funnel', 'Timer',
  ],
  'Small Appliances': [
    'Blender', 'Food Processor', 'Stand Mixer', 'Hand Mixer',
    'Immersion Blender', 'Toaster', 'Toaster Oven', 'Microwave',
    'Coffee Maker', 'Electric Kettle', 'Slow Cooker', 'Instant Pot',
    'Air Fryer', 'Rice Cooker', 'Waffle Maker', 'Juicer',
    'Spiralizer', 'Bread Machine', 'Sous Vide', 'Dehydrator',
    'Popcorn Maker', 'Ice Cream Maker', 'Espresso Machine',
  ],
  'Large Appliances': [
    'Oven', 'Stovetop', 'Grill (Outdoor)', 'Smoker', 'Deep Fryer',
    'Convection Oven', 'Dishwasher',
  ],
  'Storage & Misc': [
    'Food Storage Containers', 'Zip-Lock Bags', 'Aluminum Foil',
    'Plastic Wrap', 'Parchment Paper', 'Paper Towels',
  ],
};

// Flat list of all tools
export const allTools = Object.values(toolCategories).flat();

// Top picks shown as pills (most universally owned)
export const topTools = [
  'Nonstick Skillet', 'Saucepan (Small)', 'Stock Pot', 'Baking Sheet',
  'Chef\'s Knife', 'Cutting Board (Wood)', 'Spatula', 'Wooden Spoon',
  'Tongs', 'Whisk', 'Measuring Cups', 'Measuring Spoons', 'Mixing Bowls',
  'Colander', 'Can Opener', 'Blender', 'Toaster', 'Microwave',
  'Oven', 'Stovetop', 'Coffee Maker', 'Food Storage Containers',
  'Air Fryer', 'Instant Pot',
];

export default allTools;

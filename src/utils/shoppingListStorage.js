/**
 * Shopping List Storage Utility
 *
 * Manages shopping list items in localStorage with support for:
 * - Adding individual items or bulk recipe ingredients
 * - Tracking item source (manual, recipe name)
 * - Checkbox state persistence
 * - Duplicate detection and quantity merging
 */

const STORAGE_KEY = 'dishdollar_shopping_list';
const HISTORY_KEY = 'dishdollar_shopping_history';

// Common grocery items for auto-suggest
export const COMMON_GROCERY_ITEMS = [
  // Produce
  'Apples', 'Bananas', 'Oranges', 'Lemons', 'Limes', 'Avocados', 'Tomatoes',
  'Onions', 'Garlic', 'Potatoes', 'Sweet Potatoes', 'Carrots', 'Celery',
  'Broccoli', 'Spinach', 'Lettuce', 'Kale', 'Bell Peppers', 'Mushrooms',
  'Zucchini', 'Cucumber', 'Green Beans', 'Corn', 'Peas',
  // Dairy
  'Milk', 'Eggs', 'Butter', 'Cheese', 'Greek Yogurt', 'Sour Cream',
  'Heavy Cream', 'Cream Cheese', 'Parmesan', 'Mozzarella', 'Cheddar',
  // Meat & Protein
  'Chicken Breast', 'Ground Beef', 'Bacon', 'Salmon', 'Shrimp', 'Tofu',
  'Chicken Thighs', 'Pork Chops', 'Ground Turkey', 'Sausage',
  // Pantry
  'Bread', 'Rice', 'Pasta', 'Flour', 'Sugar', 'Olive Oil', 'Vegetable Oil',
  'Salt', 'Pepper', 'Chicken Broth', 'Tomato Sauce', 'Diced Tomatoes',
  'Black Beans', 'Chickpeas', 'Peanut Butter', 'Honey', 'Maple Syrup',
  // Spices
  'Cumin', 'Paprika', 'Oregano', 'Basil', 'Thyme', 'Rosemary', 'Cinnamon',
  'Chili Powder', 'Garlic Powder', 'Onion Powder', 'Italian Seasoning',
  // Condiments
  'Ketchup', 'Mustard', 'Mayo', 'Soy Sauce', 'Hot Sauce', 'Vinegar',
  'Worcestershire Sauce', 'BBQ Sauce', 'Sriracha'
];

/**
 * Generate a unique ID for shopping list items
 */
const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Normalize ingredient name for comparison
 */
const normalizeIngredient = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Shopping list storage operations
 */
export const shoppingListStorage = {
  /**
   * Get all shopping list items
   */
  getItems: () => {
    try {
      const items = localStorage.getItem(STORAGE_KEY);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('Error reading shopping list:', error);
      return [];
    }
  },

  /**
   * Save items to storage
   */
  saveItems: (items) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving shopping list:', error);
    }
  },

  /**
   * Add a single item to the shopping list
   * @param {Object} item - Item to add
   * @param {string} item.name - Item name
   * @param {number} [item.quantity] - Quantity
   * @param {string} [item.unit] - Unit of measurement
   * @param {string} [item.source] - Source (recipe name or 'manual')
   */
  addItem: (item) => {
    const items = shoppingListStorage.getItems();
    const normalizedName = normalizeIngredient(item.name);

    // Check for existing item with same name
    const existingIndex = items.findIndex(
      i => normalizeIngredient(i.name) === normalizedName
    );

    if (existingIndex !== -1) {
      // Update existing item quantity if applicable
      const existing = items[existingIndex];
      if (item.quantity && existing.quantity && item.unit === existing.unit) {
        existing.quantity += item.quantity;
      }
      // Add source if from a new recipe
      if (item.source && item.source !== 'manual' && !existing.sources?.includes(item.source)) {
        existing.sources = [...(existing.sources || []), item.source];
      }
    } else {
      // Add new item
      items.push({
        id: generateId(),
        name: item.name,
        quantity: item.quantity || null,
        unit: item.unit || null,
        checked: false,
        source: item.source || 'manual',
        sources: item.source && item.source !== 'manual' ? [item.source] : [],
        addedAt: new Date().toISOString()
      });
    }

    shoppingListStorage.saveItems(items);
    shoppingListStorage.addToHistory(item.name);
    return items;
  },

  /**
   * Add all ingredients from a recipe
   * @param {Object} recipe - Recipe object
   * @param {Array} ingredients - Array of ingredient objects or strings
   */
  addRecipeItems: (recipe, ingredients) => {
    const recipeName = recipe?.title || recipe?.name || 'Recipe';
    let addedCount = 0;

    ingredients.forEach(ingredient => {
      if (typeof ingredient === 'string') {
        shoppingListStorage.addItem({
          name: ingredient,
          source: recipeName
        });
      } else {
        shoppingListStorage.addItem({
          name: ingredient.name || ingredient.ingredient || ingredient,
          quantity: ingredient.quantity || ingredient.amount,
          unit: ingredient.unit,
          source: recipeName
        });
      }
      addedCount++;
    });

    return addedCount;
  },

  /**
   * Update an item's properties
   * @param {string} id - Item ID
   * @param {Object} updates - Properties to update
   */
  updateItem: (id, updates) => {
    const items = shoppingListStorage.getItems();
    const index = items.findIndex(item => item.id === id);

    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      shoppingListStorage.saveItems(items);
    }

    return items;
  },

  /**
   * Toggle item checked state
   * @param {string} id - Item ID
   */
  toggleItem: (id) => {
    const items = shoppingListStorage.getItems();
    const index = items.findIndex(item => item.id === id);

    if (index !== -1) {
      items[index].checked = !items[index].checked;
      shoppingListStorage.saveItems(items);
    }

    return items;
  },

  /**
   * Remove an item by ID
   * @param {string} id - Item ID
   */
  removeItem: (id) => {
    const items = shoppingListStorage.getItems();
    const filtered = items.filter(item => item.id !== id);
    shoppingListStorage.saveItems(filtered);
    return filtered;
  },

  /**
   * Clear all items
   */
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  },

  /**
   * Clear only checked items
   */
  clearChecked: () => {
    const items = shoppingListStorage.getItems();
    const unchecked = items.filter(item => !item.checked);
    shoppingListStorage.saveItems(unchecked);
    return unchecked;
  },

  /**
   * Remove all items from a specific recipe
   * @param {string} recipeName - Recipe name to remove items from
   */
  removeRecipeItems: (recipeName) => {
    const items = shoppingListStorage.getItems();
    const filtered = items.filter(item => {
      // If primary source matches, check if there are other sources
      if (item.source === recipeName) {
        // If there are other sources, update the item
        if (item.sources && item.sources.length > 1) {
          item.sources = item.sources.filter(s => s !== recipeName);
          item.source = item.sources[0] || 'manual';
          return true;
        }
        // No other sources, remove the item
        return false;
      }
      // If in sources array, remove from sources
      if (item.sources?.includes(recipeName)) {
        item.sources = item.sources.filter(s => s !== recipeName);
        // If no sources left, remove the item
        if (item.sources.length === 0) {
          return false;
        }
      }
      return true;
    });
    shoppingListStorage.saveItems(filtered);
    return filtered;
  },

  /**
   * Check if a recipe's ingredients are in the list
   * @param {string} recipeName - Recipe name to check
   */
  hasRecipeItems: (recipeName) => {
    const items = shoppingListStorage.getItems();
    return items.some(item =>
      item.source === recipeName || item.sources?.includes(recipeName)
    );
  },

  /**
   * Get items grouped by source/recipe
   */
  getGroupedItems: () => {
    const items = shoppingListStorage.getItems();
    const groups = {};

    items.forEach(item => {
      const source = item.source || 'Other';
      if (!groups[source]) {
        groups[source] = [];
      }
      groups[source].push(item);
    });

    return groups;
  },

  /**
   * Add item name to history for auto-suggest
   */
  addToHistory: (name) => {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const normalizedName = normalizeIngredient(name);

      // Remove if exists and add to front
      const filtered = history.filter(h => normalizeIngredient(h) !== normalizedName);
      filtered.unshift(name);

      // Keep only last 100 items
      const trimmed = filtered.slice(0, 100);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error updating history:', error);
    }
  },

  /**
   * Get auto-suggest items based on query
   * @param {string} query - Search query
   * @param {number} limit - Max results
   */
  getSuggestions: (query, limit = 10) => {
    if (!query || query.length < 2) return [];

    const normalizedQuery = normalizeIngredient(query);
    const suggestions = new Set();

    // Search history first (user's own items)
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      history.forEach(item => {
        if (normalizeIngredient(item).includes(normalizedQuery)) {
          suggestions.add(item);
        }
      });
    } catch (error) {
      // Ignore history errors
    }

    // Then search common items
    COMMON_GROCERY_ITEMS.forEach(item => {
      if (normalizeIngredient(item).includes(normalizedQuery)) {
        suggestions.add(item);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }
};

export default shoppingListStorage;

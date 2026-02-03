/**
 * Ingredient Normalizer Utility
 *
 * Validates and normalizes ingredient objects for consistent data handling
 * and Instacart API compatibility.
 */

/**
 * Unit mappings from common variations to Instacart-supported standard units
 * @see https://docs.instacart.com/developer_platform_api/
 */
const UNIT_MAPPINGS = {
  // Volume - Large
  'gallon': 'gal',
  'gallons': 'gal',
  'gal': 'gal',

  // Volume - Medium
  'quart': 'qt',
  'quarts': 'qt',
  'qt': 'qt',
  'qts': 'qt',

  'pint': 'pt',
  'pints': 'pt',
  'pt': 'pt',

  'liter': 'l',
  'liters': 'l',
  'litre': 'l',
  'litres': 'l',
  'l': 'l',

  // Volume - Small
  'cup': 'cup',
  'cups': 'cup',
  'c': 'cup',
  'c.': 'cup',

  'fluid ounce': 'fl oz',
  'fluid ounces': 'fl oz',
  'fl oz': 'fl oz',
  'fl. oz.': 'fl oz',
  'fl oz.': 'fl oz',

  'tablespoon': 'tbsp',
  'tablespoons': 'tbsp',
  'tbsp': 'tbsp',
  'tbsp.': 'tbsp',
  'tbs': 'tbsp',
  'tbs.': 'tbsp',
  'tb': 'tbsp',
  't': 'tbsp', // Capital T is sometimes used for tablespoon
  'T': 'tbsp',

  'teaspoon': 'tsp',
  'teaspoons': 'tsp',
  'tsp': 'tsp',
  'tsp.': 'tsp',
  'ts': 'tsp',
  't.': 'tsp',

  'milliliter': 'ml',
  'milliliters': 'ml',
  'millilitre': 'ml',
  'millilitres': 'ml',
  'ml': 'ml',
  'mL': 'ml',

  // Weight - Large
  'pound': 'lb',
  'pounds': 'lb',
  'lb': 'lb',
  'lbs': 'lb',
  'lb.': 'lb',
  'lbs.': 'lb',

  'kilogram': 'kg',
  'kilograms': 'kg',
  'kg': 'kg',
  'kgs': 'kg',

  // Weight - Small
  'ounce': 'oz',
  'ounces': 'oz',
  'oz': 'oz',
  'oz.': 'oz',

  'gram': 'g',
  'grams': 'g',
  'g': 'g',
  'gm': 'g',
  'gms': 'g',

  'milligram': 'mg',
  'milligrams': 'mg',
  'mg': 'mg',

  // Count/Generic
  'piece': 'piece',
  'pieces': 'piece',
  'pc': 'piece',
  'pcs': 'piece',

  'slice': 'slice',
  'slices': 'slice',

  'clove': 'clove',
  'cloves': 'clove',

  'sprig': 'sprig',
  'sprigs': 'sprig',

  'bunch': 'bunch',
  'bunches': 'bunch',

  'head': 'head',
  'heads': 'head',

  'stalk': 'stalk',
  'stalks': 'stalk',

  'ear': 'ear',
  'ears': 'ear',

  'can': 'can',
  'cans': 'can',

  'jar': 'jar',
  'jars': 'jar',

  'package': 'pkg',
  'packages': 'pkg',
  'pkg': 'pkg',
  'pkgs': 'pkg',
  'pack': 'pkg',
  'packs': 'pkg',

  'box': 'box',
  'boxes': 'box',

  'bag': 'bag',
  'bags': 'bag',

  'bottle': 'bottle',
  'bottles': 'bottle',

  'container': 'container',
  'containers': 'container',

  // Size descriptors (mapped to generic)
  'small': 'small',
  'medium': 'medium',
  'med': 'medium',
  'large': 'large',
  'lg': 'large',
  'extra large': 'extra large',
  'xl': 'extra large',

  // Pinch/dash (very small amounts)
  'pinch': 'pinch',
  'pinches': 'pinch',
  'dash': 'dash',
  'dashes': 'dash',

  // Generic/whole items
  'whole': 'whole',
  'each': 'each',
  'item': 'each',
  'items': 'each',
  '': 'each', // Default for no unit
  'unit': 'each',
  'units': 'each'
};

/**
 * Normalize a unit string to Instacart-supported format
 * @param {string} unit - The unit to normalize
 * @returns {string} Normalized unit or original if not found
 */
export const normalizeUnit = (unit) => {
  if (!unit) return 'each';

  const normalized = unit.toString().toLowerCase().trim();
  return UNIT_MAPPINGS[normalized] || normalized;
};

/**
 * Parse amount string to number
 * Handles fractions like "1/2", "1 1/2", unicode fractions, and ranges
 * @param {string|number} amount - The amount to parse
 * @returns {number} Parsed numeric amount
 */
export const parseAmount = (amount) => {
  if (typeof amount === 'number') return amount;
  if (!amount) return 1;

  let str = amount.toString().trim();

  // Handle unicode fractions
  const unicodeFractions = {
    '½': 0.5, '⅓': 0.333, '⅔': 0.667,
    '¼': 0.25, '¾': 0.75,
    '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
    '⅙': 0.167, '⅚': 0.833,
    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
  };

  // Replace unicode fractions with decimals
  for (const [frac, val] of Object.entries(unicodeFractions)) {
    if (str.includes(frac)) {
      // Handle "1½" -> 1 + 0.5
      const match = str.match(new RegExp(`(\\d+)?\\s*${frac}`));
      if (match) {
        const whole = match[1] ? parseInt(match[1]) : 0;
        return whole + val;
      }
    }
  }

  // Handle ranges like "2-3" - take the average
  if (str.includes('-')) {
    const parts = str.split('-').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return (parts[0] + parts[1]) / 2;
    }
  }

  // Handle "to" ranges like "2 to 3"
  if (str.includes(' to ')) {
    const parts = str.split(' to ').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return (parts[0] + parts[1]) / 2;
    }
  }

  // Handle mixed fractions like "1 1/2"
  const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const numerator = parseInt(mixedMatch[2]);
    const denominator = parseInt(mixedMatch[3]);
    return whole + (numerator / denominator);
  }

  // Handle simple fractions like "1/2"
  const fractionMatch = str.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    return parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
  }

  // Try to parse as float
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 1 : parsed;
};

/**
 * Clean and normalize ingredient name
 * @param {string} name - Raw ingredient name
 * @returns {string} Cleaned ingredient name
 */
export const cleanIngredientName = (name) => {
  if (!name) return '';

  return name
    .toString()
    .toLowerCase()
    .trim()
    // Remove preparation instructions in parentheses
    .replace(/\(.*?\)/g, '')
    // Remove common preparation words
    .replace(/\b(fresh|freshly|frozen|canned|diced|chopped|minced|sliced|grated|shredded|crushed|ground|whole|peeled|seeded|pitted|trimmed|cleaned|washed|dried|raw|cooked|roasted|toasted|melted|softened|room temperature|optional)\b/gi, '')
    // Remove "for garnish", "to taste", etc.
    .replace(/\b(for (garnish|serving|topping)|to taste|as needed|divided|plus more)\b/gi, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Validate that an ingredient object has required fields
 * @param {Object} ingredient - Ingredient object to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export const validateIngredient = (ingredient) => {
  const errors = [];

  if (!ingredient) {
    return { valid: false, errors: ['Ingredient is null or undefined'] };
  }

  if (!ingredient.name && !ingredient.ingredient) {
    errors.push('Missing ingredient name');
  }

  // Amount is optional but should be valid if present
  if (ingredient.amount !== undefined && ingredient.amount !== null) {
    const parsed = parseAmount(ingredient.amount);
    if (parsed <= 0) {
      errors.push('Invalid amount: must be positive');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Normalize an ingredient object to standard format
 * @param {Object} ingredient - Raw ingredient object
 * @param {Object} options - Normalization options
 * @param {boolean} options.cleanName - Whether to clean the ingredient name (default: false)
 * @param {boolean} options.parseAmounts - Whether to parse amount strings (default: true)
 * @returns {Object} Normalized ingredient object
 */
export const normalizeIngredient = (ingredient, options = {}) => {
  const { cleanName = false, parseAmounts = true } = options;

  if (!ingredient) {
    return {
      name: '',
      amount: 1,
      unit: 'each',
      display_text: '',
      _normalized: true,
      _valid: false
    };
  }

  // Extract name from various possible field names
  const rawName = ingredient.name || ingredient.ingredient || ingredient.item || '';
  const name = cleanName ? cleanIngredientName(rawName) : rawName.trim();

  // Extract and parse amount
  const rawAmount = ingredient.amount ?? ingredient.quantity ?? ingredient.qty ?? 1;
  const amount = parseAmounts ? parseAmount(rawAmount) : rawAmount;

  // Extract and normalize unit
  const rawUnit = ingredient.unit ?? ingredient.measure ?? ingredient.measurement ?? '';
  const unit = normalizeUnit(rawUnit);

  // Build display text
  const display_text = ingredient.display_text ||
    ingredient.original_text ||
    ingredient.raw ||
    `${amount} ${unit} ${name}`.trim();

  // Validate
  const validation = validateIngredient({ name, amount, unit });

  return {
    name,
    amount,
    unit,
    display_text,
    // Preserve original fields that might be useful
    ...(ingredient.estimated_price !== undefined && { estimated_price: ingredient.estimated_price }),
    ...(ingredient.category && { category: ingredient.category }),
    ...(ingredient.department && { department: ingredient.department }),
    ...(ingredient.is_optional !== undefined && { is_optional: ingredient.is_optional }),
    // Metadata
    _normalized: true,
    _valid: validation.valid,
    _errors: validation.errors.length > 0 ? validation.errors : undefined
  };
};

/**
 * Normalize an array of ingredients
 * @param {Array} ingredients - Array of ingredient objects or strings
 * @param {Object} options - Normalization options
 * @returns {Array} Array of normalized ingredients
 */
export const normalizeIngredients = (ingredients, options = {}) => {
  if (!Array.isArray(ingredients)) return [];

  return ingredients.map(ing => {
    // Handle string ingredients
    if (typeof ing === 'string') {
      return normalizeIngredient({ name: ing, amount: 1, unit: '' }, options);
    }
    return normalizeIngredient(ing, options);
  });
};

/**
 * Format ingredient for display
 * @param {Object} ingredient - Normalized ingredient object
 * @param {number} scale - Scale factor for amounts (default: 1)
 * @returns {string} Formatted display string
 */
export const formatIngredient = (ingredient, scale = 1) => {
  const normalized = ingredient._normalized ? ingredient : normalizeIngredient(ingredient);
  const scaledAmount = normalized.amount * scale;

  // Format amount nicely (avoid ugly decimals)
  let amountStr;
  if (scaledAmount === Math.floor(scaledAmount)) {
    amountStr = scaledAmount.toString();
  } else if (Math.abs(scaledAmount - 0.25) < 0.01) {
    amountStr = '1/4';
  } else if (Math.abs(scaledAmount - 0.5) < 0.01) {
    amountStr = '1/2';
  } else if (Math.abs(scaledAmount - 0.75) < 0.01) {
    amountStr = '3/4';
  } else if (Math.abs(scaledAmount - 0.333) < 0.01) {
    amountStr = '1/3';
  } else if (Math.abs(scaledAmount - 0.667) < 0.01) {
    amountStr = '2/3';
  } else {
    amountStr = scaledAmount.toFixed(1).replace(/\.0$/, '');
  }

  const unit = normalized.unit === 'each' ? '' : normalized.unit;
  return `${amountStr} ${unit} ${normalized.name}`.replace(/\s+/g, ' ').trim();
};

/**
 * Convert ingredient to Instacart API format
 * @param {Object} ingredient - Ingredient object
 * @param {Object} options - Conversion options
 * @param {Array} options.health_filters - Health filters to apply (e.g., ['ORGANIC'])
 * @param {Array} options.brand_filters - Brand preferences
 * @returns {Object} Instacart-formatted ingredient
 */
export const toInstacartFormat = (ingredient, options = {}) => {
  const normalized = ingredient._normalized ? ingredient : normalizeIngredient(ingredient);
  const { health_filters = [], brand_filters = [] } = options;

  return {
    name: normalized.name,
    display_text: normalized.display_text || formatIngredient(normalized),
    measurements: [
      {
        quantity: normalized.amount,
        unit: normalized.unit
      }
    ],
    ...(health_filters.length > 0 || brand_filters.length > 0) && {
      filters: {
        ...(health_filters.length > 0 && { health_filters }),
        ...(brand_filters.length > 0 && { brand_filters })
      }
    }
  };
};

export default {
  normalizeUnit,
  parseAmount,
  cleanIngredientName,
  validateIngredient,
  normalizeIngredient,
  normalizeIngredients,
  formatIngredient,
  toInstacartFormat,
  UNIT_MAPPINGS
};

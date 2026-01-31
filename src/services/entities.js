import { supabase, isSupabaseConfigured } from '@/api/supabase';

/**
 * Create a localStorage-based entity service with optional Supabase backend
 * @param {string} entityName - Name of the entity (used as storage key and Supabase table name)
 * @param {string} [tableName] - Optional Supabase table name if different from entityName
 */
function createEntityService(entityName, tableName = null) {
  const STORAGE_KEY = `dishdollar_${entityName.toLowerCase()}`;
  const TABLE_NAME = tableName || entityName.toLowerCase();

  // Get all items from localStorage
  const getLocalItems = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  // Save items to localStorage
  const saveLocalItems = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  return {
    /**
     * Create a new entity
     * @param {Object} data - Entity data
     * @returns {Promise<Object>} Created entity with ID
     */
    async create(data) {
      const entity = {
        ...data,
        id: data.id || `${entityName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_date: data.created_date || new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: created, error } = await supabase
            .from(TABLE_NAME)
            .insert([entity])
            .select()
            .single();
          if (error) throw error;
          return created;
        } catch (error) {
          console.warn(`Supabase create failed for ${entityName}, using localStorage:`, error.message);
        }
      }

      // localStorage fallback
      const items = getLocalItems();
      items.push(entity);
      saveLocalItems(items);
      return entity;
    },

    /**
     * Get entity by ID
     * @param {string} id - Entity ID
     * @returns {Promise<Object|null>} Entity or null
     */
    async get(id) {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          return data;
        } catch (error) {
          console.warn(`Supabase get failed for ${entityName}, using localStorage:`, error.message);
        }
      }

      // localStorage fallback
      const items = getLocalItems();
      return items.find(item => item.id === id) || null;
    },

    /**
     * Update entity by ID
     * @param {string} id - Entity ID
     * @param {Object} data - Updated data
     * @returns {Promise<Object>} Updated entity
     */
    async update(id, data) {
      const updatedData = {
        ...data,
        updated_date: new Date().toISOString()
      };

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: updated, error } = await supabase
            .from(TABLE_NAME)
            .update(updatedData)
            .eq('id', id)
            .select()
            .single();
          if (error) throw error;
          return updated;
        } catch (error) {
          console.warn(`Supabase update failed for ${entityName}, using localStorage:`, error.message);
        }
      }

      // localStorage fallback
      const items = getLocalItems();
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...updatedData };
        saveLocalItems(items);
        return items[index];
      }
      throw new Error(`${entityName} not found with id: ${id}`);
    },

    /**
     * Delete entity by ID
     * @param {string} id - Entity ID
     * @returns {Promise<void>}
     */
    async delete(id) {
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);
          if (error) throw error;
          return;
        } catch (error) {
          console.warn(`Supabase delete failed for ${entityName}, using localStorage:`, error.message);
        }
      }

      // localStorage fallback
      const items = getLocalItems();
      const filtered = items.filter(item => item.id !== id);
      saveLocalItems(filtered);
    },

    /**
     * List entities with optional sorting
     * @param {string} [orderBy] - Field to sort by (prefix with '-' for descending)
     * @param {number} [limit] - Maximum number of results
     * @returns {Promise<Array>} List of entities
     */
    async list(orderBy = '-created_date', limit = 100) {
      let items;

      if (isSupabaseConfigured && supabase) {
        try {
          const isDescending = orderBy.startsWith('-');
          const field = isDescending ? orderBy.substring(1) : orderBy;

          let query = supabase
            .from(TABLE_NAME)
            .select('*')
            .order(field, { ascending: !isDescending });

          if (limit) {
            query = query.limit(limit);
          }

          const { data, error } = await query;
          if (error) throw error;
          return data || [];
        } catch (error) {
          console.warn(`Supabase list failed for ${entityName}, using localStorage:`, error.message);
        }
      }

      // localStorage fallback
      items = getLocalItems();

      // Sort
      const isDescending = orderBy.startsWith('-');
      const field = isDescending ? orderBy.substring(1) : orderBy;

      items.sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return isDescending ? -comparison : comparison;
      });

      // Limit
      if (limit) {
        items = items.slice(0, limit);
      }

      return items;
    },

    /**
     * Filter entities by criteria
     * @param {Object} criteria - Filter criteria (exact match)
     * @param {string} [orderBy] - Field to sort by
     * @returns {Promise<Array>} Filtered list
     */
    async filter(criteria = {}, orderBy = '-created_date') {
      if (isSupabaseConfigured && supabase) {
        try {
          const isDescending = orderBy.startsWith('-');
          const field = isDescending ? orderBy.substring(1) : orderBy;

          let query = supabase
            .from(TABLE_NAME)
            .select('*');

          // Apply filters
          for (const [key, value] of Object.entries(criteria)) {
            query = query.eq(key, value);
          }

          query = query.order(field, { ascending: !isDescending });

          const { data, error } = await query;
          if (error) throw error;
          return data || [];
        } catch (error) {
          console.warn(`Supabase filter failed for ${entityName}, using localStorage:`, error.message);
        }
      }

      // localStorage fallback
      let items = getLocalItems();

      // Apply filters
      items = items.filter(item => {
        for (const [key, value] of Object.entries(criteria)) {
          if (item[key] !== value) return false;
        }
        return true;
      });

      // Sort
      const isDescending = orderBy.startsWith('-');
      const field = isDescending ? orderBy.substring(1) : orderBy;

      items.sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return isDescending ? -comparison : comparison;
      });

      return items;
    }
  };
}

// Create entity services for all app entities
export const UserProfile = createEntityService('UserProfile', 'user_profiles');
export const Recipe = createEntityService('Recipe', 'recipes');
export const SavedRecipe = createEntityService('SavedRecipe', 'saved_recipes');
export const MealPlan = createEntityService('MealPlan', 'meal_plans');
export const BudgetEntry = createEntityService('BudgetEntry', 'budget_entries');
export const ShoppingList = createEntityService('ShoppingList', 'shopping_lists');
export const PantryItem = createEntityService('PantryItem', 'pantry_items');

// Export all entities as a single object for backwards compatibility
export const entities = {
  UserProfile,
  Recipe,
  SavedRecipe,
  MealPlan,
  BudgetEntry,
  ShoppingList,
  PantryItem
};

export default entities;

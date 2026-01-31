/**
 * DishDollar Client
 *
 * This file provides backwards compatibility for code that imported from base44Client.
 * All functionality now comes from the services module.
 */

import dishDollar, { auth, entities } from '@/services';

// Re-export as base44 for backwards compatibility
export const base44 = {
  auth,
  entities,
  appLogs: dishDollar.appLogs,
  integrations: dishDollar.integrations
};

export default base44;

/**
 * BudgetBite Client
 *
 * This file provides backwards compatibility for code that imported from base44Client.
 * All functionality now comes from the services module.
 */

import budgetBite, { auth, entities } from '@/services';

// Re-export as base44 for backwards compatibility
export const base44 = {
  auth,
  entities,
  appLogs: budgetBite.appLogs,
  integrations: budgetBite.integrations
};

export default base44;

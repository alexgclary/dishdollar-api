import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Trash2, PieChart, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import BudgetTracker from '@/components/budget/BudgetTracker';
import { format } from 'date-fns';

export default function Budget() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      return profiles[0];
    }
  });

  const { data: budgetEntries = [] } = useQuery({
    queryKey: ['budgetEntries'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.BudgetEntry.filter({ user_id: user.id });
    }
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId) => base44.entities.BudgetEntry.delete(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetEntries'] });
      toast({
        title: "Entry Deleted",
        description: "Budget entry has been removed"
      });
    }
  });

  const calculateBudgetStats = () => {
    if (!userProfile) return { spent: 0, budget: 150, daysRemaining: 7, periodStart: new Date() };
    
    const now = new Date();
    let periodStart;
    let periodDays;
    
    if (userProfile.budget_type === 'weekly') {
      periodDays = 7;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - now.getDay());
    } else if (userProfile.budget_type === 'monthly') {
      periodDays = 30;
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      periodDays = userProfile.budget_days || 7;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - periodDays);
    }
    
    const spent = budgetEntries
      .filter(entry => new Date(entry.date) >= periodStart)
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    const daysPassed = Math.floor((now - periodStart) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(periodDays - daysPassed, 0);
    
    return {
      spent,
      budget: userProfile.budget_amount || 150,
      daysRemaining,
      budgetType: userProfile.budget_type || 'weekly',
      periodStart
    };
  };

  const budgetStats = calculateBudgetStats();

  const currentPeriodEntries = budgetEntries
    .filter(entry => new Date(entry.date) >= budgetStats.periodStart)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const spendingByDate = currentPeriodEntries.reduce((acc, entry) => {
    const date = entry.date;
    acc[date] = (acc[date] || 0) + entry.amount;
    return acc;
  }, {});

  const handleDelete = (entryId, amount) => {
    if (confirm('Delete this budget entry?')) {
      deleteEntryMutation.mutate(entryId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(createPageUrl('Home'))}
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <DollarSign className="w-10 h-10" />
                Budget Tracker
              </h1>
              <p className="text-green-100 mt-2">
                Monitor your grocery spending and stay on track
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <BudgetTracker
              budget={budgetStats.budget}
              spent={budgetStats.spent}
              budgetType={budgetStats.budgetType}
              daysRemaining={budgetStats.daysRemaining}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentPeriodEntries.length > 0 ? (
                  <div className="space-y-3">
                    {currentPeriodEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{entry.recipe_title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                            <span>•</span>
                            <span>{entry.servings} servings</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-green-600">
                            ${entry.amount.toFixed(2)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(entry.id, entry.amount)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No transactions yet for this period</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add recipes to your budget from the recipe details page
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <span className="text-sm text-gray-600">Total Recipes</span>
                  <span className="text-xl font-bold text-blue-600">
                    {currentPeriodEntries.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <span className="text-sm text-gray-600">Avg per Recipe</span>
                  <span className="text-xl font-bold text-green-600">
                    ${currentPeriodEntries.length > 0 
                      ? (budgetStats.spent / currentPeriodEntries.length).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <span className="text-sm text-gray-600">Daily Average</span>
                  <span className="text-xl font-bold text-amber-600">
                    ${(budgetStats.spent / Math.max(1, 7 - budgetStats.daysRemaining)).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <span className="text-sm text-gray-600">Per Person/Day</span>
                  <span className="text-xl font-bold text-purple-600">
                    ${userProfile?.household_size 
                      ? (budgetStats.spent / Math.max(1, 7 - budgetStats.daysRemaining) / userProfile.household_size).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  Spending Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(spendingByDate)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .slice(0, 5)
                    .map(([date, amount]) => (
                      <div key={date} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {format(new Date(date), 'MMM d')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                              style={{
                                width: `${Math.min((amount / budgetStats.budget) * 100, 100)}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-800 w-16 text-right">
                            ${amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  {Object.keys(spendingByDate).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No spending data yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Budget Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-green-700">
                <p>• Plan your meals weekly to stay within budget</p>
                <p>• Use ingredients you already have in your pantry</p>
                <p>• Look for seasonal produce for better prices</p>
                <p>• Batch cook and freeze portions to save money</p>
                <p>• Compare prices across stores before shopping</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

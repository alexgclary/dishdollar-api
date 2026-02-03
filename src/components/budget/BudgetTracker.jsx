import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BudgetTracker({ budget, spent, budgetType, daysRemaining }) {
  const remaining = budget - spent;
  const percentage = Math.min((spent / budget) * 100, 100);
  const isOverBudget = spent > budget;
  const dailyBudget = remaining / Math.max(daysRemaining, 1);

  const getStatusColor = () => {
    if (isOverBudget) return 'text-red-500';
    if (percentage > 80) return 'text-amber-500';
    return 'text-green-500';
  };

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage > 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-700">
            {budgetType === 'weekly' ? 'Weekly' : budgetType === 'monthly' ? 'Monthly' : 'Custom'} Budget
          </span>
          <span className={`flex items-center gap-1 ${getStatusColor()}`}>
            {isOverBudget ? (
              <>
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Over Budget</span>
              </>
            ) : percentage > 80 ? (
              <>
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Getting Close</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-5 h-5" />
                <span className="text-sm font-medium">On Track</span>
              </>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-2xl shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Budget</p>
            <p className="text-2xl font-bold text-gray-800">${budget.toFixed(0)}</p>
          </div>
          <div className="text-center p-4 bg-white rounded-2xl shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Spent</p>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-amber-500'}`}>
              ${spent.toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-2xl shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining</p>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
              ${Math.max(remaining, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{percentage.toFixed(0)}% used</span>
            <span>{daysRemaining} days left</span>
          </div>
          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getProgressColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Daily Budget Suggestion */}
        <div className="flex items-center justify-between p-4 bg-green-100 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700">Daily budget remaining</p>
              <p className="text-lg font-bold text-green-800">
                ${dailyBudget > 0 ? dailyBudget.toFixed(2) : '0.00'}/day
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
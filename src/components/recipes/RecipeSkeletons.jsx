import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Shimmer overlay component for reuse
const Shimmer = () => (
  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
);

// Skeleton base with shimmer effect
const SkeletonBox = ({ className }) => (
  <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
    <Shimmer />
  </div>
);

// Recipe Card Skeleton - matches RecipeCard layout
export function RecipeCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100">
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <SkeletonBox className="w-full h-full" />

        {/* Action buttons placeholder */}
        <div className="absolute top-3 right-3 flex gap-2">
          <SkeletonBox className="w-10 h-10 rounded-full" />
          <SkeletonBox className="w-10 h-10 rounded-full" />
        </div>

        {/* Cuisine tag placeholder */}
        <div className="absolute bottom-3 left-3">
          <SkeletonBox className="w-20 h-6 rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <SkeletonBox className="h-6 w-3/4 rounded-lg mb-2" />
        <SkeletonBox className="h-6 w-1/2 rounded-lg mb-3" />

        {/* Diet Tags */}
        <div className="flex gap-1.5 mb-3">
          <SkeletonBox className="h-5 w-16 rounded-full" />
          <SkeletonBox className="h-5 w-20 rounded-full" />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <SkeletonBox className="h-4 w-16 rounded" />
          <SkeletonBox className="h-4 w-20 rounded" />
          <SkeletonBox className="h-4 w-14 rounded" />
        </div>
      </div>
    </div>
  );
}

// Recipe Details Skeleton - matches RecipeDetails layout
export function RecipeDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      {/* Hero Image */}
      <div className="relative h-96 overflow-hidden">
        <SkeletonBox className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back button placeholder */}
        <div className="absolute top-6 left-6">
          <SkeletonBox className="w-12 h-12 rounded-full" />
        </div>

        {/* Save button placeholder */}
        <div className="absolute top-6 right-6">
          <SkeletonBox className="w-12 h-12 rounded-full" />
        </div>

        {/* Title and stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <SkeletonBox className="h-10 w-3/4 rounded-lg mb-4 bg-white/20" />
          <div className="flex gap-4">
            <SkeletonBox className="h-10 w-28 rounded-full bg-white/20" />
            <SkeletonBox className="h-10 w-28 rounded-full bg-white/20" />
            <SkeletonBox className="h-10 w-32 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tags */}
            <div className="flex gap-2">
              <SkeletonBox className="h-7 w-24 rounded-full" />
              <SkeletonBox className="h-7 w-28 rounded-full" />
              <SkeletonBox className="h-7 w-20 rounded-full" />
            </div>

            {/* Description Card */}
            <Card>
              <CardHeader>
                <SkeletonBox className="h-6 w-40 rounded" />
              </CardHeader>
              <CardContent>
                <SkeletonBox className="h-4 w-full rounded mb-2" />
                <SkeletonBox className="h-4 w-5/6 rounded mb-2" />
                <SkeletonBox className="h-4 w-4/6 rounded" />
              </CardContent>
            </Card>

            {/* Ingredients Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <SkeletonBox className="h-6 w-28 rounded" />
                <div className="flex items-center gap-2">
                  <SkeletonBox className="w-8 h-8 rounded-full" />
                  <SkeletonBox className="w-10 h-6 rounded" />
                  <SkeletonBox className="w-8 h-8 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <SkeletonBox className="w-6 h-6 rounded-full" />
                        <SkeletonBox className="h-4 w-40 rounded" />
                      </div>
                      <SkeletonBox className="h-4 w-12 rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Instructions Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <SkeletonBox className="h-6 w-28 rounded" />
                <SkeletonBox className="h-8 w-24 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4">
                      <SkeletonBox className="flex-shrink-0 w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-2 pt-1">
                        <SkeletonBox className="h-4 w-full rounded" />
                        <SkeletonBox className="h-4 w-4/5 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cost Breakdown Card */}
            <Card>
              <CardHeader>
                <SkeletonBox className="h-6 w-36 rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <SkeletonBox className="h-4 w-20 rounded" />
                    <SkeletonBox className="h-4 w-16 rounded" />
                  </div>
                  <div className="flex justify-between">
                    <SkeletonBox className="h-4 w-20 rounded" />
                    <SkeletonBox className="h-4 w-16 rounded" />
                  </div>
                </div>
                <div className="space-y-2 pt-4">
                  <SkeletonBox className="h-10 w-full rounded-full" />
                  <SkeletonBox className="h-10 w-full rounded-full" />
                  <SkeletonBox className="h-10 w-full rounded-full" />
                  <SkeletonBox className="h-10 w-full rounded-full" />
                </div>
              </CardContent>
            </Card>

            {/* Nutrition Card */}
            <Card>
              <CardHeader>
                <SkeletonBox className="h-6 w-32 rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                <SkeletonBox className="h-14 w-full rounded-xl" />
                <div className="grid grid-cols-2 gap-2">
                  <SkeletonBox className="h-12 w-full rounded-lg" />
                  <SkeletonBox className="h-12 w-full rounded-lg" />
                  <SkeletonBox className="h-12 w-full rounded-lg" />
                  <SkeletonBox className="h-12 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Grid of skeleton cards for loading states
export function RecipeCardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}

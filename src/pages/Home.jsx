import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Sparkles, ChefHat, TrendingUp, BookOpen, Calendar, Compass, Filter, X, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import RecipeCard from '@/components/recipes/RecipeCard';
import RecipeFilters from '@/components/recipes/RecipeFilters';
import BudgetTracker from '@/components/budget/BudgetTracker';

// Sample recipes to seed when none exist
const sampleRecipes = [
  {
    title: "Classic Spaghetti Carbonara",
    description: "A creamy Italian pasta dish with crispy pancetta and parmesan",
    image_url: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800",
    cuisines: ["Italian"],
    diets: [],
    prep_time: 15,
    cook_time: 20,
    servings: 4,
    total_cost: 12.50,
    ingredients: [
      { name: "Spaghetti", amount: 1, unit: "lb", estimated_price: 2.00 },
      { name: "Pancetta", amount: 8, unit: "oz", estimated_price: 5.00 },
      { name: "Eggs", amount: 4, unit: "large", estimated_price: 1.50 },
      { name: "Parmesan cheese", amount: 1, unit: "cup", estimated_price: 4.00 }
    ],
    instructions: ["Cook pasta according to package", "Fry pancetta until crispy", "Mix eggs with cheese", "Toss hot pasta with egg mixture and pancetta"]
  },
  {
    title: "Thai Green Curry",
    description: "Fragrant coconut curry with vegetables and your choice of protein",
    image_url: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
    cuisines: ["Thai"],
    diets: ["Gluten-Free"],
    prep_time: 20,
    cook_time: 25,
    servings: 4,
    total_cost: 15.00,
    ingredients: [
      { name: "Coconut milk", amount: 2, unit: "cans", estimated_price: 4.00 },
      { name: "Green curry paste", amount: 3, unit: "tbsp", estimated_price: 3.00 },
      { name: "Chicken breast", amount: 1, unit: "lb", estimated_price: 5.00 },
      { name: "Mixed vegetables", amount: 2, unit: "cups", estimated_price: 3.00 }
    ],
    instructions: ["Sauté curry paste in oil", "Add coconut milk and simmer", "Add protein and vegetables", "Serve over rice"]
  },
  {
    title: "Mexican Street Tacos",
    description: "Authentic corn tortilla tacos with cilantro and onion",
    image_url: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800",
    cuisines: ["Mexican"],
    diets: ["Gluten-Free"],
    prep_time: 15,
    cook_time: 20,
    servings: 4,
    total_cost: 10.00,
    ingredients: [
      { name: "Corn tortillas", amount: 12, unit: "small", estimated_price: 2.50 },
      { name: "Skirt steak", amount: 1, unit: "lb", estimated_price: 8.00 },
      { name: "Cilantro", amount: 1, unit: "bunch", estimated_price: 1.00 },
      { name: "White onion", amount: 1, unit: "medium", estimated_price: 0.50 }
    ],
    instructions: ["Season and grill meat", "Warm tortillas", "Dice onion and chop cilantro", "Assemble tacos with toppings"]
  },
  {
    title: "Buddha Bowl",
    description: "Nutritious grain bowl with roasted vegetables and tahini dressing",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    cuisines: ["Mediterranean"],
    diets: ["Vegan", "Vegetarian", "Gluten-Free"],
    prep_time: 20,
    cook_time: 30,
    servings: 2,
    total_cost: 8.00,
    ingredients: [
      { name: "Quinoa", amount: 1, unit: "cup", estimated_price: 2.00 },
      { name: "Chickpeas", amount: 1, unit: "can", estimated_price: 1.50 },
      { name: "Sweet potato", amount: 1, unit: "large", estimated_price: 1.50 },
      { name: "Kale", amount: 2, unit: "cups", estimated_price: 2.00 },
      { name: "Tahini", amount: 2, unit: "tbsp", estimated_price: 1.00 }
    ],
    instructions: ["Cook quinoa", "Roast chickpeas and sweet potato", "Massage kale with olive oil", "Assemble bowls and drizzle with tahini"]
  },
  {
    title: "Chicken Tikka Masala",
    description: "Tender chicken in a creamy, spiced tomato sauce",
    image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
    cuisines: ["Indian"],
    diets: ["Gluten-Free"],
    prep_time: 30,
    cook_time: 40,
    servings: 4,
    total_cost: 14.00,
    ingredients: [
      { name: "Chicken thighs", amount: 1.5, unit: "lb", estimated_price: 6.00 },
      { name: "Greek yogurt", amount: 1, unit: "cup", estimated_price: 2.00 },
      { name: "Tomato sauce", amount: 2, unit: "cups", estimated_price: 2.50 },
      { name: "Heavy cream", amount: 0.5, unit: "cup", estimated_price: 2.00 },
      { name: "Garam masala", amount: 2, unit: "tbsp", estimated_price: 1.50 }
    ],
    instructions: ["Marinate chicken in yogurt and spices", "Grill or bake chicken", "Simmer tomato sauce with spices", "Add cream and chicken, serve with rice"]
  },
  {
    title: "Japanese Teriyaki Salmon",
    description: "Glazed salmon with homemade teriyaki sauce",
    image_url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
    cuisines: ["Japanese"],
    diets: ["Pescatarian", "Dairy-Free"],
    prep_time: 10,
    cook_time: 15,
    servings: 2,
    total_cost: 16.00,
    ingredients: [
      { name: "Salmon fillets", amount: 2, unit: "pieces", estimated_price: 12.00 },
      { name: "Soy sauce", amount: 0.25, unit: "cup", estimated_price: 1.00 },
      { name: "Mirin", amount: 2, unit: "tbsp", estimated_price: 1.50 },
      { name: "Brown sugar", amount: 2, unit: "tbsp", estimated_price: 0.50 },
      { name: "Ginger", amount: 1, unit: "inch", estimated_price: 1.00 }
    ],
    instructions: ["Mix teriyaki sauce ingredients", "Pan sear salmon", "Glaze with sauce while cooking", "Serve with steamed rice"]
  },
  {
    title: "Greek Chicken Souvlaki",
    description: "Grilled marinated chicken skewers with tzatziki sauce",
    image_url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800",
    cuisines: ["Greek", "Mediterranean"],
    diets: ["Gluten-Free"],
    prep_time: 20,
    cook_time: 15,
    servings: 4,
    total_cost: 13.00,
    ingredients: [
      { name: "Chicken breast", amount: 1.5, unit: "lb", estimated_price: 7.00 },
      { name: "Greek yogurt", amount: 1, unit: "cup", estimated_price: 2.00 },
      { name: "Cucumber", amount: 1, unit: "medium", estimated_price: 1.00 },
      { name: "Lemon", amount: 2, unit: "whole", estimated_price: 1.00 },
      { name: "Fresh oregano", amount: 2, unit: "tbsp", estimated_price: 2.00 }
    ],
    instructions: ["Marinate chicken in lemon, olive oil, and oregano", "Thread onto skewers", "Grill until cooked through", "Make tzatziki with yogurt and cucumber"]
  },
  {
    title: "Korean Bibimbap",
    description: "Colorful rice bowl with vegetables, beef, and gochujang",
    image_url: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800",
    cuisines: ["Korean"],
    diets: ["Dairy-Free"],
    prep_time: 30,
    cook_time: 20,
    servings: 4,
    total_cost: 14.00,
    ingredients: [
      { name: "Short grain rice", amount: 2, unit: "cups", estimated_price: 2.00 },
      { name: "Ground beef", amount: 0.5, unit: "lb", estimated_price: 4.00 },
      { name: "Spinach", amount: 4, unit: "cups", estimated_price: 2.50 },
      { name: "Carrots", amount: 2, unit: "medium", estimated_price: 1.00 },
      { name: "Gochujang", amount: 3, unit: "tbsp", estimated_price: 2.50 },
      { name: "Eggs", amount: 4, unit: "large", estimated_price: 2.00 }
    ],
    instructions: ["Cook rice and keep warm", "Prepare each vegetable separately", "Cook seasoned beef", "Assemble bowls and top with fried egg"]
  },
  {
    title: "Vietnamese Pho",
    description: "Aromatic beef noodle soup with fresh herbs",
    image_url: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800",
    cuisines: ["Vietnamese"],
    diets: ["Dairy-Free"],
    prep_time: 20,
    cook_time: 60,
    servings: 4,
    total_cost: 15.00,
    ingredients: [
      { name: "Rice noodles", amount: 8, unit: "oz", estimated_price: 3.00 },
      { name: "Beef broth", amount: 8, unit: "cups", estimated_price: 4.00 },
      { name: "Sirloin steak", amount: 0.5, unit: "lb", estimated_price: 5.00 },
      { name: "Bean sprouts", amount: 2, unit: "cups", estimated_price: 1.50 },
      { name: "Fresh basil", amount: 1, unit: "bunch", estimated_price: 1.50 }
    ],
    instructions: ["Simmer broth with star anise and cinnamon", "Cook rice noodles", "Slice beef paper thin", "Assemble and pour hot broth over"]
  },
  {
    title: "Classic American Burger",
    description: "Juicy beef burger with all the fixings",
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    cuisines: ["American"],
    diets: [],
    prep_time: 15,
    cook_time: 10,
    servings: 4,
    total_cost: 12.00,
    ingredients: [
      { name: "Ground beef 80/20", amount: 1.5, unit: "lb", estimated_price: 6.00 },
      { name: "Brioche buns", amount: 4, unit: "whole", estimated_price: 3.00 },
      { name: "Cheddar cheese", amount: 4, unit: "slices", estimated_price: 2.00 },
      { name: "Lettuce", amount: 4, unit: "leaves", estimated_price: 0.50 },
      { name: "Tomato", amount: 1, unit: "large", estimated_price: 0.50 }
    ],
    instructions: ["Form patties and season generously", "Grill to desired doneness", "Toast buns on grill", "Assemble with toppings"]
  },
  {
    title: "French Ratatouille",
    description: "Classic Provençal vegetable stew",
    image_url: "https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=800",
    cuisines: ["French"],
    diets: ["Vegan", "Vegetarian", "Gluten-Free"],
    prep_time: 30,
    cook_time: 45,
    servings: 6,
    total_cost: 10.00,
    ingredients: [
      { name: "Eggplant", amount: 1, unit: "large", estimated_price: 2.00 },
      { name: "Zucchini", amount: 2, unit: "medium", estimated_price: 2.00 },
      { name: "Bell peppers", amount: 2, unit: "medium", estimated_price: 2.50 },
      { name: "Tomatoes", amount: 4, unit: "medium", estimated_price: 2.50 },
      { name: "Fresh thyme", amount: 4, unit: "sprigs", estimated_price: 1.00 }
    ],
    instructions: ["Slice all vegetables uniformly", "Layer in baking dish", "Drizzle with olive oil and herbs", "Bake until tender"]
  },
  {
    title: "Spanish Paella",
    description: "Saffron-infused rice with seafood and chorizo",
    image_url: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800",
    cuisines: ["Spanish"],
    diets: ["Gluten-Free"],
    prep_time: 25,
    cook_time: 35,
    servings: 6,
    total_cost: 25.00,
    ingredients: [
      { name: "Bomba rice", amount: 2, unit: "cups", estimated_price: 5.00 },
      { name: "Shrimp", amount: 1, unit: "lb", estimated_price: 10.00 },
      { name: "Chorizo", amount: 6, unit: "oz", estimated_price: 4.00 },
      { name: "Saffron threads", amount: 1, unit: "pinch", estimated_price: 3.00 },
      { name: "Chicken broth", amount: 4, unit: "cups", estimated_price: 3.00 }
    ],
    instructions: ["Toast rice in pan with olive oil", "Add saffron-infused broth", "Arrange proteins on top", "Cook until socarrat forms"]
  },
  {
    title: "Middle Eastern Falafel",
    description: "Crispy chickpea fritters with tahini sauce",
    image_url: "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=800",
    cuisines: ["Middle Eastern"],
    diets: ["Vegan", "Vegetarian"],
    prep_time: 20,
    cook_time: 15,
    servings: 4,
    total_cost: 8.00,
    ingredients: [
      { name: "Dried chickpeas", amount: 1, unit: "lb", estimated_price: 2.00 },
      { name: "Fresh parsley", amount: 1, unit: "bunch", estimated_price: 1.50 },
      { name: "Cumin", amount: 2, unit: "tsp", estimated_price: 0.50 },
      { name: "Pita bread", amount: 4, unit: "rounds", estimated_price: 2.50 },
      { name: "Tahini", amount: 0.5, unit: "cup", estimated_price: 1.50 }
    ],
    instructions: ["Soak chickpeas overnight", "Blend with herbs and spices", "Form into patties", "Fry until golden brown"]
  },
  {
    title: "Chinese Kung Pao Chicken",
    description: "Spicy stir-fried chicken with peanuts",
    image_url: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800",
    cuisines: ["Chinese"],
    diets: ["Dairy-Free"],
    prep_time: 20,
    cook_time: 15,
    servings: 4,
    total_cost: 12.00,
    ingredients: [
      { name: "Chicken breast", amount: 1, unit: "lb", estimated_price: 5.00 },
      { name: "Roasted peanuts", amount: 0.5, unit: "cup", estimated_price: 2.00 },
      { name: "Dried red chilies", amount: 10, unit: "whole", estimated_price: 1.00 },
      { name: "Soy sauce", amount: 3, unit: "tbsp", estimated_price: 1.00 },
      { name: "Green onions", amount: 4, unit: "stalks", estimated_price: 1.00 },
      { name: "Rice vinegar", amount: 2, unit: "tbsp", estimated_price: 2.00 }
    ],
    instructions: ["Cube and marinate chicken", "Stir-fry chilies in wok", "Add chicken and cook through", "Toss with peanuts and sauce"]
  },
  {
    title: "Caribbean Jerk Chicken",
    description: "Spicy grilled chicken with island flavors",
    image_url: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800",
    cuisines: ["Caribbean"],
    diets: ["Gluten-Free", "Dairy-Free"],
    prep_time: 15,
    cook_time: 30,
    servings: 4,
    total_cost: 11.00,
    ingredients: [
      { name: "Chicken thighs", amount: 2, unit: "lb", estimated_price: 6.00 },
      { name: "Scotch bonnet pepper", amount: 2, unit: "whole", estimated_price: 1.00 },
      { name: "Allspice", amount: 1, unit: "tbsp", estimated_price: 1.00 },
      { name: "Fresh thyme", amount: 6, unit: "sprigs", estimated_price: 1.50 },
      { name: "Green onions", amount: 4, unit: "stalks", estimated_price: 1.50 }
    ],
    instructions: ["Blend jerk marinade ingredients", "Marinate chicken 4-24 hours", "Grill over medium heat", "Serve with rice and peas"]
  },
  {
    title: "Keto Cauliflower Fried Rice",
    description: "Low-carb twist on a takeout classic",
    image_url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
    cuisines: ["Chinese", "American"],
    diets: ["Keto", "Low-Carb", "Gluten-Free"],
    prep_time: 15,
    cook_time: 15,
    servings: 4,
    total_cost: 10.00,
    ingredients: [
      { name: "Cauliflower", amount: 1, unit: "large head", estimated_price: 3.00 },
      { name: "Eggs", amount: 3, unit: "large", estimated_price: 1.50 },
      { name: "Sesame oil", amount: 2, unit: "tbsp", estimated_price: 1.50 },
      { name: "Frozen peas and carrots", amount: 1, unit: "cup", estimated_price: 1.50 },
      { name: "Coconut aminos", amount: 3, unit: "tbsp", estimated_price: 2.50 }
    ],
    instructions: ["Rice the cauliflower in food processor", "Scramble eggs and set aside", "Stir-fry vegetables and cauliflower", "Add eggs and coconut aminos"]
  },
  {
    title: "Whole30 Sheet Pan Chicken",
    description: "Simple one-pan compliant dinner",
    image_url: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800",
    cuisines: ["American"],
    diets: ["Whole30", "Paleo", "Gluten-Free", "Dairy-Free"],
    prep_time: 10,
    cook_time: 35,
    servings: 4,
    total_cost: 14.00,
    ingredients: [
      { name: "Chicken thighs", amount: 2, unit: "lb", estimated_price: 6.00 },
      { name: "Brussels sprouts", amount: 1, unit: "lb", estimated_price: 3.00 },
      { name: "Sweet potatoes", amount: 2, unit: "medium", estimated_price: 2.00 },
      { name: "Ghee", amount: 3, unit: "tbsp", estimated_price: 2.00 },
      { name: "Fresh rosemary", amount: 3, unit: "sprigs", estimated_price: 1.00 }
    ],
    instructions: ["Preheat oven to 425°F", "Toss vegetables with ghee", "Season chicken and arrange on pan", "Roast until chicken reaches 165°F"]
  },
  {
    title: "Vegetarian Pad Thai",
    description: "Classic Thai noodles with tofu and peanuts",
    image_url: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800",
    cuisines: ["Thai"],
    diets: ["Vegetarian", "Vegan"],
    prep_time: 20,
    cook_time: 15,
    servings: 4,
    total_cost: 11.00,
    ingredients: [
      { name: "Rice noodles", amount: 8, unit: "oz", estimated_price: 2.50 },
      { name: "Extra firm tofu", amount: 14, unit: "oz", estimated_price: 3.00 },
      { name: "Bean sprouts", amount: 2, unit: "cups", estimated_price: 1.50 },
      { name: "Peanuts", amount: 0.5, unit: "cup", estimated_price: 2.00 },
      { name: "Tamarind paste", amount: 3, unit: "tbsp", estimated_price: 2.00 }
    ],
    instructions: ["Soak noodles in warm water", "Press and cube tofu", "Make tamarind sauce", "Stir-fry and toss together"]
  },
  {
    title: "Italian Margherita Pizza",
    description: "Classic Neapolitan pizza with fresh mozzarella and basil",
    image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
    cuisines: ["Italian"],
    diets: ["Vegetarian"],
    prep_time: 30,
    cook_time: 12,
    servings: 4,
    total_cost: 9.00,
    ingredients: [
      { name: "Pizza dough", amount: 1, unit: "lb", estimated_price: 2.50 },
      { name: "San Marzano tomatoes", amount: 1, unit: "can", estimated_price: 2.50 },
      { name: "Fresh mozzarella", amount: 8, unit: "oz", estimated_price: 3.00 },
      { name: "Fresh basil", amount: 1, unit: "bunch", estimated_price: 1.00 }
    ],
    instructions: ["Stretch dough to 12-inch round", "Spread crushed tomatoes", "Top with torn mozzarella", "Bake at 500°F, add basil after"]
  },
  {
    title: "Moroccan Lamb Tagine",
    description: "Slow-cooked lamb with apricots and almonds",
    image_url: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=800",
    cuisines: ["Middle Eastern", "Mediterranean"],
    diets: ["Gluten-Free", "Dairy-Free"],
    prep_time: 25,
    cook_time: 120,
    servings: 6,
    total_cost: 22.00,
    ingredients: [
      { name: "Lamb shoulder", amount: 2, unit: "lb", estimated_price: 14.00 },
      { name: "Dried apricots", amount: 1, unit: "cup", estimated_price: 3.00 },
      { name: "Slivered almonds", amount: 0.5, unit: "cup", estimated_price: 2.50 },
      { name: "Ras el hanout", amount: 2, unit: "tbsp", estimated_price: 1.50 },
      { name: "Chicken broth", amount: 2, unit: "cups", estimated_price: 1.00 }
    ],
    instructions: ["Brown lamb in batches", "Sauté onions with spices", "Add broth and apricots", "Simmer 2 hours until tender"]
  },
  {
    title: "Shrimp Scampi",
    description: "Garlic butter shrimp over linguine",
    image_url: "https://images.unsplash.com/photo-1633504581786-316c8002b1b9?w=800",
    cuisines: ["Italian", "American"],
    diets: ["Pescatarian"],
    prep_time: 10,
    cook_time: 15,
    servings: 4,
    total_cost: 18.00,
    ingredients: [
      { name: "Large shrimp", amount: 1.5, unit: "lb", estimated_price: 12.00 },
      { name: "Linguine", amount: 1, unit: "lb", estimated_price: 2.00 },
      { name: "Butter", amount: 4, unit: "tbsp", estimated_price: 1.50 },
      { name: "Garlic", amount: 6, unit: "cloves", estimated_price: 0.50 },
      { name: "White wine", amount: 0.5, unit: "cup", estimated_price: 2.00 }
    ],
    instructions: ["Cook pasta al dente", "Sauté garlic in butter", "Add shrimp and wine", "Toss with pasta and parsley"]
  },
  {
    title: "Brazilian Feijoada",
    description: "Hearty black bean and pork stew",
    image_url: "https://images.unsplash.com/photo-1547496502-affa22d38842?w=800",
    cuisines: ["Brazilian"],
    diets: ["Gluten-Free", "Dairy-Free"],
    prep_time: 30,
    cook_time: 180,
    servings: 8,
    total_cost: 20.00,
    ingredients: [
      { name: "Black beans", amount: 1, unit: "lb", estimated_price: 2.00 },
      { name: "Pork shoulder", amount: 1, unit: "lb", estimated_price: 5.00 },
      { name: "Smoked sausage", amount: 1, unit: "lb", estimated_price: 5.00 },
      { name: "Bacon", amount: 8, unit: "oz", estimated_price: 4.00 },
      { name: "Bay leaves", amount: 4, unit: "whole", estimated_price: 0.50 },
      { name: "Orange", amount: 1, unit: "whole", estimated_price: 0.50 }
    ],
    instructions: ["Soak beans overnight", "Brown all meats", "Simmer with beans and aromatics", "Serve with rice and orange slices"]
  },
  {
    title: "Caprese Salad",
    description: "Simple Italian salad with tomatoes and fresh mozzarella",
    image_url: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800",
    cuisines: ["Italian"],
    diets: ["Vegetarian", "Gluten-Free", "Keto", "Low-Carb"],
    prep_time: 10,
    cook_time: 0,
    servings: 4,
    total_cost: 10.00,
    ingredients: [
      { name: "Heirloom tomatoes", amount: 3, unit: "large", estimated_price: 4.00 },
      { name: "Fresh mozzarella", amount: 8, unit: "oz", estimated_price: 4.00 },
      { name: "Fresh basil", amount: 1, unit: "bunch", estimated_price: 1.50 },
      { name: "Balsamic glaze", amount: 2, unit: "tbsp", estimated_price: 0.50 }
    ],
    instructions: ["Slice tomatoes and mozzarella", "Arrange alternating on plate", "Tuck basil leaves between", "Drizzle with olive oil and balsamic"]
  },
  {
    title: "Ethiopian Doro Wat",
    description: "Spiced chicken stew with berbere and hard-boiled eggs",
    image_url: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800",
    cuisines: ["Ethiopian"],
    diets: ["Gluten-Free", "Dairy-Free"],
    prep_time: 30,
    cook_time: 90,
    servings: 6,
    total_cost: 16.00,
    ingredients: [
      { name: "Chicken legs", amount: 3, unit: "lb", estimated_price: 7.00 },
      { name: "Berbere spice", amount: 3, unit: "tbsp", estimated_price: 3.00 },
      { name: "Red onions", amount: 4, unit: "large", estimated_price: 2.00 },
      { name: "Eggs", amount: 6, unit: "large", estimated_price: 2.00 },
      { name: "Niter kibbeh", amount: 4, unit: "tbsp", estimated_price: 2.00 }
    ],
    instructions: ["Caramelize onions slowly", "Add berbere and tomato paste", "Braise chicken until tender", "Add hard-boiled eggs before serving"]
  },
  {
    title: "German Schnitzel",
    description: "Crispy breaded pork cutlets",
    image_url: "https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=800",
    cuisines: ["German"],
    diets: ["Dairy-Free"],
    prep_time: 20,
    cook_time: 10,
    servings: 4,
    total_cost: 14.00,
    ingredients: [
      { name: "Pork loin cutlets", amount: 1.5, unit: "lb", estimated_price: 7.00 },
      { name: "Breadcrumbs", amount: 2, unit: "cups", estimated_price: 2.00 },
      { name: "Eggs", amount: 2, unit: "large", estimated_price: 1.00 },
      { name: "Flour", amount: 1, unit: "cup", estimated_price: 0.50 },
      { name: "Lemon", amount: 2, unit: "whole", estimated_price: 1.00 },
      { name: "Vegetable oil", amount: 1, unit: "cup", estimated_price: 2.50 }
    ],
    instructions: ["Pound cutlets thin", "Dredge in flour, egg, breadcrumbs", "Fry in shallow oil until golden", "Serve with lemon wedges"]
  }
];

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ cuisines: [], diets: [], maxCost: null, maxTime: null });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      return profiles[0];
    }
  });

  // Fetch recipes
  const {
    data: recipes = [],
    isLoading: recipesLoading,
    refetch: refetchRecipes,
    isRefetching
  } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list('-created_date', 50)
  });

  // Fetch saved recipes
  const { data: savedRecipes = [] } = useQuery({
    queryKey: ['savedRecipes'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.SavedRecipe.filter({ user_id: user.id });
    }
  });

  // Fetch budget entries
  const { data: budgetEntries = [] } = useQuery({
    queryKey: ['budgetEntries'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.BudgetEntry.filter({ user_id: user.id });
    }
  });

  // Seed sample recipes if none exist
  const seedRecipesMutation = useMutation({
    mutationFn: async () => {
      for (const recipe of sampleRecipes) {
        await base44.entities.Recipe.create(recipe);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({
        title: "Sample Recipes Added!",
        description: "We've added some delicious recipes to get you started"
      });
    }
  });

  // Save recipe mutation
  const saveRecipeMutation = useMutation({
    mutationFn: async (recipe) => {
      const user = await base44.auth.me();
      const existing = savedRecipes.find(sr => sr.recipe_id === recipe.id);
      if (existing) {
        return base44.entities.SavedRecipe.delete(existing.id);
      } else {
        return base44.entities.SavedRecipe.create({
          user_id: user.id,
          recipe_id: recipe.id,
          saved_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedRecipes'] });
    }
  });

  useEffect(() => {
    if (profileData && !profileData.onboarding_completed) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [profileData, navigate]);
  
  useEffect(() => {
    if (!profileLoading && profileData === null) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [profileLoading, profileData, navigate]);

  // Seed recipes if empty
  useEffect(() => {
    if (!recipesLoading && recipes.length === 0 && !seedRecipesMutation.isPending) {
      seedRecipesMutation.mutate();
    }
  }, [recipesLoading, recipes.length]);

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refetchRecipes();
      toast({
        title: "Recipes Refreshed!",
        description: "Showing latest recipes"
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Refresh Failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Filter recipes based on search and filters
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = !searchQuery || 
      recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisines?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCuisine = filters.cuisines.length === 0 ||
      recipe.cuisines?.some(c => filters.cuisines.includes(c));
    
    const matchesDiet = filters.diets.length === 0 ||
      recipe.diets?.some(d => filters.diets.includes(d));
    
    const matchesCost = !filters.maxCost || 
      (recipe.total_cost || 0) <= filters.maxCost;
    
    const matchesTime = !filters.maxTime || 
      ((recipe.prep_time || 0) + (recipe.cook_time || 0)) <= filters.maxTime;

    return matchesSearch && matchesCuisine && matchesDiet && matchesCost && matchesTime;
  });

  // Personalized recipes (matching user preferences)
  const personalizedRecipes = filteredRecipes.filter(recipe => {
    if (!profileData?.cuisines?.length && !profileData?.dietary_restrictions?.length) return true;
    
    const matchesCuisine = !profileData.cuisines?.length || 
      recipe.cuisines?.some(c => profileData.cuisines.includes(c));
    const matchesDiet = !profileData.dietary_restrictions?.length ||
      profileData.dietary_restrictions.includes('No Restrictions') ||
      recipe.diets?.some(d => profileData.dietary_restrictions.includes(d));
    return matchesCuisine || matchesDiet;
  });

  // Explore recipes (outside user preferences for discovery)
  const exploreRecipes = filteredRecipes.filter(recipe => {
    if (!profileData?.cuisines?.length) return false;
    return !recipe.cuisines?.some(c => profileData.cuisines?.includes(c));
  });

  // Calculate budget stats
  const calculateBudgetStats = () => {
    if (!profileData) return { spent: 0, budget: 150, daysRemaining: 7 };
    
    const now = new Date();
    let periodStart;
    let periodDays;
    
    if (profileData.budget_type === 'weekly') {
      periodDays = 7;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - now.getDay());
    } else if (profileData.budget_type === 'monthly') {
      periodDays = 30;
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      periodDays = profileData.budget_days || 7;
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
      budget: profileData.budget_amount || 150,
      daysRemaining,
      budgetType: profileData.budget_type || 'weekly'
    };
  };

  const budgetStats = calculateBudgetStats();
  const activeFiltersCount = filters.cuisines.length + filters.diets.length + (filters.maxCost ? 1 : 0) + (filters.maxTime ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-500 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl">🥕</div>
          <div className="absolute top-20 right-20 text-5xl">🥬</div>
          <div className="absolute bottom-10 left-1/4 text-4xl">🍅</div>
          <div className="absolute bottom-20 right-1/3 text-5xl">🌽</div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {profileData?.full_name ? `Hey ${profileData.full_name.split(' ')[0]}!` : 'Welcome!'} 👋
            </h1>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Discover delicious recipes that fit your budget and dietary preferences
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes or cuisines..."
                className="w-full pl-12 pr-4 py-6 text-lg rounded-full border-0 shadow-xl text-gray-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 -mt-8 mb-8 relative z-10">
          <Link to={createPageUrl('AddRecipe')}>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 cursor-pointer"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Add Recipe</h3>
              <p className="text-sm text-gray-500">Import from URL</p>
            </motion.div>
          </Link>
          
          <Link to={createPageUrl('SavedRecipes')}>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 cursor-pointer"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-800">My Recipes</h3>
              <p className="text-sm text-gray-500">{savedRecipes.length} saved</p>
            </motion.div>
          </Link>

          <Link to={createPageUrl('MealPlanner')}>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 cursor-pointer"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Meal Plan</h3>
              <p className="text-sm text-gray-500">Plan your week</p>
            </motion.div>
          </Link>
          
          <Link to={createPageUrl('Budget')}>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 cursor-pointer"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Budget</h3>
              <p className="text-sm text-gray-500">${budgetStats.spent.toFixed(0)} spent</p>
            </motion.div>
          </Link>
          
          <Link to={createPageUrl('Profile')}>
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 cursor-pointer"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                <ChefHat className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Profile</h3>
              <p className="text-sm text-gray-500">Edit preferences</p>
            </motion.div>
          </Link>
        </div>

        {/* Budget Tracker */}
        <div className="mb-8">
          <BudgetTracker
            budget={budgetStats.budget}
            spent={budgetStats.spent}
            budgetType={budgetStats.budgetType}
            daysRemaining={budgetStats.daysRemaining}
          />
        </div>

        {/* Filters Toggle */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-full ${showFilters ? 'bg-green-50 border-green-300' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefetching || seedRecipesMutation.isPending}
            className="rounded-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={() => setFilters({ cuisines: [], diets: [], maxCost: null, maxTime: null })}
              className="text-gray-500"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <RecipeFilters
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters({ cuisines: [], diets: [], maxCost: null, maxTime: null })}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* For You Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-800">For You</h2>
            {profileData?.cuisines?.length > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                Based on your {profileData.cuisines.slice(0, 2).join(', ')} preferences
              </span>
            )}
          </div>
          
          {recipesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-3xl h-80 animate-pulse" />
              ))}
            </div>
          ) : personalizedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {personalizedRecipes.slice(0, 6).map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      householdSize={profileData?.household_size || 4}
                      pantryItems={profileData?.pantry_items}
                      isSaved={savedRecipes.some(sr => sr.recipe_id === recipe.id)}
                      onSave={() => saveRecipeMutation.mutate(recipe)}
                      onClick={() => navigate(createPageUrl('RecipeDetails') + `?id=${recipe.id}`)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No matching recipes</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or add new recipes</p>
              <Link to={createPageUrl('AddRecipe')}>
                <Button className="rounded-full bg-green-500 hover:bg-green-600">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Recipe
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Explore New Recipes Section */}
        {exploreRecipes.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Compass className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800">Explore New Cuisines</h2>
              <span className="text-sm text-gray-500 ml-2">
                Try something different!
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exploreRecipes.slice(0, 3).map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <RecipeCard
                    recipe={recipe}
                    householdSize={profileData?.household_size || 4}
                    pantryItems={profileData?.pantry_items}
                    isSaved={savedRecipes.some(sr => sr.recipe_id === recipe.id)}
                    onSave={() => saveRecipeMutation.mutate(recipe)}
                    onClick={() => navigate(createPageUrl('RecipeDetails') + `?id=${recipe.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* All Recipes */}
        {filteredRecipes.length > 6 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <ChefHat className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">All Recipes</h2>
              <span className="text-sm text-gray-500 ml-2">
                {filteredRecipes.length} recipes
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.slice(6).map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <RecipeCard
                    recipe={recipe}
                    householdSize={profileData?.household_size || 4}
                    pantryItems={profileData?.pantry_items}
                    isSaved={savedRecipes.some(sr => sr.recipe_id === recipe.id)}
                    onSave={() => saveRecipeMutation.mutate(recipe)}
                    onClick={() => navigate(createPageUrl('RecipeDetails') + `?id=${recipe.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { auth, entities } from '@/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Sparkles, ChefHat, TrendingUp, BookOpen, Calendar, Compass, Filter, X, RefreshCw, UtensilsCrossed, Apple } from 'lucide-react';
import StoreSwitcher from '@/components/StoreSwitcher';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import RecipeCard from '@/components/recipes/RecipeCard';
import RecipeFilters from '@/components/recipes/RecipeFilters';
import { RecipeCardSkeletonGrid } from '@/components/recipes/RecipeSkeletons';
import BudgetTracker from '@/components/budget/BudgetTracker';
import { getPersonalizedRecipes } from '@/services/recipeDiscovery';

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
    instructions: [
      "Bring a large pot of salted water to a rolling boil over high heat. Add spaghetti and cook for 8-10 minutes until al dente, reserving 1 cup of pasta water before draining.",
      "While pasta cooks, cut pancetta into 1/4-inch cubes. Cook in a cold skillet over medium heat for 8-10 minutes, stirring occasionally, until fat renders and edges turn golden and crispy.",
      "In a mixing bowl, whisk together 4 egg yolks and 2 whole eggs with freshly grated Parmesan cheese and a generous amount of freshly cracked black pepper until smooth.",
      "Remove the skillet with pancetta from heat and let cool for 2 minutes. This prevents the eggs from scrambling when added.",
      "Add the hot drained pasta directly to the pancetta skillet. Toss vigorously to coat the noodles in the rendered fat.",
      "Pour the egg and cheese mixture over the pasta while tossing continuously. Add pasta water 2 tablespoons at a time until you achieve a silky, creamy sauce that coats each strand. Serve immediately with extra Parmesan."
    ]
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
    instructions: [
      "Open the coconut milk cans without shaking. Scoop out the thick cream from the top of one can and heat it in a wok or large skillet over medium-high heat for 2-3 minutes until it begins to separate and sizzle.",
      "Add the green curry paste to the coconut cream and fry for 1-2 minutes, stirring constantly, until very fragrant and the oil starts to separate from the paste.",
      "Slice chicken breast into thin 1/4-inch strips against the grain. Add to the wok and stir-fry for 3-4 minutes until the chicken is sealed and coated in the curry paste.",
      "Pour in the remaining coconut milk and bring to a gentle simmer. Cook for 8-10 minutes, allowing the flavors to meld and the sauce to slightly thicken.",
      "Add your vegetables (bamboo shoots, Thai eggplant, bell peppers, or snap peas) and simmer for 5-7 minutes until tender-crisp. Harder vegetables should go in first.",
      "Season with fish sauce (2 tbsp), palm sugar (1 tbsp), and torn Thai basil leaves. Taste and adjust seasoning. Serve over jasmine rice with lime wedges on the side."
    ]
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
    instructions: [
      "Remove skirt steak from refrigerator 30 minutes before cooking. Season generously on both sides with salt, pepper, cumin, and a squeeze of lime juice.",
      "Heat a cast iron skillet or grill to high heat (450-500°F). The cooking surface should be smoking hot. Sear the steak for 3-4 minutes per side for medium-rare, depending on thickness.",
      "Transfer steak to a cutting board and tent loosely with foil. Let rest for 8-10 minutes to allow juices to redistribute throughout the meat.",
      "While the meat rests, finely dice the white onion and roughly chop fresh cilantro. Warm corn tortillas directly over a gas flame for 15-20 seconds per side, or in a dry skillet until pliable and slightly charred.",
      "Slice the rested steak against the grain into thin 1/4-inch strips. Cutting against the grain ensures tender bites.",
      "Assemble tacos by doubling up the warm tortillas, adding sliced carne asada, and topping generously with fresh onion and cilantro. Serve with lime wedges, salsa verde, and sliced radishes."
    ]
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
    instructions: [
      "Preheat oven to 425°F. Rinse 1 cup quinoa under cold water for 30 seconds to remove bitter saponins. Combine with 2 cups water in a saucepan, bring to a boil, then reduce to low and simmer covered for 15 minutes until fluffy.",
      "Cut sweet potato into 3/4-inch cubes. Drain and pat dry chickpeas with paper towels. Toss both separately with olive oil, salt, pepper, and smoked paprika. Spread on a baking sheet in a single layer.",
      "Roast sweet potatoes and chickpeas at 425°F for 25-30 minutes, flipping halfway through. Chickpeas should be crispy and golden, sweet potatoes tender with caramelized edges.",
      "Remove tough stems from kale and tear leaves into bite-sized pieces. Place in a large bowl with 1 tablespoon olive oil and a pinch of salt. Massage vigorously with your hands for 2-3 minutes until the kale softens and turns bright green.",
      "Prepare the tahini dressing by whisking together 3 tablespoons tahini, 2 tablespoons lemon juice, 1 minced garlic clove, and water until smooth and pourable (about the consistency of heavy cream).",
      "Assemble bowls by arranging quinoa, massaged kale, roasted sweet potatoes, and crispy chickpeas in sections. Drizzle generously with tahini dressing and garnish with sesame seeds, microgreens, or sliced avocado."
    ]
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
    instructions: [
      "Cut chicken thighs into 2-inch pieces. In a bowl, combine yogurt, 1 tbsp garam masala, 1 tsp turmeric, 1 tsp cumin, 2 minced garlic cloves, and salt. Add chicken and marinate for at least 2 hours, or overnight for best results.",
      "Preheat oven to 450°F or heat a grill to high. Thread marinated chicken onto skewers and cook for 12-15 minutes, turning once, until charred spots appear and internal temperature reaches 165°F.",
      "For the masala sauce, heat 2 tablespoons ghee or butter in a large skillet over medium heat. Sauté 1 diced onion for 8-10 minutes until deeply golden and caramelized.",
      "Add 4 minced garlic cloves and 1 tablespoon grated ginger to the onions. Cook for 1 minute until fragrant. Stir in 1 tablespoon garam masala, 1 teaspoon cumin, 1 teaspoon paprika, and 1/2 teaspoon cayenne. Toast spices for 30 seconds.",
      "Pour in crushed tomatoes and simmer for 15-20 minutes, stirring occasionally, until the sauce thickens and oil begins to separate around the edges. This indicates properly cooked spices.",
      "Reduce heat to low and stir in heavy cream. Add the grilled chicken pieces and simmer for 5 minutes to let flavors meld. Adjust seasoning with salt and a pinch of sugar if needed. Garnish with fresh cilantro and serve with basmati rice and warm naan bread."
    ]
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
    instructions: [
      "Prepare the teriyaki sauce by combining 1/4 cup soy sauce, 2 tablespoons mirin, 2 tablespoons sake (or dry sherry), 2 tablespoons brown sugar, and 1 tablespoon freshly grated ginger in a small saucepan. Simmer over medium heat for 5 minutes until slightly thickened.",
      "Pat salmon fillets completely dry with paper towels. Season lightly with salt and pepper. Dry skin is essential for achieving a crispy texture.",
      "Heat a non-stick or well-seasoned cast iron skillet over medium-high heat with 1 tablespoon vegetable oil. Place salmon skin-side up and sear for 3-4 minutes until a golden crust forms on the bottom.",
      "Flip the salmon to skin-side down. Reduce heat to medium and cook for another 3-4 minutes. The skin should become very crispy. For a 1-inch thick fillet, aim for an internal temperature of 125°F for medium.",
      "During the last minute of cooking, brush the teriyaki sauce generously over the top and sides of the salmon. Allow the glaze to caramelize slightly, being careful not to burn the sugars.",
      "Transfer salmon to plates and drizzle with remaining teriyaki sauce. Garnish with toasted sesame seeds and thinly sliced green onions. Serve immediately with steamed short-grain rice and pickled ginger."
    ]
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
    instructions: [
      "Cut chicken breasts into 1.5-inch cubes. In a large bowl, whisk together 1/4 cup olive oil, juice of 2 lemons, 4 minced garlic cloves, 2 tablespoons fresh oregano, 1 teaspoon dried thyme, salt, and pepper. Add chicken and marinate for 2-4 hours.",
      "For the tzatziki, grate 1 cucumber and squeeze out excess moisture using a clean kitchen towel. Combine with 1 cup Greek yogurt, 2 minced garlic cloves, 1 tablespoon olive oil, 1 tablespoon fresh dill, and salt. Refrigerate for at least 30 minutes.",
      "If using wooden skewers, soak them in water for 30 minutes to prevent burning. Thread marinated chicken onto skewers, leaving small gaps between pieces for even cooking.",
      "Preheat grill to medium-high heat (400-450°F). Oil the grates well to prevent sticking. Grill skewers for 4-5 minutes per side, rotating to achieve even char marks on all sides.",
      "The chicken is done when the internal temperature reaches 165°F and the juices run clear. Transfer to a platter and let rest for 3-4 minutes before serving.",
      "Serve souvlaki skewers with warm pita bread, generous dollops of tzatziki, sliced red onion, tomato wedges, and a sprinkle of crumbled feta cheese. Drizzle with extra virgin olive oil and fresh lemon juice."
    ]
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
    instructions: [
      "Rinse short-grain rice until water runs clear. Cook with 2.5 cups water in a rice cooker or covered pot. Bring to boil, reduce to lowest heat, and steam for 15 minutes. Keep covered and warm.",
      "Prepare namul (seasoned vegetables) separately. Blanch spinach in boiling water for 30 seconds, shock in ice water, squeeze dry, and season with sesame oil, garlic, and salt. Julienne carrots and sauté in sesame oil for 2 minutes until tender-crisp.",
      "Season ground beef with 1 tablespoon soy sauce, 1 teaspoon sesame oil, 1 teaspoon sugar, and minced garlic. Cook in a hot skillet over high heat for 4-5 minutes, breaking into small pieces, until caramelized and cooked through.",
      "Prepare additional toppings: slice zucchini into half-moons and sauté until golden (3 minutes), rehydrate shiitake mushrooms and slice thinly, and prepare quick-pickled radish or kimchi.",
      "Fry eggs sunny-side up in a non-stick pan with a little oil over medium heat for 2-3 minutes. The whites should be set but yolks remain runny for mixing into the bowl.",
      "Assemble bowls by placing hot rice in the bottom, then arranging each vegetable, the seasoned beef, and any other toppings in separate sections around the bowl. Top with a fried egg and serve with gochujang sauce (mix 2 tbsp gochujang with 1 tbsp sesame oil and 1 tsp sugar). Mix everything together before eating."
    ]
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
    instructions: [
      "Char aromatics for the broth: Halve 1 large onion and 3-inch piece of ginger. Place cut-side down in a dry skillet over high heat for 8-10 minutes until deeply blackened. This creates the signature pho flavor.",
      "Toast whole spices in a dry pan over medium heat for 2-3 minutes until fragrant: 3 star anise, 6 whole cloves, 1 cinnamon stick, 1 tablespoon coriander seeds, and 1 teaspoon fennel seeds. Place in a spice bag or cheesecloth.",
      "Combine 8 cups beef broth with charred aromatics and toasted spice bag in a large pot. Simmer gently for 45 minutes to 1 hour. Avoid boiling, which makes the broth cloudy. Season with 2 tablespoons fish sauce and 1 tablespoon rock sugar.",
      "While broth simmers, soak rice noodles in room temperature water for 30 minutes until pliable. Slice sirloin against the grain into paper-thin pieces (freezing for 15 minutes makes this easier).",
      "Prepare the garnish plate: bean sprouts, Thai basil, fresh cilantro, thinly sliced jalapeños, lime wedges, and hoisin and sriracha sauces on the side.",
      "To serve, blanch soaked noodles in boiling water for 10-15 seconds until just tender. Divide among deep bowls, top with raw sliced beef (the hot broth will cook it), and ladle boiling hot strained broth over the top. Serve immediately with the garnish plate."
    ]
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
    instructions: [
      "Divide 1.5 lbs of 80/20 ground beef into 4 equal portions (6 oz each). Gently form into balls, then press into patties about 3/4-inch thick and slightly wider than your buns (they shrink when cooking). Make a shallow dimple in the center to prevent puffing.",
      "Season patties generously with salt and freshly ground black pepper on both sides just before cooking. Don't mix seasonings into the meat, as this creates a dense texture.",
      "Preheat a cast iron skillet or flat-top griddle over high heat until smoking hot (about 500°F). Add patties and press down firmly once with a spatula. Cook without moving for 3-4 minutes until a deep brown crust forms.",
      "Flip patties and immediately add a slice of cheddar cheese to each. Cook for another 2-3 minutes for medium (160°F internal). For smash-style burgers, press down firmly right after adding to the pan.",
      "During the last minute of cooking, split brioche buns and toast them cut-side down in the burger drippings or in a separate buttered pan until golden brown, about 1-2 minutes.",
      "Assemble burgers immediately: bottom bun, special sauce or mayo, lettuce, tomato slice, cheese-topped patty, pickles, sliced onion, and top bun. Let rest 1 minute to let juices settle before serving with crispy fries."
    ]
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
    instructions: [
      "Preheat oven to 375°F. Prepare the piperade base: dice 1 onion, 2 bell peppers, and 4 garlic cloves. Sauté in 3 tablespoons olive oil over medium heat for 15 minutes until very soft and slightly caramelized.",
      "Add 1 can crushed tomatoes to the piperade, season with salt, pepper, and 1 teaspoon herbes de Provence. Simmer for 10 minutes until thickened. Spread evenly in the bottom of a large baking dish.",
      "Using a mandoline or sharp knife, slice eggplant, zucchini, yellow squash, and tomatoes into uniform 1/8-inch thick rounds. Consistent thickness ensures even cooking.",
      "Arrange the vegetable slices in alternating pattern (eggplant, zucchini, yellow squash, tomato) standing upright in tight concentric circles over the piperade base, working from the outside in.",
      "Drizzle the arranged vegetables with 3 tablespoons olive oil. Season with salt, pepper, and scatter fresh thyme leaves over the top. Cover tightly with parchment paper cut to fit directly on the vegetables.",
      "Bake covered for 40 minutes, then remove parchment and bake uncovered for 20 more minutes until vegetables are tender and edges are slightly caramelized. Let rest 10 minutes before serving with crusty bread."
    ]
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
    instructions: [
      "Bloom saffron by steeping a generous pinch (about 1/4 teaspoon) in 4 cups warm chicken broth for at least 15 minutes. The broth should turn a deep golden color. Keep warm.",
      "Heat a 15-inch paella pan or wide shallow skillet over medium-high heat with 3 tablespoons olive oil. Sear seasoned shrimp for 1 minute per side until pink. Remove and set aside. Sear sliced chorizo until crispy, about 3 minutes. Remove and set aside.",
      "In the same pan, sauté diced onion and bell pepper for 5 minutes. Add 4 minced garlic cloves and 1 teaspoon smoked paprika, cooking for 1 minute until fragrant.",
      "Add 2 cups Bomba or Calasparra rice (do not substitute with long-grain). Toast the rice in the oil for 2-3 minutes, stirring to coat each grain. This step is crucial for proper texture.",
      "Pour in the saffron-infused broth all at once. Stir once to distribute rice evenly, then DO NOT STIR AGAIN. Arrange chorizo and any other proteins on top. Simmer over medium heat for 18-20 minutes.",
      "In the final 5 minutes, increase heat to medium-high to develop the socarrat (the prized crispy bottom layer). You'll hear crackling sounds. Add reserved shrimp to warm through. Remove from heat, cover with foil, and rest for 5 minutes before serving with lemon wedges."
    ]
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
    instructions: [
      "Soak 1 lb dried chickpeas in cold water for 24 hours, changing water once. They should double in size and be easy to crush between your fingers. Never use canned chickpeas - they're too wet and will fall apart when frying.",
      "Drain chickpeas thoroughly and pat dry. In a food processor, pulse chickpeas with 1 cup fresh parsley, 1/2 cup fresh cilantro, 1 small onion, 5 garlic cloves, 1 teaspoon each of cumin and coriander, 1/4 teaspoon cayenne, salt, and pepper. Process until finely ground but not a paste.",
      "Transfer mixture to a bowl and add 2 tablespoons flour and 1/2 teaspoon baking powder. Mix well. Refrigerate for at least 1 hour (or overnight) to firm up. This rest is essential for falafel that hold together.",
      "Using wet hands or a falafel scoop, form mixture into 1.5-inch balls or slightly flattened patties. They should be compact but not densely packed.",
      "Heat 2-3 inches of vegetable oil in a deep pot to 350°F. Fry falafel in batches of 4-5 for 3-4 minutes, turning occasionally, until deep golden brown and cooked through. Drain on paper towels.",
      "Make tahini sauce by whisking 1/2 cup tahini with 1/4 cup lemon juice, 2 minced garlic cloves, and water until smooth. Serve falafel in warm pita with tahini, pickled turnips, cucumber, tomato, and a drizzle of hot sauce."
    ]
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
    instructions: [
      "Cut chicken breast into 3/4-inch cubes. Marinate with 1 tablespoon soy sauce, 1 tablespoon Shaoxing wine, and 1 teaspoon cornstarch for 15-20 minutes at room temperature.",
      "Prepare the Kung Pao sauce: whisk together 2 tablespoons soy sauce, 1 tablespoon Chinese black vinegar (or balsamic), 1 tablespoon Shaoxing wine, 2 teaspoons sugar, 1 teaspoon sesame oil, and 1 teaspoon cornstarch with 2 tablespoons water.",
      "Heat a wok over high heat until smoking. Add 2 tablespoons vegetable oil and swirl to coat. Add 10-15 dried red chilies and 1 tablespoon Sichuan peppercorns. Stir-fry for 30 seconds until chilies darken (don't burn them).",
      "Push aromatics aside and add marinated chicken in a single layer. Let sear undisturbed for 1 minute, then stir-fry for 2-3 minutes until chicken is 80% cooked and slightly caramelized.",
      "Add 3 minced garlic cloves and 1 tablespoon minced ginger. Stir-fry for 30 seconds until fragrant. Add diced celery and stir-fry for 1 minute.",
      "Give the sauce a stir (cornstarch settles) and pour into the wok. Toss everything together until the sauce thickens and coats the chicken, about 1 minute. Add roasted peanuts and sliced green onions. Toss once more and serve immediately over steamed rice."
    ]
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
    instructions: [
      "Make the jerk marinade: In a blender, combine 4 green onions, 2 scotch bonnet peppers (seeded for less heat), 6 garlic cloves, 2 tablespoons fresh thyme leaves, 1 tablespoon ground allspice, 1 teaspoon cinnamon, 1/2 teaspoon nutmeg, juice of 2 limes, 3 tablespoons soy sauce, 2 tablespoons vegetable oil, and 1 tablespoon brown sugar. Blend until smooth.",
      "Score chicken thighs with deep diagonal cuts about 1 inch apart, cutting down to the bone. This allows the marinade to penetrate deeply.",
      "Coat chicken thoroughly with jerk marinade, working it into the cuts. Place in a container or zip-lock bag and refrigerate for at least 4 hours, preferably 24 hours for maximum flavor.",
      "Remove chicken from refrigerator 30 minutes before cooking. Set up grill for indirect heat: one side high heat (450°F), one side low heat or off.",
      "Sear chicken skin-side down over high heat for 4-5 minutes until charred grill marks form. Flip and sear 3-4 minutes on the other side. Move to indirect heat, close lid, and cook for 20-25 minutes until internal temperature reaches 175°F.",
      "Rest chicken for 5-10 minutes before serving. Traditionally served with rice and peas (kidney beans cooked with coconut milk), fried plantains, and festival bread. Drizzle with extra jerk sauce if desired."
    ]
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
    instructions: [
      "Cut cauliflower into florets and pulse in a food processor in batches until it resembles rice grains. Don't over-process or it becomes mushy. You should get about 6 cups of cauliflower rice.",
      "Spread cauliflower rice on a clean kitchen towel and squeeze out as much moisture as possible. Dry cauliflower is essential for achieving fried rice texture rather than steamed mush.",
      "Heat a large wok or skillet over high heat until smoking. Add 1 tablespoon sesame oil, then pour in 3 beaten eggs. Scramble quickly for 30-45 seconds until just set, breaking into small pieces. Remove and set aside.",
      "Add another tablespoon of oil to the hot wok. Add 4 minced garlic cloves and 1 tablespoon grated ginger. Stir-fry for 15 seconds until fragrant.",
      "Add the dry cauliflower rice to the wok. Spread in an even layer and let it sit for 1-2 minutes to get some char, then stir-fry for 3-4 minutes total until slightly golden and tender but not soft.",
      "Add defrosted peas and diced carrots, stir-fry for 1 minute. Add scrambled eggs back in. Season with 3 tablespoons coconut aminos, 1 teaspoon fish sauce (optional), and white pepper. Finish with sliced green onions and an extra drizzle of sesame oil. Serve immediately."
    ]
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
    instructions: [
      "Preheat oven to 425°F. Position rack in the upper third for maximum browning. Line a large rimmed sheet pan with parchment paper for easy cleanup.",
      "Prepare vegetables: Cut Brussels sprouts in half lengthwise through the core. Cut sweet potatoes into 3/4-inch cubes (uniform size ensures even cooking). Toss both with 2 tablespoons melted ghee, salt, pepper, and 1/2 teaspoon garlic powder.",
      "Pat chicken thighs completely dry with paper towels. Season generously on both sides with salt, pepper, 1 teaspoon smoked paprika, 1/2 teaspoon garlic powder, and fresh rosemary leaves stripped from stems.",
      "Arrange vegetables in a single layer on the sheet pan, leaving space in the center. Place seasoned chicken thighs skin-side up in the center, making sure they don't overlap. Drizzle chicken with remaining 1 tablespoon ghee.",
      "Roast for 35-40 minutes without flipping until chicken skin is golden and crispy, internal temperature reaches 175°F, and vegetables are caramelized on the edges. Brussels sprouts should be charred in spots.",
      "For extra crispy skin, broil for 2-3 minutes at the end, watching carefully to prevent burning. Let rest for 5 minutes before serving. The rendered chicken fat will have flavored the vegetables beautifully."
    ]
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
    instructions: [
      "Soak rice noodles in room temperature water for 30-45 minutes until pliable but still firm. They'll finish cooking in the wok. Drain and set aside.",
      "Press tofu for 15 minutes between paper towels with a heavy object to remove moisture. Cut into 3/4-inch cubes. Prepare the pad thai sauce: whisk together 3 tablespoons tamarind paste, 2 tablespoons coconut aminos (or soy sauce), 1 tablespoon maple syrup, and 1 tablespoon rice vinegar.",
      "Heat a wok over high heat. Add 2 tablespoons vegetable oil and fry tofu cubes for 5-6 minutes, turning occasionally, until golden and crispy on all sides. Remove and set aside.",
      "Add another tablespoon of oil to the wok. Crack in 2 eggs (if not vegan) and scramble quickly. Push to the side and add 3 minced garlic cloves and 2 minced shallots. Cook 30 seconds.",
      "Add drained noodles and the pad thai sauce. Toss continuously with tongs for 2-3 minutes until noodles are coated and just tender. Add splashes of water if noodles stick.",
      "Add crispy tofu, bean sprouts, and half the chopped peanuts. Toss for 30 seconds more. Serve immediately topped with remaining peanuts, lime wedges, extra bean sprouts, sliced green onions, and fresh cilantro. Add chili flakes for heat."
    ]
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
    instructions: [
      "Make the sauce: Hand-crush San Marzano tomatoes in a bowl, leaving some texture. Season with 1/2 teaspoon salt, a pinch of sugar, and 1 tablespoon olive oil. Don't cook it - raw sauce is traditional for Neapolitan pizza.",
      "Preheat oven to the highest setting (500-550°F) with a pizza stone or inverted baking sheet on the lowest rack for at least 45 minutes. The cooking surface must be extremely hot.",
      "Bring room-temperature dough to a floured surface. Using your fingertips, press from the center outward, leaving a 1-inch border for the cornice (crust). Gently stretch by draping over your knuckles, rotating and letting gravity help stretch to 10-12 inches. Don't use a rolling pin.",
      "Transfer stretched dough to a floured pizza peel or parchment paper. Spread a thin layer of sauce (about 1/3 cup), leaving the border clear. Less is more - too much sauce makes the center soggy.",
      "Tear fresh mozzarella into 1-inch pieces and distribute evenly over the sauce. Drizzle lightly with olive oil. Slide pizza onto the preheated stone.",
      "Bake for 8-12 minutes until the crust is puffed and charred in spots, and cheese is bubbling with some golden spots. Remove from oven and immediately top with fresh basil leaves, a drizzle of extra virgin olive oil, and optionally a sprinkle of sea salt flakes."
    ]
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
    instructions: [
      "Cut lamb shoulder into 2-inch chunks, trimming excess fat. Season generously with salt, pepper, and 1 tablespoon ras el hanout. Let sit at room temperature for 30 minutes.",
      "Heat 2 tablespoons olive oil in a tagine or Dutch oven over medium-high heat. Brown lamb in batches, getting deep color on all sides, about 4-5 minutes per batch. Don't crowd the pot. Transfer to a plate.",
      "Reduce heat to medium. Add 2 sliced onions and cook for 10 minutes until soft and golden. Add 4 minced garlic cloves, 1 tablespoon grated ginger, 1 tablespoon ras el hanout, 1 teaspoon cinnamon, 1/2 teaspoon turmeric, and a pinch of saffron. Cook 1-2 minutes until fragrant.",
      "Return lamb and any juices to the pot. Add 2 cups chicken broth, 1 can diced tomatoes, 1 tablespoon honey, and 1 preserved lemon (quartered) or zest of 1 lemon. Bring to a simmer.",
      "Cover and cook in a 325°F oven (or maintain a very low simmer on stovetop) for 1.5 hours. Add dried apricots and continue cooking for another 30 minutes until lamb is fall-apart tender.",
      "Toast slivered almonds in a dry pan until golden. Taste tagine and adjust seasoning with salt, honey, or lemon juice as needed. Garnish with toasted almonds, fresh cilantro, and sesame seeds. Serve with fluffy couscous or crusty bread to soak up the sauce."
    ]
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
    instructions: [
      "Bring a large pot of heavily salted water to boil (it should taste like the sea). Cook linguine according to package directions minus 1 minute for al dente. Reserve 1 cup pasta water before draining.",
      "While pasta cooks, peel and devein shrimp, leaving tails on for presentation. Pat completely dry and season lightly with salt and red pepper flakes.",
      "In a large skillet, heat 2 tablespoons butter and 2 tablespoons olive oil over medium-high heat. When butter foam subsides, add shrimp in a single layer. Sear 1-2 minutes per side until pink and slightly golden. Remove to a plate immediately (they'll continue cooking).",
      "Reduce heat to medium. Add remaining 2 tablespoons butter and 6 thinly sliced garlic cloves to the pan. Sauté for 1 minute until garlic is fragrant and just starting to turn golden - watch carefully as garlic burns quickly.",
      "Add 1/2 cup dry white wine and juice of 1 lemon. Let it bubble and reduce by half, about 2 minutes, scraping up any browned bits from the bottom of the pan.",
      "Add drained pasta directly to the skillet. Toss with the sauce, adding pasta water as needed to create a silky coating. Return shrimp to the pan, add 1/4 cup chopped fresh parsley, and toss for 30 seconds to warm through. Serve immediately with extra lemon wedges and crusty bread."
    ]
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
    instructions: [
      "Sort through dried black beans, removing any stones or debris. Soak beans overnight in cold water covering them by 3 inches. This reduces cooking time and improves digestibility.",
      "Cut pork shoulder into 2-inch cubes, slice smoked sausage into 1-inch rounds, and cut bacon into lardons. The variety of pork cuts creates layers of flavor and texture.",
      "In a large Dutch oven, render the bacon over medium heat until crispy, about 8 minutes. Remove bacon and brown pork shoulder and sausage in batches in the bacon fat until deeply colored on all sides. Remove and set aside.",
      "Drain soaked beans and add to the pot with 10 cups fresh water, all the browned meats, 4 bay leaves, 1 whole onion studded with 4 cloves, and 6 whole garlic cloves. Bring to a boil, then reduce to a gentle simmer.",
      "Simmer uncovered for 2.5-3 hours, stirring occasionally, until beans are very tender and the cooking liquid is thick and creamy. If it gets too thick, add more water. Season with salt and pepper in the last 30 minutes.",
      "Make the traditional accompaniments: sauté collard greens with garlic in olive oil, toast farofa (cassava flour) in butter until golden. Serve feijoada over white rice with the greens, farofa, orange slices (the citrus cuts through the richness), and hot sauce on the side."
    ]
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
    instructions: [
      "Use the best quality, ripest tomatoes you can find - this dish depends on it. Heirloom or vine-ripened tomatoes work best. Leave them at room temperature (never refrigerate tomatoes as cold dulls their flavor).",
      "Remove fresh mozzarella from its liquid about 30 minutes before serving to come to room temperature. This allows the cheese to develop its full creamy flavor and soft texture.",
      "Using a sharp knife, slice tomatoes and mozzarella into 1/4-inch thick rounds. Slightly thicker slices for the tomatoes can also work well.",
      "On a large serving platter, alternate overlapping slices of tomato and mozzarella, creating a circular or linear pattern. Tuck whole fresh basil leaves between each tomato-mozzarella pair.",
      "Season generously with flaky sea salt (like Maldon) and freshly cracked black pepper. The salt should be visible on the tomatoes - it draws out their natural sweetness.",
      "Drizzle generously with your best extra virgin olive oil (about 3 tablespoons), then finish with a delicate drizzle of aged balsamic glaze in a zigzag pattern. Serve immediately - this salad doesn't hold well as the salt releases tomato juices."
    ]
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
    instructions: [
      "Dice 4 large red onions very finely (almost minced). In a dry Dutch oven or heavy pot, cook onions over medium-low heat for 30-45 minutes, stirring frequently, until deeply caramelized and reduced by half. Don't add oil at first - the onions should dry-caramelize.",
      "While onions cook, prepare the chicken: remove skin if desired, cut leg quarters into drumsticks and thighs. Score the meat deeply with a knife. Marinate with lemon juice and salt for 15 minutes.",
      "Add 4 tablespoons niter kibbeh (Ethiopian spiced butter) to the caramelized onions. Stir in 3 tablespoons berbere spice blend and 2 minced garlic cloves. Cook for 5 minutes, stirring constantly, until the spices are fragrant and the mixture becomes a thick paste.",
      "Add 1 cup water and stir to create a sauce. Nestle chicken pieces into the sauce, turning to coat. Cover and simmer over low heat for 45 minutes to 1 hour, turning chicken occasionally, until tender and cooked through (internal temp 175°F).",
      "While chicken cooks, hard-boil 6 eggs for 10 minutes, then cool and peel. Score the eggs lightly with a knife to allow the sauce to penetrate. Add eggs to the stew during the last 15 minutes of cooking.",
      "Adjust seasoning with salt and more berbere if needed - the stew should be deeply spiced and rich. Traditionally served family-style on a large round of injera bread (spongy Ethiopian flatbread). Tear pieces of injera to scoop up the stew."
    ]
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
    instructions: [
      "Place pork cutlets between two sheets of plastic wrap. Using a meat mallet or rolling pin, pound to an even 1/4-inch thickness. The meat should be uniformly thin for even cooking and maximum crispiness. Season both sides with salt and pepper.",
      "Set up a breading station: shallow dish with flour seasoned with salt and pepper, bowl with 2 beaten eggs mixed with 1 tablespoon water, and plate with fine dry breadcrumbs (traditional schnitzel uses unseasoned breadcrumbs).",
      "Dredge each cutlet in flour, shaking off excess. Dip in egg, letting excess drip off. Finally, press into breadcrumbs on both sides, ensuring complete coverage. Don't press too hard - the coating should be loose and airy.",
      "Let breaded cutlets rest for 5-10 minutes on a wire rack. This helps the coating adhere better during frying.",
      "Heat 1/2 inch of vegetable oil (or a mix of vegetable oil and clarified butter) in a large skillet to 350°F. The oil should come halfway up the sides of the schnitzel. Test with a breadcrumb - it should sizzle immediately.",
      "Fry schnitzels one or two at a time (don't crowd the pan) for 2-3 minutes per side until deep golden brown and cooked through. The key technique: gently swirl the pan so hot oil washes over the top of the schnitzel, creating the signature wavy, puffed crust. Drain on paper towels and serve immediately with lemon wedges and traditional German potato salad or spaetzle."
    ]
  }
];

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('recipes'); // 'recipes' or 'ingredients'
  const [filters, setFilters] = useState({ cuisines: [], diets: [], maxCost: null, maxTime: null });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch user profile (with localStorage fallback for demo)
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const user = await auth.me();
        if (user?.id) {
          const profiles = await entities.UserProfile.filter({ user_id: user.id });
          if (profiles && profiles.length > 0) {
            return profiles[0];
          }
        }
      } catch (error) {
        console.log('Auth not available, checking localStorage');
      }

      // Fallback to localStorage for demo mode
      const localProfile = localStorage.getItem('dishdollar_profile');
      if (localProfile) {
        return JSON.parse(localProfile);
      }
      return null;
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
    queryFn: () => entities.Recipe.list('-created_date', 50)
  });

  // Fetch saved recipes (with localStorage fallback for demo mode)
  const { data: savedRecipes = [] } = useQuery({
    queryKey: ['savedRecipes'],
    queryFn: async () => {
      try {
        const user = await auth.me();
        if (user?.id) {
          return entities.SavedRecipe.filter({ user_id: user.id });
        }
      } catch (error) {
        console.log('Auth not available for saved recipes, using localStorage');
      }
      // Fallback to localStorage for demo mode
      const localSaved = localStorage.getItem('dishdollar_saved_recipes');
      return localSaved ? JSON.parse(localSaved) : [];
    }
  });

  // Fetch budget entries
  const { data: budgetEntries = [] } = useQuery({
    queryKey: ['budgetEntries'],
    queryFn: async () => {
      const user = await auth.me();
      return entities.BudgetEntry.filter({ user_id: user.id });
    }
  });

  // Seed sample recipes if none exist
  const seedRecipesMutation = useMutation({
    mutationFn: async () => {
      for (const recipe of sampleRecipes) {
        await entities.Recipe.create(recipe);
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

  // Save recipe mutation (with localStorage fallback for demo mode)
  const saveRecipeMutation = useMutation({
    mutationFn: async (recipe) => {
      let userId = null;
      try {
        const user = await auth.me();
        if (user?.id) userId = user.id;
      } catch (error) {
        console.log('Auth not available, using demo mode for save');
      }

      const existing = savedRecipes.find(sr => sr.recipe_id === recipe.id);

      if (userId) {
        // Authenticated user - use Supabase
        if (existing) {
          return entities.SavedRecipe.delete(existing.id);
        } else {
          return entities.SavedRecipe.create({
            user_id: userId,
            recipe_id: recipe.id,
            saved_at: new Date().toISOString()
          });
        }
      } else {
        // Demo mode - use localStorage
        const localSaved = JSON.parse(localStorage.getItem('dishdollar_saved_recipes') || '[]');
        if (existing) {
          const updated = localSaved.filter(sr => sr.recipe_id !== recipe.id);
          localStorage.setItem('dishdollar_saved_recipes', JSON.stringify(updated));
          return null;
        } else {
          const newSaved = {
            id: `saved-${Date.now()}`,
            user_id: 'demo-user',
            recipe_id: recipe.id,
            saved_at: new Date().toISOString()
          };
          const updated = [...localSaved, newSaved];
          localStorage.setItem('dishdollar_saved_recipes', JSON.stringify(updated));
          return newSaved;
        }
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

  // Handle refresh - fetch new recipes from discovery service
  const [isDiscovering, setIsDiscovering] = useState(false);

  const handleRefresh = async () => {
    setIsDiscovering(true);
    try {
      // Fetch fresh new recipes based on user preferences (get more recipes)
      const newRecipes = await getPersonalizedRecipes(profileData, 10);

      if (newRecipes && newRecipes.length > 0) {
        let addedCount = 0;

        // Add discovered recipes to the database
        for (const recipe of newRecipes) {
          // Check if recipe already exists (by title)
          const existing = recipes.find(r =>
            r.title?.toLowerCase() === recipe.title?.toLowerCase()
          );
          if (!existing) {
            await entities.Recipe.create({
              ...recipe,
              id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });
            addedCount++;
          }
        }

        // Refetch to show new recipes
        await refetchRecipes();

        if (addedCount > 0) {
          toast({
            title: "New Recipes Found!",
            description: `Added ${addedCount} fresh recipes to your collection`
          });
        } else {
          toast({
            title: "Recipes Refreshed!",
            description: "No new recipes found - try again later for fresh content"
          });
        }
      } else {
        // Just refetch existing recipes
        await refetchRecipes();
        toast({
          title: "Recipes Refreshed!",
          description: "Showing latest recipes"
        });
      }
    } catch (error) {
      console.error('Refresh error:', error);
      await refetchRecipes();
      toast({
        title: "Refresh Complete",
        description: "Showing cached recipes"
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  // Helper function to find matching ingredients in a recipe
  const getMatchingIngredients = (recipe, query) => {
    if (!query || !recipe.ingredients) return [];
    const lowerQuery = query.toLowerCase();
    return recipe.ingredients.filter(ing =>
      ing.name?.toLowerCase().includes(lowerQuery)
    );
  };

  // Filter recipes based on search and filters
  const filteredRecipes = recipes.filter(recipe => {
    let matchesSearch = true;

    if (searchQuery) {
      if (searchMode === 'ingredients') {
        // Search by ingredients
        matchesSearch = recipe.ingredients?.some(ing =>
          ing.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      } else {
        // Search by recipe title and cuisines
        matchesSearch =
          recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.cuisines?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
      }
    }

    const matchesCuisine = filters.cuisines.length === 0 ||
      recipe.cuisines?.some(c => filters.cuisines.includes(c));

    const matchesDiet = filters.diets.length === 0 ||
      recipe.diets?.some(d => filters.diets.includes(d));

    const matchesCost = !filters.maxCost ||
      (recipe.total_cost || 0) <= filters.maxCost;

    const matchesTime = !filters.maxTime ||
      ((recipe.prep_time || 0) + (recipe.cook_time || 0)) <= filters.maxTime;

    return matchesSearch && matchesCuisine && matchesDiet && matchesCost && matchesTime;
  }).map(recipe => ({
    ...recipe,
    // Add matched ingredients for display when in ingredient search mode
    matchedIngredients: searchMode === 'ingredients' && searchQuery
      ? getMatchingIngredients(recipe, searchQuery)
      : []
  }));

  // Personalized recipes (matching user preferences)
  // Sort by relevance: recipes matching user's cuisines appear first
  const personalizedRecipes = filteredRecipes
    .filter(recipe => {
      // If user has no preferences, show all recipes
      if (!profileData?.cuisines?.length && !profileData?.dietary_restrictions?.length) return true;
      
      // Check if recipe matches user's cuisine preferences
      const matchesCuisine = !profileData.cuisines?.length || 
        recipe.cuisines?.some(c => profileData.cuisines.includes(c));
      
      // Check if recipe matches user's dietary restrictions
      // If user selected "No Restrictions", all diets are acceptable
      const matchesDiet = !profileData.dietary_restrictions?.length ||
        profileData.dietary_restrictions.includes('No Restrictions') ||
        profileData.dietary_restrictions.length === 0 ||
        recipe.diets?.length === 0 || // Recipes with no diet tags are acceptable
        recipe.diets?.some(d => profileData.dietary_restrictions.includes(d));
      
      // Recipe must match cuisine preferences (if set) AND be diet-compatible
      return matchesCuisine && matchesDiet;
    })
    .sort((a, b) => {
      // Prioritize recipes that match user's cuisines
      const aMatchesCuisine = a.cuisines?.some(c => profileData?.cuisines?.includes(c)) ? 1 : 0;
      const bMatchesCuisine = b.cuisines?.some(c => profileData?.cuisines?.includes(c)) ? 1 : 0;
      return bMatchesCuisine - aMatchesCuisine;
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
          {/* Store Switcher in top right */}
          <div className="absolute top-4 right-6">
            <StoreSwitcher compact className="bg-white/20 hover:bg-white/30 text-white rounded-full" />
          </div>

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
            
            {/* Search Mode Toggle */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setSearchMode('recipes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  searchMode === 'recipes'
                    ? 'bg-white text-green-700 shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Search className="w-4 h-4" />
                Recipes & Cuisines
              </button>
              <button
                onClick={() => setSearchMode('ingredients')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  searchMode === 'ingredients'
                    ? 'bg-white text-green-700 shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Apple className="w-4 h-4" />
                By Ingredient
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              {searchMode === 'ingredients' ? (
                <Apple className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              ) : (
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchMode === 'ingredients'
                  ? "Search by ingredient (e.g., chicken, garlic, tofu)..."
                  : "Search recipes or cuisines..."
                }
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

            {/* Ingredient search hint */}
            {searchMode === 'ingredients' && searchQuery && (
              <p className="text-green-100 text-sm mt-3">
                Showing recipes containing "{searchQuery}"
              </p>
            )}
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
            disabled={isRefetching || isDiscovering || seedRecipesMutation.isPending}
            className="rounded-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching || isDiscovering ? 'animate-spin' : ''}`} />
            {isDiscovering ? 'Finding recipes...' : 'Refresh'}
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

        {/* Ingredient Search Results Info */}
        {searchMode === 'ingredients' && searchQuery && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-center gap-2 text-green-800">
              <Apple className="w-5 h-5" />
              <span className="font-medium">
                Found {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} with "{searchQuery}"
              </span>
            </div>
            {filteredRecipes.length > 0 && (
              <p className="text-sm text-green-600 mt-1 ml-7">
                Matching ingredients are highlighted on each recipe
              </p>
            )}
          </div>
        )}

        {/* For You Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-800">
              {searchMode === 'ingredients' && searchQuery ? 'Recipes with ' + searchQuery : 'For You'}
            </h2>
            {!searchQuery && profileData?.cuisines?.length > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                Based on your {profileData.cuisines.slice(0, 2).join(', ')} preferences
              </span>
            )}
          </div>
          
          {recipesLoading ? (
            <RecipeCardSkeletonGrid count={6} />
          ) : personalizedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {personalizedRecipes.slice(0, 6).map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col"
                  >
                    <RecipeCard
                      recipe={recipe}
                      householdSize={profileData?.household_size || 4}
                      pantryItems={profileData?.pantry_items}
                      isSaved={savedRecipes.some(sr => sr.recipe_id === recipe.id)}
                      onSave={() => saveRecipeMutation.mutate(recipe)}
                      onClick={() => navigate(createPageUrl('RecipeDetails') + `?id=${recipe.id}`)}
                    />
                    {/* Show matched ingredients when searching by ingredient */}
                    {searchMode === 'ingredients' && recipe.matchedIngredients?.length > 0 && (
                      <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-xs text-green-700 font-medium mb-1">Contains:</p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.matchedIngredients.slice(0, 3).map((ing, i) => (
                            <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              {ing.name}
                            </span>
                          ))}
                          {recipe.matchedIngredients.length > 3 && (
                            <span className="text-xs text-green-600">+{recipe.matchedIngredients.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {searchMode === 'ingredients' ? (
                  <Apple className="w-10 h-10 text-green-600" />
                ) : (
                  <ChefHat className="w-10 h-10 text-green-600" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchMode === 'ingredients' && searchQuery
                  ? `No recipes found with "${searchQuery}"`
                  : 'No matching recipes'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchMode === 'ingredients'
                  ? 'Try searching for a different ingredient or switch to recipe search'
                  : 'Try adjusting your filters or add new recipes'}
              </p>
              <div className="flex justify-center gap-3">
                {searchMode === 'ingredients' && (
                  <Button
                    variant="outline"
                    onClick={() => { setSearchMode('recipes'); setSearchQuery(''); }}
                    className="rounded-full"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search Recipes
                  </Button>
                )}
                <Link to={createPageUrl('AddRecipe')}>
                  <Button className="rounded-full bg-green-500 hover:bg-green-600">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Recipe
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Explore New Recipes Section - hide when searching by ingredient */}
        {exploreRecipes.length > 0 && !(searchMode === 'ingredients' && searchQuery) && (
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
                  className="flex flex-col"
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
              <h2 className="text-2xl font-bold text-gray-800">
                {searchMode === 'ingredients' && searchQuery ? 'More Results' : 'All Recipes'}
              </h2>
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
                  className="flex flex-col"
                >
                  <RecipeCard
                    recipe={recipe}
                    householdSize={profileData?.household_size || 4}
                    pantryItems={profileData?.pantry_items}
                    isSaved={savedRecipes.some(sr => sr.recipe_id === recipe.id)}
                    onSave={() => saveRecipeMutation.mutate(recipe)}
                    onClick={() => navigate(createPageUrl('RecipeDetails') + `?id=${recipe.id}`)}
                  />
                  {/* Show matched ingredients when searching by ingredient */}
                  {searchMode === 'ingredients' && recipe.matchedIngredients?.length > 0 && (
                    <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs text-green-700 font-medium mb-1">Contains:</p>
                      <div className="flex flex-wrap gap-1">
                        {recipe.matchedIngredients.slice(0, 3).map((ing, i) => (
                          <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            {ing.name}
                          </span>
                        ))}
                        {recipe.matchedIngredients.length > 3 && (
                          <span className="text-xs text-green-600">+{recipe.matchedIngredients.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

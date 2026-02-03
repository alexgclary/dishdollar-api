import { lazy } from 'react';
import __Layout from './Layout.jsx';

// Lazy load all pages for code splitting
// Each page will be loaded as a separate chunk only when needed
const AddRecipe = lazy(() => import('./pages/AddRecipe'));
const Admin = lazy(() => import('./pages/Admin'));
const Budget = lazy(() => import('./pages/Budget'));
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const MealPlanner = lazy(() => import('./pages/MealPlanner'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Profile = lazy(() => import('./pages/Profile'));
const RecipeDetails = lazy(() => import('./pages/RecipeDetails'));
const SavedRecipes = lazy(() => import('./pages/SavedRecipes'));
const ShoppingList = lazy(() => import('./pages/ShoppingList'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Welcome = lazy(() => import('./pages/Welcome'));

export const PAGES = {
  "AddRecipe": AddRecipe,
  "Admin": Admin,
  "Budget": Budget,
  "Home": Home,
  "Login": Login,
  "MealPlanner": MealPlanner,
  "Onboarding": Onboarding,
  "PrivacyPolicy": PrivacyPolicy,
  "Profile": Profile,
  "RecipeDetails": RecipeDetails,
  "SavedRecipes": SavedRecipes,
  "ShoppingList": ShoppingList,
  "TermsOfService": TermsOfService,
  "Welcome": Welcome,
}

export const pagesConfig = {
  mainPage: "Welcome",
  Pages: PAGES,
  Layout: __Layout,
};

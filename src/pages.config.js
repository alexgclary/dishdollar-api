import AddRecipe from './pages/AddRecipe';
import Admin from './pages/Admin';
import Budget from './pages/Budget';
import Home from './pages/Home';
import Login from './pages/Login';
import MealPlanner from './pages/MealPlanner';
import Onboarding from './pages/Onboarding';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import RecipeDetails from './pages/RecipeDetails';
import SavedRecipes from './pages/SavedRecipes';
import ShoppingList from './pages/ShoppingList';
import TermsOfService from './pages/TermsOfService';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';


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

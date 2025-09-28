// config.ts - API Configuration
export const API_CONFIG = {
  // For development (emulator/Simulator)
  BASE_URL: 'http://localhost:5000',
  
  // For physical device testing (replace with your computer's IP)
  // BASE_URL: 'http://192.168.1.100:5000',
  
  ENDPOINTS: {
    CUSTOM_RECIPE: {
      OPTIONS: '/api/custom-recipe/options',
      GENERATE_RECIPE: '/api/custom-recipe/generate-recipe',
      GENERATE_MEAL_PLAN: '/api/custom-recipe/generate-meal-plan',
      HEALTH: '/api/custom-recipe/health'
    },
    FRIDGE: {
      PHOTO: '/fridge/photo',
      TEXT: '/fridge/text',
      RECIPE: '/fridge/recipe'
    },
    SERVER: {
      HEALTH: '/health',
      ROOT: '/'
    }
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Interface for API responses
export interface ApiResponse {
  success: boolean;
  recipes?: any[];
  error?: string;
  message?: string;
  dietary?: any[];
  cuisine?: any[];
  difficulty?: any[];
}

// Interface for recipe generation request
export interface RecipeGenerationRequest {
  prompt: string;
  constraints: {
    dietary: string;
    cuisine: string;
    difficulty: string;
  };
}
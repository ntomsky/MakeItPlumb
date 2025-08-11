import { CLAUDE_API_KEY as ENV_CLAUDE_API_KEY } from '@env';

// Environment variables loaded from .env file
export const CLAUDE_API_KEY = ENV_CLAUDE_API_KEY;

// App configuration
export const IS_DEV = __DEV__;
export const IS_PROD = !__DEV__;

// API endpoints
export const CLAUDE_API_BASE_URL = 'https://api.anthropic.com';

// Validate required environment variables
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!CLAUDE_API_KEY) {
    errors.push('CLAUDE_API_KEY is required');
  }

  // Debug logging (only in development)
  if (__DEV__) {
    console.log('Environment validation:', {
      hasClaudeKey: !!CLAUDE_API_KEY,
      claudeKeyPrefix: CLAUDE_API_KEY ? CLAUDE_API_KEY.substring(0, 10) + '...' : 'missing'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

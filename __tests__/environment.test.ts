import { validateEnvironment, CLAUDE_API_KEY } from '../src/config/environment.service';

describe('Environment Configuration', () => {
  test('should load Claude API key from .env file', () => {
    console.log('Environment validation test');
    console.log('CLAUDE_API_KEY exists:', !!CLAUDE_API_KEY);
    console.log('CLAUDE_API_KEY prefix:', CLAUDE_API_KEY ? CLAUDE_API_KEY.substring(0, 15) + '...' : 'missing');
    
    const validation = validateEnvironment();
    console.log('Validation result:', validation);
    
    expect(CLAUDE_API_KEY).toBeDefined();
    expect(CLAUDE_API_KEY).toContain('sk-ant-');
    expect(validation.isValid).toBe(true);
  });
});

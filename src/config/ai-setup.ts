import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY, validateEnvironment } from './environment.service';

export class AIService {
  private static instance: AIService;
  private anthropic: Anthropic;

  private constructor() {
    // Validate environment first
    const validation = validateEnvironment();
    if (!validation.isValid) {
      throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
    }

    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY is required. Please add it to your .env file.');
    }

    this.anthropic = new Anthropic({
      apiKey: CLAUDE_API_KEY,
    });
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  getAnthropicClient(): Anthropic {
    return this.anthropic;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Test connection. Reply with just "OK".'
        }]
      });
      return response.content[0].type === 'text' && response.content[0].text.includes('OK');
    } catch (error) {
      console.error('Claude connection test failed:', error);
      return false;
    }
  }
}

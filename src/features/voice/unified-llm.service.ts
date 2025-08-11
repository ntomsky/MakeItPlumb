import { ClaudeParseService, ClaudeParseResult } from './claude-parse.service';
import { DraftIntake } from '../../types/domain';

export type LLMProvider = 'claude' | 'openai' | 'local';

export interface LLMParseResult {
  success: boolean;
  data?: DraftIntake;
  error?: string;
  provider: LLMProvider;
  rawResponse?: string;
}

export class UnifiedLLMService {
  private static currentProvider: LLMProvider = 'claude';

  /**
   * Set the active LLM provider
   */
  static setProvider(provider: LLMProvider): void {
    this.currentProvider = provider;
  }

  /**
   * Get the current provider
   */
  static getProvider(): LLMProvider {
    return this.currentProvider;
  }

  /**
   * Parse voice transcript using the active LLM provider
   */
  static async parseVoiceTranscript(transcript: string): Promise<LLMParseResult> {
    switch (this.currentProvider) {
      case 'claude':
        return this.parseWithClaude(transcript);
      
      case 'openai':
        // TODO: Implement OpenAI integration
        return {
          success: false,
          error: 'OpenAI integration not yet implemented',
          provider: 'openai'
        };
      
      case 'local':
        // TODO: Implement local LLM integration
        return {
          success: false,
          error: 'Local LLM integration not yet implemented',
          provider: 'local'
        };
      
      default:
        return {
          success: false,
          error: `Unknown provider: ${this.currentProvider}`,
          provider: this.currentProvider
        };
    }
  }

  /**
   * Parse using Claude
   */
  private static async parseWithClaude(transcript: string): Promise<LLMParseResult> {
    try {
      const result: ClaudeParseResult = await ClaudeParseService.parseVoiceTranscript(transcript);
      
      return {
        success: result.success,
        data: result.data,
        error: result.error,
        provider: 'claude',
        rawResponse: result.rawResponse
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Claude parsing failed',
        provider: 'claude'
      };
    }
  }

  /**
   * Test the current provider
   */
  static async testCurrentProvider(): Promise<LLMParseResult> {
    const testTranscript = "This is a test quote for Jane Doe at 456 Oak Street. I replaced a toilet for $300 and charged 3 hours labor at $100 per hour. Tax rate is 8.25%.";
    
    return this.parseVoiceTranscript(testTranscript);
  }

  /**
   * Get available providers
   */
  static getAvailableProviders(): LLMProvider[] {
    return ['claude', 'openai', 'local'];
  }

  /**
   * Check if a provider is available/configured
   */
  static async isProviderAvailable(provider: LLMProvider): Promise<boolean> {
    switch (provider) {
      case 'claude':
        try {
          const result = await ClaudeParseService.testParsing();
          return result.success;
        } catch {
          return false;
        }
      
      case 'openai':
        // TODO: Check OpenAI availability
        return false;
      
      case 'local':
        // TODO: Check local LLM availability
        return false;
      
      default:
        return false;
    }
  }
}

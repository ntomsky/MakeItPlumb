import { UnifiedLLMService, LLMParseResult } from './unified-llm.service';
import { DraftIntake } from '../../types/domain';

/**
 * Main LLM parsing service that acts as the primary interface
 * for all AI-powered text parsing in the application
 */
export class LLMParseService {
  /**
   * Parse voice transcript into structured data
   * This is the main method that should be used throughout the app
   */
  static async parseVoiceTranscript(transcript: string): Promise<LLMParseResult> {
    if (!transcript || transcript.trim().length === 0) {
      return {
        success: false,
        error: 'Empty transcript provided',
        provider: UnifiedLLMService.getProvider()
      };
    }

    try {
      // Use the unified service to parse with the current provider
      const result = await UnifiedLLMService.parseVoiceTranscript(transcript);
      
      // Log the result for debugging
      console.log('LLM Parse Result:', {
        success: result.success,
        provider: result.provider,
        hasData: !!result.data,
        error: result.error
      });

      return result;
    } catch (error) {
      console.error('LLM parsing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        provider: UnifiedLLMService.getProvider()
      };
    }
  }

  /**
   * Parse with fallback to heuristic parsing if LLM fails
   */
  static async parseWithFallback(transcript: string): Promise<{ data: DraftIntake; method: 'llm' | 'heuristic' }> {
    // Try LLM first
    const llmResult = await this.parseVoiceTranscript(transcript);
    
    if (llmResult.success && llmResult.data) {
      return {
        data: llmResult.data,
        method: 'llm'
      };
    }

    // Fallback to heuristic parsing
    console.log('LLM parsing failed, falling back to heuristic parsing');
    const { ParseService } = await import('./parse.service');
    const heuristicData = await ParseService.toDraft(transcript);
    
    return {
      data: heuristicData,
      method: 'heuristic'
    };
  }

  /**
   * Test the current LLM provider
   */
  static async testProvider(): Promise<LLMParseResult> {
    return UnifiedLLMService.testCurrentProvider();
  }

  /**
   * Switch LLM provider
   */
  static setProvider(provider: 'claude' | 'openai' | 'local'): void {
    UnifiedLLMService.setProvider(provider);
  }

  /**
   * Get current provider
   */
  static getCurrentProvider(): string {
    return UnifiedLLMService.getProvider();
  }
}

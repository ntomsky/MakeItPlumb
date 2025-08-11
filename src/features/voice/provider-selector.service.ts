import AsyncStorage from '@react-native-async-storage/async-storage';

export type LLMProvider = 'claude' | 'openai' | 'local';

const PROVIDER_STORAGE_KEY = '@voice_ai_provider';

export class ProviderSelectorService {
  private static currentProvider: LLMProvider = 'claude';

  /**
   * Load the saved provider from storage
   */
  static async loadProvider(): Promise<LLMProvider> {
    try {
      const saved = await AsyncStorage.getItem(PROVIDER_STORAGE_KEY);
      if (saved && this.isValidProvider(saved)) {
        this.currentProvider = saved as LLMProvider;
      }
    } catch (error) {
      console.warn('Failed to load provider preference:', error);
    }
    return this.currentProvider;
  }

  /**
   * Save the provider preference
   */
  static async saveProvider(provider: LLMProvider): Promise<void> {
    try {
      this.currentProvider = provider;
      await AsyncStorage.setItem(PROVIDER_STORAGE_KEY, provider);
    } catch (error) {
      console.warn('Failed to save provider preference:', error);
    }
  }

  /**
   * Get the current provider
   */
  static getCurrentProvider(): LLMProvider {
    return this.currentProvider;
  }

  /**
   * Set the current provider
   */
  static setCurrentProvider(provider: LLMProvider): void {
    this.currentProvider = provider;
  }

  /**
   * Get all available providers
   */
  static getAvailableProviders(): LLMProvider[] {
    return ['claude', 'openai', 'local'];
  }

  /**
   * Get provider display information
   */
  static getProviderInfo(provider: LLMProvider): { name: string; description: string; status: string } {
    switch (provider) {
      case 'claude':
        return {
          name: 'Claude 3.5 Sonnet',
          description: 'Anthropic\'s most capable model for text analysis',
          status: 'Available'
        };
      
      case 'openai':
        return {
          name: 'OpenAI GPT-4',
          description: 'OpenAI\'s flagship language model',
          status: 'Coming Soon'
        };
      
      case 'local':
        return {
          name: 'Local LLM',
          description: 'On-device processing for privacy',
          status: 'Coming Soon'
        };
      
      default:
        return {
          name: 'Unknown',
          description: 'Unknown provider',
          status: 'Unknown'
        };
    }
  }

  /**
   * Check if provider string is valid
   */
  private static isValidProvider(provider: string): boolean {
    return ['claude', 'openai', 'local'].includes(provider);
  }

  /**
   * Initialize the provider selector service
   */
  static async initialize(): Promise<void> {
    await this.loadProvider();
  }
}

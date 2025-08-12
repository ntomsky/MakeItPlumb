import { IntentResult, IntentType, VoiceParsingResult, ConfidenceGates } from '../types/voice-intent';
import { ClaudeParseService } from '../features/voice/claude-parse.service';

export class VoiceParsingService {
  /**
   * Main entry point: parse transcript into structured intent result
   * SINGLE SERVICE FOR ALL VOICE PARSING NEEDS
   */
  static async parseTranscript(transcript: string, dispatch?: any): Promise<VoiceParsingResult> {
    if (!transcript?.trim()) {
      return this.createErrorResult('Empty transcript provided');
    }

    try {
      // Step 1: Heuristic pass for hints
      if (dispatch) {
        dispatch({ type: 'voice/setProcessingStage', payload: { stage: 'analyzing', details: 'Extracting patterns and amounts...' } });
      }
      const heuristics = this.extractHeuristics(transcript);
      
      // Step 2: Claude pass with heuristic hints
      if (dispatch) {
        dispatch({ type: 'voice/setProcessingStage', payload: { stage: 'enhancing', details: 'Building enhanced prompt with hints...' } });
      }
      const intentResult = await this.parseWithClaude(transcript, heuristics, dispatch);
      
      // Step 3: Validate and determine confidence level
      if (dispatch) {
        dispatch({ type: 'voice/setProcessingStage', payload: { stage: 'validating', details: 'Calculating confidence and missing fields...' } });
      }
      const missing = this.findMissingFields(intentResult);
      const confidence = this.calculateConfidence(intentResult, missing);
      
      intentResult.confidence = confidence;
      intentResult.missing = missing;
      
      return {
        result: intentResult,
        level: ConfidenceGates.getLevel(confidence),
        actionRequired: ConfidenceGates.getActionRequired(confidence, missing),
        suggestions: this.generateSuggestions(intentResult, missing)
      };

    } catch (error) {
      console.error('Voice parsing error:', error);
      
      // FALLBACK: Try heuristic parsing if LLM fails
      try {
        return this.parseWithHeuristics(transcript);
      } catch (fallbackError) {
        return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * FALLBACK: Parse with heuristics when LLM fails
   */
  private static async parseWithHeuristics(transcript: string): Promise<VoiceParsingResult> {
    // Import heuristic parsing logic dynamically to avoid circular deps
    const { ParseService } = await import('../features/voice/parse.service');
    
    const draftData = await ParseService.toDraft(transcript);
    const heuristics = this.extractHeuristics(transcript);
    
    const intentResult: IntentResult = {
      intent: this.determineIntent(draftData.docType, heuristics),
      confidence: 0.4, // Lower confidence for heuristic parsing
      entities: {
        customer: draftData.customer?.name ? draftData.customer : undefined,
        address: draftData.address?.line1 ? draftData.address : undefined,
        items: draftData.items,
        discount: draftData.discount,
        taxRate: draftData.taxRate,
        notes: draftData.notes
      },
      missing: [],
      normalizedText: transcript,
      rawTranscript: transcript,
      processingMethod: 'heuristic'
    };

    const missing = this.findMissingFields(intentResult);
    intentResult.missing = missing;

    return {
      result: intentResult,
      level: ConfidenceGates.getLevel(intentResult.confidence),
      actionRequired: ConfidenceGates.getActionRequired(intentResult.confidence, missing),
      suggestions: [
        ...this.generateSuggestions(intentResult, missing),
        'Note: Used fallback parsing - consider improving transcript clarity'
      ]
    };
  }

  /**
   * Extract basic patterns with regex (heuristic pass)
   */
  private static extractHeuristics(transcript: string) {
    const text = transcript.toLowerCase();
    
    return {
      // Intent detection
      isQuote: /quote|estimate|proposal/.test(text),
      isInvoice: /invoice|bill|charge/.test(text),
      isCustomer: /add customer|new customer|customer/.test(text),
      
      // Currency patterns
      amounts: [...transcript.matchAll(/\$?([\d,]+(?:\.\d{2})?)/g)].map(m => parseFloat(m[1].replace(',', ''))),
      
      // Time patterns
      hours: [...transcript.matchAll(/(\d+(?:\.\d+)?)\s*hours?\s*(?:at|@)\s*\$?([\d,]+)/gi)].map(m => ({
        hours: parseFloat(m[1]),
        rate: parseFloat(m[2].replace(',', ''))
      })),
      
      // Address patterns
      addresses: [...transcript.matchAll(/(?:at|address)\s+([^,]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way)[^,]*)/gi)].map(m => m[1]),
      
      // Phone patterns
      phones: [...transcript.matchAll(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g)].map(m => m[1]),
      
      // Email patterns
      emails: [...transcript.matchAll(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi)].map(m => m[1])
    };
  }

  /**
   * Parse with Claude using heuristic hints
   */
  private static async parseWithClaude(transcript: string, heuristics: any, dispatch?: any): Promise<IntentResult> {
    const prompt = this.buildIntentPrompt(transcript, heuristics);
    
    if (dispatch) {
      dispatch({ type: 'voice/setProcessingStage', payload: { stage: 'parsing', details: 'Sending request to Claude AI...' } });
    }
    
    const response = await ClaudeParseService.parseVoiceTranscript(prompt);
    
    if (!response.success) {
      throw new Error(response.error || 'Claude parsing failed');
    }

    if (dispatch) {
      dispatch({ type: 'voice/setProcessingStage', payload: { stage: 'classifying', details: 'Processing AI response and classifying intent...' } });
    }

    // Convert Claude's response to IntentResult format
    const data = response.data!;
    
    return {
      intent: this.determineIntent(data.docType, heuristics),
      confidence: 0.8, // Will be recalculated
      entities: {
        customer: data.customer?.name ? {
          name: data.customer.name,
          phone: data.customer.phone || heuristics.phones[0] || undefined,
          email: data.customer.email || heuristics.emails[0] || undefined
        } : undefined,
        address: data.address?.line1 ? data.address : undefined,
        items: data.items?.map(item => ({
          qty: item.qty || 1,
          description: item.description,
          unitPrice: item.unitPrice,
          kind: item.kind,
          taxable: item.taxable !== false
        })),
        discount: data.discount,
        taxRate: data.taxRate,
        notes: data.notes
      },
      missing: [], // Will be calculated
      normalizedText: response.rawResponse,
      rawTranscript: transcript,
      processingMethod: 'llm'
    };
  }

  /**
   * Build enhanced prompt with heuristic hints
   */
  private static buildIntentPrompt(transcript: string, heuristics: any): string {
    let hintsText = '';
    
    if (heuristics.amounts.length > 0) {
      hintsText += `\nDetected amounts: $${heuristics.amounts.join(', $')}`;
    }
    
    if (heuristics.hours.length > 0) {
      hintsText += `\nDetected labor: ${heuristics.hours.map((h: any) => `${h.hours} hours at $${h.rate}`).join(', ')}`;
    }
    
    if (heuristics.addresses.length > 0) {
      hintsText += `\nDetected addresses: ${heuristics.addresses.join(', ')}`;
    }

    return `${transcript}${hintsText}`;
  }

  /**
   * Determine intent from document type and heuristics
   */
  private static determineIntent(docType?: string, heuristics?: any): IntentType {
    if (heuristics?.isCustomer && !heuristics?.isQuote && !heuristics?.isInvoice) {
      return 'add_customer';
    }
    
    if (docType === 'invoice' || heuristics?.isInvoice) {
      return 'create_invoice';
    }
    
    if (docType === 'quote' || heuristics?.isQuote) {
      return 'create_quote';
    }
    
    // Default based on context
    if (heuristics?.amounts?.length > 0 || heuristics?.hours?.length > 0) {
      return 'create_quote'; // Default to quote for pricing info
    }
    
    return 'unknown';
  }

  /**
   * Find missing required fields based on intent
   */
  private static findMissingFields(result: IntentResult): string[] {
    const missing: string[] = [];
    
    // Common requirements
    if (!result.entities.customer?.name) {
      missing.push('customer.name');
    }
    
    if (result.intent === 'create_quote' || result.intent === 'create_invoice') {
      if (!result.entities.items?.length) {
        missing.push('items');
      } else {
        result.entities.items.forEach((item, index) => {
          if (!item.description) missing.push(`items[${index}].description`);
          if (!item.unitPrice || item.unitPrice <= 0) missing.push(`items[${index}].unitPrice`);
        });
      }
    }
    
    return missing;
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateConfidence(result: IntentResult, missing: string[]): number {
    let confidence = 0.8; // Base confidence for LLM parsing
    
    // Reduce confidence for missing critical fields
    const criticalMissing = missing.filter(field => 
      field === 'customer.name' || 
      field === 'items' || 
      field.includes('unitPrice')
    );
    
    confidence -= criticalMissing.length * 0.2;
    
    // Boost confidence for complete entities
    if (result.entities.customer?.name) confidence += 0.1;
    if (result.entities.address?.line1) confidence += 0.05;
    if (result.entities.items?.length) confidence += 0.1;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate helpful suggestions for missing fields
   */
  private static generateSuggestions(result: IntentResult, missing: string[]): string[] {
    const suggestions: string[] = [];
    
    if (missing.includes('customer.name')) {
      suggestions.push('Try saying "This is for [customer name]" or "Quote for [customer name]"');
    }
    
    if (missing.includes('items')) {
      suggestions.push('Describe the work performed, like "I installed a faucet for $150"');
    }
    
    if (missing.some(m => m.includes('unitPrice'))) {
      suggestions.push('Include prices for each item, like "faucet for $150" or "2 hours at $100"');
    }
    
    return suggestions;
  }

  /**
   * Create error result
   */
  private static createErrorResult(error: string): VoiceParsingResult {
    return {
      result: {
        intent: 'unknown',
        confidence: 0,
        entities: {},
        missing: ['transcript'],
        rawTranscript: '',
        processingMethod: 'heuristic'
      },
      level: 'low',
      actionRequired: 'try_again',
      suggestions: [`Error: ${error}. Please try speaking again.`]
    };
  }
}

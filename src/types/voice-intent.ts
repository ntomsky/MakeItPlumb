export type IntentType = 'add_customer' | 'create_quote' | 'create_invoice' | 'unknown';

export type IntentResult = {
  intent: IntentType;
  confidence: number;              // 0..1 from LLM
  entities: {
    customer?: { 
      name?: string; 
      phone?: string; 
      email?: string; 
      isMatched?: boolean;
      matchConfidence?: number;
    };
    address?: { line1?: string; line2?: string; city?: string; state?: string; zip?: string };
    items?: Array<{ 
      qty?: number; 
      description?: string; 
      unitPrice?: number; 
      kind?: 'material' | 'labor'; 
      taxable?: boolean 
    }>;
    labor?: { hours?: number; rate?: number }; // will convert to items[] line
    discount?: { type: 'percent' | 'flat'; value: number };
    taxRate?: number;
    terms?: { dueInDays?: number };
    notes?: string;
  };
  missing: string[];               // e.g., ['customer.name','items[0].unitPrice']
  normalizedText?: string;         // Claude's cleaned version for debugging
  rawTranscript?: string;          // Original voice input
  processingMethod?: 'llm' | 'heuristic' | 'hybrid';
  matchedCustomer?: any;           // Full customer object if matched
  customerMatchConfidence?: number; // Confidence in customer match
};

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface VoiceParsingResult {
  result: IntentResult;
  level: ConfidenceLevel;
  actionRequired: 'confirm' | 'fix_missing' | 'try_again';
  suggestions?: string[];
}

/**
 * Confidence level utilities
 */
export const ConfidenceGates = {
  isHigh: (confidence: number): boolean => confidence >= 0.7,
  isMedium: (confidence: number): boolean => confidence >= 0.4 && confidence < 0.7,
  isLow: (confidence: number): boolean => confidence < 0.4,
  
  getLevel: (confidence: number): ConfidenceLevel => {
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.4) return 'medium';
    return 'low';
  },
  
  getActionRequired: (confidence: number, missing: string[]): VoiceParsingResult['actionRequired'] => {
    if (confidence >= 0.7 && missing.length === 0) return 'confirm';
    if (confidence >= 0.4) return 'fix_missing';
    return 'try_again';
  }
};

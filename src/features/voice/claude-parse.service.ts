import Anthropic from '@anthropic-ai/sdk';
import { AIService } from '../../config/ai-setup';
import { DraftIntake, LineItem, Customer } from '../../types/domain';
import { CustomerMatchingService } from '../../services/customer-matching.service';

export interface ClaudeParseResult {
  success: boolean;
  data?: DraftIntake;
  error?: string;
  rawResponse?: string;
  matchedCustomer?: Customer;
  customerConfidence?: number;
}

export class ClaudeParseService {
  private static anthropic: Anthropic;

  private static getClient(): Anthropic {
    if (!this.anthropic) {
      this.anthropic = AIService.getInstance().getAnthropicClient();
    }
    return this.anthropic;
  }

  /**
   * Parse voice transcript into structured plumbing invoice/quote data using Claude 3.5
   */
  static async parseVoiceTranscript(
    transcript: string, 
    existingCustomers?: Customer[]
  ): Promise<ClaudeParseResult> {
    try {
      const prompt = this.buildParsingPrompt(transcript);
      
      const response = await this.getClient().messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for consistent parsing
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      if (response.content[0].type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const rawResponse = response.content[0].text;
      const parsedData = this.extractStructuredData(rawResponse);

      // Attempt to match customer if customers provided
      let matchedCustomer: Customer | undefined;
      let customerConfidence: number | undefined;

      if (existingCustomers && parsedData.customer?.name) {
        const match = CustomerMatchingService.findBestMatch(
          parsedData.customer.name,
          existingCustomers,
          parsedData.customer.phone,
          parsedData.customer.email
        );

        if (match && match.confidence > 0.5) { // Only auto-match with high confidence
          matchedCustomer = match.customer;
          customerConfidence = match.confidence;
          
          // Update parsed data with matched customer info
          parsedData.customer = {
            name: match.customer.name,
            phone: match.customer.phone || parsedData.customer.phone,
            email: match.customer.email || parsedData.customer.email,
          };
        }
      }

      return {
        success: true,
        data: parsedData,
        rawResponse,
        matchedCustomer,
        customerConfidence
      };

    } catch (error) {
      console.error('Claude parsing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  /**
   * Build the prompt for Claude to parse plumbing service transcripts
   */
  private static buildParsingPrompt(transcript: string): string {
    return `You are a specialized AI assistant for parsing voice transcripts from plumbers into structured invoice/quote data.

TRANSCRIPT TO PARSE:
"${transcript}"

Please analyze this transcript and extract the following information into a JSON structure. Be intelligent about interpreting plumbing-specific terms, quantities, and pricing.

REQUIRED JSON STRUCTURE:
{
  "docType": "quote" | "invoice",
  "customer": {
    "name": "string",
    "email": "string or null",
    "phone": "string or null"
  },
  "address": {
    "line1": "string or null",
    "line2": "string or null", 
    "city": "string or null", 
    "state": "string or null",
    "zip": "string or null"
  },
  "items": [
    {
      "description": "string",
      "qty": number,
      "unitPrice": number,
      "taxable": boolean,
      "kind": "material" | "labor" | null
    }
  ],
  "discount": number (0-100 percentage),
  "taxRate": number (0-100 percentage),
  "notes": "string or null"
}

EXAMPLES OF SEPARATING MULTIPLE SERVICES:

Input: "water heater and installation for $1200"
Output items: [
  {"description": "Water heater", "qty": 1, "unitPrice": 800, "taxable": true, "kind": "material"},
  {"description": "Water heater installation", "qty": 1, "unitPrice": 400, "taxable": true, "kind": "labor"}
]

Input: "faucet replacement plus labor"
Output items: [
  {"description": "Kitchen faucet", "qty": 1, "unitPrice": 150, "taxable": true, "kind": "material"},
  {"description": "Faucet installation labor", "qty": 2, "unitPrice": 75, "taxable": true, "kind": "labor"}
]

Input: "pipe repair and drain cleaning"
Output items: [
  {"description": "Pipe repair service", "qty": 1, "unitPrice": 200, "taxable": true, "kind": "labor"},
  {"description": "Drain cleaning service", "qty": 1, "unitPrice": 150, "taxable": true, "kind": "labor"}
]

PARSING GUIDELINES:
1. **Document Type**: Determine if this is a quote (estimate/proposal) or invoice (bill/payment request)
2. **Customer Info**: Extract names, contact information
3. **Address**: Property address where work is/was performed
4. **Line Items**: Parse services, materials, labor with quantities and prices
   - **IMPORTANT**: Separate multiple services mentioned together into individual line items
   - Examples: "water heater and installation" → 2 items: "Water heater" + "Installation service"
   - Examples: "pipe repair and cleaning" → 2 items: "Pipe repair" + "Drain cleaning service"
   - Examples: "faucet replacement plus labor" → 2 items: "Faucet" + "Labor - faucet installation"
   - Examples: "toilet repair with parts" → 2 items: "Toilet parts" + "Toilet repair labor"
   - Examples: "snake drain and fix leak" → 2 items: "Drain cleaning/snaking" + "Leak repair"
   - Look for connecting words: "and", "plus", "with", "including", "&", "also"
   - Common plumbing items: pipe fittings, fixtures, labor hours, drain cleaning, etc.
   - Be smart about units (e.g., "pipe" = feet, "faucet" = each, "labor" = hours)
   - When labor/installation is mentioned with a product, create separate items for the product and the labor
5. **Pricing**: Extract costs, discounts, tax rates
6. **Notes**: Additional important information

PLUMBING CONTEXT:
- Typical services: drain cleaning, pipe repair, fixture installation, water heater service
- Common materials: copper pipe, PVC pipe, fittings, valves, fixtures
- Labor is usually charged hourly ($75-150/hour typical range)
- Emergency calls often have higher rates

**CRITICAL**: When you hear compound services like "X and Y" or "X plus Y", always create separate line items for each distinct service or product mentioned.

Return ONLY the JSON structure, no additional text or explanation.`;
  }

  /**
   * Extract and validate the structured data from Claude's response
   */
  private static extractStructuredData(response: string): DraftIntake {
    try {
      // Find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the data
      return {
        docType: parsed.docType === 'invoice' ? 'invoice' : 'quote',
        customer: {
          name: parsed.customer?.name || '',
          email: parsed.customer?.email || null,
          phone: parsed.customer?.phone || null
        },
        address: {
          line1: parsed.address?.street || parsed.address?.line1 || null,
          line2: parsed.address?.line2 || null,
          city: parsed.address?.city || null,
          state: parsed.address?.state || null,
          zip: parsed.address?.zipCode || parsed.address?.zip || null
        },
        items: (parsed.items || []).map((item: any): Partial<LineItem> => ({
          description: item.description || 'Unknown service',
          qty: Number(item.qty || item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          taxable: item.taxable !== false, // Default to taxable
          kind: this.validateKind(item.kind)
        })),
        discount: parsed.discount ? {
          type: 'percent' as const,
          value: Math.max(0, Math.min(100, Number(parsed.discount) || 0))
        } : undefined,
        taxRate: Math.max(0, Math.min(100, Number(parsed.taxRate) || 0)),
        notes: parsed.notes || null
      };

    } catch (error) {
      console.error('Error parsing Claude response:', error);
      throw new Error('Failed to parse Claude response into structured data');
    }
  }

  /**
   * Validate and normalize kind types
   */
  private static validateKind(kind: string): LineItem['kind'] {
    const normalized = kind?.toLowerCase();
    
    if (normalized === 'material' || normalized === 'labor') {
      return normalized;
    }
    
    // Intelligent mapping based on common plumbing terms
    const laborTerms = ['labor', 'labour', 'work', 'service', 'installation', 'repair', 'hour', 'hours'];
    const materialTerms = ['material', 'part', 'parts', 'pipe', 'fitting', 'fixture', 'valve', 'faucet'];
    
    if (laborTerms.some(term => normalized?.includes(term))) {
      return 'labor';
    }
    
    if (materialTerms.some(term => normalized?.includes(term))) {
      return 'material';
    }
    
    // Default to labor for services
    return 'labor';
  }

  /**
   * Test the Claude connection and parsing capability
   */
  static async testParsing(): Promise<ClaudeParseResult> {
    const testTranscript = "This is a quote for John Smith at 123 Main Street. I installed a new kitchen faucet for $150 and spent 2 hours of labor at $100 per hour. Total with tax is about 8.5%.";
    
    return this.parseVoiceTranscript(testTranscript);
  }
}

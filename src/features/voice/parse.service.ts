import { DraftIntake, LineItem } from '../../types/domain';

export class ParseService {
  /**
   * Parse raw voice transcript into a structured draft
   * Uses heuristics for MVP, can be replaced with LLM service later
   */
  static async toDraft(rawText: string): Promise<DraftIntake> {
    const text = rawText.toLowerCase().trim();
    
    // Determine document type
    const docType = this.extractDocType(text);
    
    // Extract customer info
    const customer = this.extractCustomer(text);
    
    // Extract address
    const address = this.extractAddress(text);
    
    // Extract line items
    const items = this.extractLineItems(text);
    
    // Extract discount
    const discount = this.extractDiscount(text);
    
    // Extract tax rate
    const taxRate = this.extractTaxRate(text);
    
    // Extract notes
    const notes = this.extractNotes(text, rawText);
    
    return {
      docType,
      customer,
      address,
      items,
      discount,
      taxRate,
      notes,
    };
  }

  private static extractDocType(text: string): 'quote' | 'invoice' {
    if (text.includes('invoice') || text.includes('bill')) {
      return 'invoice';
    }
    return 'quote';
  }

  private static extractCustomer(text: string): Partial<DraftIntake['customer']> {
    const customer: Partial<DraftIntake['customer']> = {};
    
    // Extract name patterns like "for John Smith" or "customer John Miller"
    const namePatterns = [
      /(?:for|customer)\s+([a-z\s]+?)(?:\s+at|\s+\d|\s*,|\s*$)/i,
      /(?:quote|invoice)\s+(?:for\s+)?([a-z\s]+?)(?:\s+at|\s+\d|\s*,|\s*$)/i,
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        customer.name = this.capitalizeWords(match[1].trim());
        break;
      }
    }
    
    // Extract phone number
    const phoneMatch = text.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      customer.phone = phoneMatch[1];
    }
    
    // Extract email
    const emailMatch = text.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
    if (emailMatch) {
      customer.email = emailMatch[1];
    }
    
    return customer;
  }

  private static extractAddress(text: string): Partial<DraftIntake['address']> {
    const address: Partial<DraftIntake['address']> = {};
    
    // Look for address patterns after "at" or "address"
    const addressPatterns = [
      /(?:at|address)\s+(\d+\s+[a-z\s]+?)(?:\s+[a-z]{2}\s+\d{5}|\s*,|\s*$)/i,
      /(\d+\s+[a-z\s]+?(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way))/i,
    ];
    
    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match) {
        address.line1 = this.capitalizeWords(match[1].trim());
        break;
      }
    }
    
    // Extract city, state, zip if present
    const locationMatch = text.match(/([a-z\s]+),\s*([a-z]{2})\s+(\d{5})/i);
    if (locationMatch) {
      address.city = this.capitalizeWords(locationMatch[1].trim());
      address.state = locationMatch[2].toUpperCase();
      address.zip = locationMatch[3];
    }
    
    return address;
  }

  private static extractLineItems(text: string): Partial<LineItem>[] {
    const items: Partial<LineItem>[] = [];
    
    // Pattern for currency amounts
    const currencyPattern = /\$?([\d,]+(?:\.\d{2})?)/g;
    const currencyMatches = text.match(currencyPattern) || [];
    const amounts = currencyMatches.map(m => parseFloat(m.replace(/[$,]/g, '')));
    
    // Pattern for labor: "X hours at $Y per hour" or "X hours at Y"
    const laborPattern = /(\d+(?:\.\d+)?)\s+hours?\s+at\s+\$?(\d+)/gi;
    let laborMatch;
    while ((laborMatch = laborPattern.exec(text)) !== null) {
      const match = laborMatch;
      const qty = parseFloat(match[1]);
      const rate = parseFloat(match[2]);
      items.push({
        id: uuidv4() as string,
        qty,
        description: 'Labor',
        unitPrice: rate,
        taxable: true,
        kind: 'labor',
      });
    }
    
    // Pattern for materials with prices
    const materialPatterns = [
      /(?:replace|install|new)\s+([^$,\d]+?)\s+(?:one\s+unit\s+)?\$?([\d,]+(?:\.\d{2})?)/gi,
      /([^$,\d]+?)\s+\$?([\d,]+(?:\.\d{2})?)/gi,
    ];
    
    for (const pattern of materialPatterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex lastIndex
      while ((match = pattern.exec(text)) !== null) {
        const description = this.capitalizeWords(match[1].trim());
        const price = parseFloat(match[2].replace(',', ''));
        
        // Skip if this looks like it's already captured as labor
        if (description.toLowerCase().includes('hour') || 
            description.toLowerCase().includes('labor')) {
          continue;
        }
        
        items.push({
          id: uuidv4() as string,
          qty: 1,
          description,
          unitPrice: price,
          taxable: true,
          kind: 'material',
        });
      }
    }
    
    // If no specific items found but we have amounts, create generic items
    if (items.length === 0 && amounts.length > 0) {
      amounts.forEach((amount, index) => {
        items.push({
          id: uuidv4() as string,
          qty: 1,
          description: `Item ${index + 1}`,
          unitPrice: amount,
          taxable: true,
        });
      });
    }
    
    return items;
  }

  private static extractDiscount(text: string): DraftIntake['discount'] {
    // Look for percentage discount
    const percentMatch = text.match(/(\d+)\s*percent\s+discount/i);
    if (percentMatch) {
      return {
        type: 'percent',
        value: parseFloat(percentMatch[1]) / 100,
      };
    }
    
    // Look for flat discount
    const flatMatch = text.match(/(?:minus|discount)\s+\$?([\d,]+(?:\.\d{2})?)/i);
    if (flatMatch) {
      return {
        type: 'flat',
        value: parseFloat(flatMatch[1].replace(',', '')),
      };
    }
    
    return undefined;
  }

  private static extractTaxRate(text: string): number | undefined {
    const taxMatch = text.match(/(\d+(?:\.\d+)?)\s*%?\s+tax/i);
    if (taxMatch) {
      const rate = parseFloat(taxMatch[1]);
      return rate > 1 ? rate / 100 : rate;
    }
    
    return undefined;
  }

  private static extractNotes(processedText: string, originalText: string): string {
    const notes: string[] = [];
    
    // Look for explicit notes
    const noteMatch = originalText.match(/note[s]?\s+([^.!?]+)/i);
    if (noteMatch) {
      notes.push(noteMatch[1].trim());
    }
    
    // Look for terms
    const termsMatch = originalText.match(/due\s+in\s+(\d+)\s+days/i);
    if (termsMatch) {
      notes.push(`Net ${termsMatch[1]}`);
    }
    
    return notes.join('. ');
  }

  private static capitalizeWords(str: string): string {
    return str.replace(/\b\w+/g, word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  }
}
function uuidv4(): string {
    throw new Error('Function not implemented.');
}


import { ClaudeParseService } from '../src/features/voice/claude-parse.service';

describe('Claude Parse Service', () => {
  test('should parse voice transcript successfully', async () => {
    const testTranscript = "This is a quote for John Smith at 123 Main Street. I installed a new kitchen faucet for $150 and spent 2 hours of labor at $100 per hour. Tax rate is 8.5%.";
    
    const result = await ClaudeParseService.parseVoiceTranscript(testTranscript);
    
    console.log('Claude Parse Result:', JSON.stringify(result, null, 2));
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.customer?.name).toContain('John');
    expect(result.data?.items).toHaveLength(2); // faucet + labor
  });

  test('should separate multiple services into individual line items', async () => {
    const testTranscript = "Quote for Bob Johnson. I need to do water heater and installation at 456 Oak Street. The total is $1200.";
    
    const result = await ClaudeParseService.parseVoiceTranscript(testTranscript);
    
    console.log('Multiple Services Parse Result:', JSON.stringify(result, null, 2));
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.customer?.name).toContain('Bob');
    
    if (result.data?.items) {
      expect(result.data.items.length).toBeGreaterThanOrEqual(2); // Should separate water heater and installation
      
      const descriptions = result.data.items.map(item => (item.description || '').toLowerCase());
      expect(descriptions.some(desc => desc.includes('water heater'))).toBe(true);
      expect(descriptions.some(desc => desc.includes('installation'))).toBe(true);
    }
  });

  test('should handle pipe repair and cleaning as separate items', async () => {
    const testTranscript = "Invoice for Sarah Wilson. Did pipe repair and drain cleaning today. Total $350.";
    
    const result = await ClaudeParseService.parseVoiceTranscript(testTranscript);
    
    console.log('Pipe Repair + Cleaning Result:', JSON.stringify(result, null, 2));
    
    expect(result.success).toBe(true);
    
    if (result.data?.items) {
      expect(result.data.items.length).toBeGreaterThanOrEqual(2);
      
      const descriptions = result.data.items.map(item => (item.description || '').toLowerCase());
      expect(descriptions.some(desc => desc.includes('pipe') || desc.includes('repair'))).toBe(true);
      expect(descriptions.some(desc => desc.includes('drain') || desc.includes('cleaning'))).toBe(true);
    }
  });
});

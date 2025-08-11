import { ClaudeParseService } from '../src/features/voice/claude-parse.service';
import { LLMParseService } from '../src/features/voice/llm-parse.service';

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

  test('should handle LLM parsing with fallback', async () => {
    const testTranscript = "Invoice for Jane Doe, fixed leaky pipe, $75 parts plus 1 hour labor at $100";
    
    const result = await LLMParseService.parseWithFallback(testTranscript);
    
    console.log('LLM Parse with Fallback Result:', JSON.stringify(result, null, 2));
    
    expect(result.data).toBeDefined();
    expect(['llm', 'heuristic']).toContain(result.method);
  });
});

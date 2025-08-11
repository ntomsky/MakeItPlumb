import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { LLMParseService } from '../features/voice/llm-parse.service';
import { ClaudeParseService } from '../features/voice/claude-parse.service';
import { UnifiedLLMService } from '../features/voice/unified-llm.service';
import { DraftIntake } from '../types/domain';

export const VoiceTestScreen: React.FC = () => {
  const [testTranscript, setTestTranscript] = useState(
    "This is a quote for John Smith at 123 Main Street, Boston MA 02101. I installed a new kitchen faucet for $150 and spent 2 hours of labor at $100 per hour. Also replaced some pipe fittings for $45. Customer wants 10% discount. Tax rate is 8.5%. Please call him at 555-0123."
  );
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [currentProvider, setCurrentProvider] = useState<string>('claude');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const isConnected = await ClaudeParseService.testParsing();
      setConnectionStatus(isConnected.success ? 'Connected ✅' : `Failed: ${isConnected.error}`);
    } catch (error) {
      setConnectionStatus(`Error: ${error}`);
    }
  };

  const testParsing = async () => {
    if (!testTranscript.trim()) {
      Alert.alert('Error', 'Please enter a test transcript');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const parseResult = await LLMParseService.parseVoiceTranscript(testTranscript);
      setResult(parseResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: currentProvider
      });
    } finally {
      setLoading(false);
    }
  };

  const testWithFallback = async () => {
    setLoading(true);
    setResult(null);

    try {
      const parseResult = await LLMParseService.parseWithFallback(testTranscript);
      setResult({
        success: true,
        data: parseResult.data,
        method: parseResult.method,
        provider: currentProvider
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: currentProvider
      });
    } finally {
      setLoading(false);
    }
  };

  const changeProvider = (provider: 'claude' | 'openai' | 'local') => {
    UnifiedLLMService.setProvider(provider);
    setCurrentProvider(provider);
    testConnection();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice AI Test Screen</Text>
        <Text style={styles.subtitle}>Test Claude 3.5 Integration</Text>
      </View>

      {/* Connection Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Status</Text>
        <Text style={styles.status}>{connectionStatus}</Text>
        <TouchableOpacity style={styles.button} onPress={testConnection}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
      </View>

      {/* Provider Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Provider</Text>
        <View style={styles.providerButtons}>
          {['claude', 'openai', 'local'].map((provider) => (
            <TouchableOpacity
              key={provider}
              style={[
                styles.providerButton,
                currentProvider === provider && styles.activeProvider
              ]}
              onPress={() => changeProvider(provider as any)}
            >
              <Text style={[
                styles.providerText,
                currentProvider === provider && styles.activeProviderText
              ]}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Test Transcript Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Transcript</Text>
        <TextInput
          style={styles.textInput}
          value={testTranscript}
          onChangeText={setTestTranscript}
          multiline
          numberOfLines={4}
          placeholder="Enter voice transcript to test..."
        />
      </View>

      {/* Test Buttons */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testParsing}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Parsing...' : 'Test LLM Parsing'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]} 
          onPress={testWithFallback}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test with Fallback</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {result && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parse Result</Text>
          <View style={styles.resultContainer}>
            <Text style={[styles.resultStatus, result.success ? styles.success : styles.error]}>
              {result.success ? '✅ Success' : '❌ Failed'}
            </Text>
            {result.method && (
              <Text style={styles.method}>Method: {result.method}</Text>
            )}
            {result.provider && (
              <Text style={styles.provider}>Provider: {result.provider}</Text>
            )}
            {result.error && (
              <Text style={styles.errorText}>Error: {result.error}</Text>
            )}
            {result.data && (
              <ScrollView style={styles.dataContainer}>
                <Text style={styles.dataTitle}>Parsed Data:</Text>
                <Text style={styles.dataText}>{JSON.stringify(result.data, null, 2)}</Text>
              </ScrollView>
            )}
            {result.rawResponse && (
              <ScrollView style={styles.dataContainer}>
                <Text style={styles.dataTitle}>Raw AI Response:</Text>
                <Text style={styles.dataText}>{result.rawResponse}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  providerButtons: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  providerButton: {
    flex: 1,
    padding: 10,
    marginRight: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  activeProvider: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  providerText: {
    color: '#333',
    fontWeight: '500',
  },
  activeProviderText: {
    color: '#fff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  resultContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 10,
  },
  resultStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  success: {
    color: '#34C759',
  },
  error: {
    color: '#FF3B30',
  },
  method: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  provider: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 10,
  },
  dataContainer: {
    maxHeight: 300,
    marginTop: 10,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  dataText: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'monospace',
  },
});

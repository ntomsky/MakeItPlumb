import * as React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '../../app/theme';
import { Button } from '../../components/Button';
import {
  startRecording,
  stopRecording,
  setPartialTranscript,
  setFinalTranscript,
  startProcessing,
  setProcessingStage,
  setParsedResult,
  setError,
  reset,
  selectVoiceState,
} from './voice.slice';
import { sttService } from './stt.service';
import { ParseService } from './parse.service';
import { VoiceParsingService } from '../../services/voice-intent.service';
import { VoiceParsingResult } from '../../types/voice-intent';

// Helper function to format intent names for display
const formatIntentDisplay = (intent: string): string => {
  const intentMap: Record<string, string> = {
    'create_quote': 'Quote',
    'create_invoice': 'Invoice',
    'create_customer': 'Customer',
    'schedule_job': 'Job',
  };
  return intentMap[intent] || intent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

interface VoiceCaptureSheetProps {
  visible: boolean;
  onClose: () => void;
  onIntentReady: (result: VoiceParsingResult) => void; // Updated to use VoiceParsingResult
}

export const VoiceCaptureSheet: React.FC<VoiceCaptureSheetProps> = ({
  visible,
  onClose,
  onIntentReady, // Updated prop name
}) => {
  const dispatch = useDispatch();
  const voiceState = useSelector(selectVoiceState);
  const customers = useSelector((state: any) => state.customers.customers);
  
  const pulseAnimation = React.useRef(new Animated.Value(1)).current;
  const waveAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      dispatch(reset());
      setupVoiceListeners();
    }
    
    return () => {
      cleanup();
    };
  }, [visible]);

  React.useEffect(() => {
    if (voiceState.isRecording) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [voiceState.isRecording]);

  const setupVoiceListeners = () => {
    sttService.setCallbacks({
      onSpeechStart: () => {
        console.log('Speech started');
      },
      onSpeechEnd: () => {
        dispatch(stopRecording());
      },
      onSpeechPartialResults: (results) => {
        if (results.length > 0) {
          dispatch(setPartialTranscript(results[0]));
        }
      },
      onSpeechResults: (results) => {
        if (results.length > 0) {
          dispatch(setFinalTranscript(results[0]));
          handleProcessTranscript(results[0]);
        }
      },
      onSpeechError: (error) => {
        dispatch(setError(error?.message || 'Speech recognition error'));
      },
    });
  };

  const handleProcessTranscript = async (transcript: string) => {
    try {
      dispatch(startProcessing());
      
      // Use VoiceParsingService (single entry point) with progressive updates
      const intentResult = await VoiceParsingService.parseTranscript(transcript, dispatch, customers);
      
      // Store the result in Redux
      dispatch(setParsedResult(intentResult));
      
    } catch (error) {
      console.error('Voice processing error:', error);
      dispatch(setError('Failed to process voice input'));
    }
  };

  const startPulseAnimation = () => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    const wave = Animated.loop(
      Animated.timing(waveAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    
    pulse.start();
    wave.start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    waveAnimation.stopAnimation();
    
    Animated.parallel([
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(waveAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleStartRecording = async () => {
    try {
      const isAvailable = await sttService.isAvailable();
      if (!isAvailable) {
        Alert.alert('Error', 'Speech recognition is not available on this device');
        return;
      }
      
      dispatch(startRecording());
      await sttService.startListening();
    } catch (error) {
      dispatch(setError('Failed to start recording'));
    }
  };

  const handleStopRecording = async () => {
    try {
      await sttService.stopListening();
      dispatch(stopRecording());
    } catch (error) {
      dispatch(setError('Failed to stop recording'));
    }
  };

  const handleUseDraft = () => {
    if (voiceState.parsedResult) {
      onIntentReady(voiceState.parsedResult); // Updated
      handleClose();
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const cleanup = async () => {
    try {
      await sttService.cancelListening();
    } catch (error) {
      // Ignore cleanup errors
    }
    dispatch(reset());
  };

  const renderRecordingButton = () => {
    if (voiceState.isRecording) {
      return (
        <TouchableOpacity
          style={styles.recordButton}
          onPress={handleStopRecording}
        >
          <Animated.View
            style={[
              styles.recordButtonInner,
              styles.recordingButton,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <Icon name="stop" size={32} color={theme.colors.background} />
          </Animated.View>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        style={styles.recordButton}
        onPress={handleStartRecording}
      >
        <View style={[styles.recordButtonInner, styles.idleButton]}>
          <Icon name="mic" size={32} color={theme.colors.background} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (voiceState.error) {
      return (
        <View style={styles.content}>
          <Icon name="error" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{voiceState.error}</Text>
          <Button title="Try Again" onPress={() => dispatch(reset())} />
        </View>
      );
    }
    
    if (voiceState.parsedResult) {
      const { result } = voiceState.parsedResult;
      const customer = result.entities.customer;
      const address = result.entities.address;
      
      // Build address string
      const addressParts = [];
      if (address?.line1) addressParts.push(address.line1);
      if (address?.line2) addressParts.push(address.line2);
      if (address?.city) addressParts.push(address.city);
      if (address?.state) addressParts.push(address.state);
      if (address?.zip) addressParts.push(address.zip);
      
      const addressString = addressParts.length > 0 ? addressParts.join(', ') : '';
      
      return (
        <View style={styles.content}>
          <Icon name="check-circle" size={48} color={theme.colors.success} />
          <Text style={styles.successTitle}>Voice Processed!</Text>
          <Text style={styles.draftPreview}>
            {formatIntentDisplay(result.intent)} for{' '}
            {customer?.name || 'Customer'}
            {addressString && (
              <Text style={styles.addressText}>
                {'\n'}📍 {addressString}
              </Text>
            )}
          </Text>
          
          {/* Show original transcript for reference */}
          {result.rawTranscript && (
            <Text style={styles.transcriptReference}>
              Original: "{result.rawTranscript}"
            </Text>
          )}
          
          <View style={styles.actions}>
            <Button title="Use Draft" onPress={handleUseDraft} />
            <Button title="Try Again" onPress={() => dispatch(reset())} variant="outline" />
          </View>
        </View>
      );
    }
    
    if (voiceState.isProcessing) {
      return (
        <View style={styles.content}>
          <Icon name="psychology" size={48} color={theme.colors.primary} />
          <Text style={styles.processingTitle}>Processing Voice...</Text>
          <Text style={styles.processingStage}>
            {voiceState.processingDetails || 'Analyzing transcript...'}
          </Text>
          
          {/* Progress Indicators */}
          <View style={styles.progressContainer}>
            <View style={[
              styles.progressDot, 
              ['analyzing', 'enhancing', 'parsing', 'classifying', 'validating', 'complete'].includes(voiceState.processingStage) && styles.progressDotActive
            ]} />
            <View style={[
              styles.progressDot, 
              ['enhancing', 'parsing', 'classifying', 'validating', 'complete'].includes(voiceState.processingStage) && styles.progressDotActive
            ]} />
            <View style={[
              styles.progressDot, 
              ['parsing', 'classifying', 'validating', 'complete'].includes(voiceState.processingStage) && styles.progressDotActive
            ]} />
            <View style={[
              styles.progressDot, 
              ['classifying', 'validating', 'complete'].includes(voiceState.processingStage) && styles.progressDotActive
            ]} />
            <View style={[
              styles.progressDot, 
              ['validating', 'complete'].includes(voiceState.processingStage) && styles.progressDotActive
            ]} />
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.content}>
        <Text style={styles.instructionTitle}>Voice Capture</Text>
        <Text style={styles.instructionText}>
          {voiceState.isRecording 
            ? 'Listening... Speak clearly about your quote or invoice.'
            : 'Tap and hold the microphone button to start recording your quote or invoice details.'
          }
        </Text>
        
        {(voiceState.partialTranscript || voiceState.transcript) && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptLabel}>
              {voiceState.partialTranscript ? 'Listening...' : 'Heard:'}
            </Text>
            <Text style={styles.transcript}>
              {voiceState.partialTranscript || voiceState.transcript}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Icon name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        
        {renderContent()}
        
        <View style={styles.recordingArea}>
          {renderRecordingButton()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  transcriptContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.lg,
    width: '100%',
    marginTop: theme.spacing.lg,
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  transcript: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 22,
  },
  processingText: {
    fontSize: 18,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  processingStage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  draftPreview: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  transcriptReference: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  recordingArea: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    ...theme.shadows.medium,
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleButton: {
    backgroundColor: theme.colors.primary,
  },
  recordingButton: {
    backgroundColor: theme.colors.error,
  },
});

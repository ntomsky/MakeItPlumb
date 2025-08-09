import Voice, {
  SpeechRecognizedEvent,
  SpeechResultsEvent,
  SpeechErrorEvent,
} from 'react-native-voice';

export interface STTCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSpeechResults?: (results: string[]) => void;
  onSpeechPartialResults?: (results: string[]) => void;
  onSpeechError?: (error: any) => void;
}

export class STTService {
  private static instance: STTService;
  private callbacks: STTCallbacks = {};

  private constructor() {
    this.setupVoiceListeners();
  }

  static getInstance(): STTService {
    if (!STTService.instance) {
      STTService.instance = new STTService();
    }
    return STTService.instance;
  }

  private setupVoiceListeners() {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
  }

  setCallbacks(callbacks: STTCallbacks) {
    this.callbacks = callbacks;
  }

  async startListening(): Promise<void> {
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      this.callbacks.onSpeechError?.(error);
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      this.callbacks.onSpeechError?.(error);
    }
  }

  async cancelListening(): Promise<void> {
    try {
      await Voice.cancel();
    } catch (error) {
      console.error('Error canceling voice recognition:', error);
    }
  }

  async destroy(): Promise<void> {
    try {
      await Voice.destroy();
    } catch (error) {
      console.error('Error destroying voice recognition:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      return await Voice.isAvailable();
    } catch (error) {
      return false;
    }
  }

  private onSpeechStart() {
    console.log('Speech recognition started');
    this.callbacks.onSpeechStart?.();
  }

  private onSpeechEnd() {
    console.log('Speech recognition ended');
    this.callbacks.onSpeechEnd?.();
  }

  private onSpeechResults(event: SpeechResultsEvent) {
    console.log('Speech results:', event.value);
    this.callbacks.onSpeechResults?.(event.value || []);
  }

  private onSpeechPartialResults(event: SpeechResultsEvent) {
    console.log('Partial speech results:', event.value);
    this.callbacks.onSpeechPartialResults?.(event.value || []);
  }

  private onSpeechError(event: SpeechErrorEvent) {
    console.error('Speech recognition error:', event.error);
    this.callbacks.onSpeechError?.(event.error);
  }
}

export const sttService = STTService.getInstance();

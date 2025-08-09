declare module 'react-native-voice' {
  export interface SpeechRecognizedEvent {
    isFinal?: boolean;
  }

  export interface SpeechResultsEvent {
    value?: string[];
  }

  export interface SpeechErrorEvent {
    error?: {
      code?: string;
      message?: string;
    };
  }

  export interface SpeechStartEvent {
    // Add properties as needed
  }

  export interface SpeechEndEvent {
    // Add properties as needed
  }

  const Voice: {
    onSpeechStart: ((event: SpeechStartEvent) => void) | undefined;
    onSpeechRecognized: ((event: SpeechRecognizedEvent) => void) | undefined;
    onSpeechEnd: ((event: SpeechEndEvent) => void) | undefined;
    onSpeechError: ((event: SpeechErrorEvent) => void) | undefined;
    onSpeechResults: ((event: SpeechResultsEvent) => void) | undefined;
    onSpeechPartialResults: ((event: SpeechResultsEvent) => void) | undefined;
    onSpeechVolumeChanged: ((event: { value: number }) => void) | undefined;
    
    start: (locale: string) => Promise<void>;
    stop: () => Promise<void>;
    cancel: () => Promise<void>;
    destroy: () => Promise<void>;
    removeAllListeners: () => Promise<void>;
    isAvailable: () => Promise<boolean>;
    isRecognizing: () => Promise<boolean>;
    getSpeechRecognitionServices: () => Promise<string[]>;
  };

  export default Voice;
  export {
    SpeechRecognizedEvent,
    SpeechResultsEvent,
    SpeechErrorEvent,
    SpeechStartEvent,
    SpeechEndEvent,
  };
}

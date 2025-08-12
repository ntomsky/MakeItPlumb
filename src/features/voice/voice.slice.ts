import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DraftIntake } from '../../types/domain';
import { VoiceParsingResult } from '../../types/voice-intent';

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  partialTranscript: string;
  error: string | null;
  parsedResult: VoiceParsingResult | null; // Changed from parsedDraft
}

const initialState: VoiceState = {
  isRecording: false,
  isProcessing: false,
  transcript: '',
  partialTranscript: '',
  error: null,
  parsedResult: null, // Updated
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    startRecording: (state) => {
      state.isRecording = true;
      state.error = null;
      state.transcript = '';
      state.partialTranscript = '';
      state.parsedResult = null; // Updated
    },
    stopRecording: (state) => {
      state.isRecording = false;
    },
    setPartialTranscript: (state, action: PayloadAction<string>) => {
      state.partialTranscript = action.payload;
    },
    setFinalTranscript: (state, action: PayloadAction<string>) => {
      state.transcript = action.payload;
      state.partialTranscript = '';
    },
    startProcessing: (state) => {
      state.isProcessing = true;
      state.error = null;
    },
    setParsedResult: (state, action: PayloadAction<VoiceParsingResult>) => {
      state.parsedResult = action.payload; // Updated
      state.isProcessing = false;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isRecording = false;
      state.isProcessing = false;
    },
    reset: (state) => {
      return initialState;
    },
  },
});

export const {
  startRecording,
  stopRecording,
  setPartialTranscript,
  setFinalTranscript,
  startProcessing,
  setParsedResult, // Updated
  setError,
  reset,
} = voiceSlice.actions;

export default voiceSlice.reducer;

// Selectors
export const selectVoiceState = (state: { voice: VoiceState }) => state.voice;
export const selectIsRecording = (state: { voice: VoiceState }) => state.voice.isRecording;
export const selectIsProcessing = (state: { voice: VoiceState }) => state.voice.isProcessing;
export const selectTranscript = (state: { voice: VoiceState }) => state.voice.transcript;
export const selectPartialTranscript = (state: { voice: VoiceState }) => state.voice.partialTranscript;
export const selectParsedResult = (state: { voice: VoiceState }) => state.voice.parsedResult; // Updated

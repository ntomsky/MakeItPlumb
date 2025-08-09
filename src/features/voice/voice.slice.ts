import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DraftIntake } from '../../types/domain';

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  partialTranscript: string;
  error: string | null;
  parsedDraft: DraftIntake | null;
}

const initialState: VoiceState = {
  isRecording: false,
  isProcessing: false,
  transcript: '',
  partialTranscript: '',
  error: null,
  parsedDraft: null,
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
      state.parsedDraft = null;
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
    setParsedDraft: (state, action: PayloadAction<DraftIntake>) => {
      state.parsedDraft = action.payload;
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
  setParsedDraft,
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
export const selectParsedDraft = (state: { voice: VoiceState }) => state.voice.parsedDraft;

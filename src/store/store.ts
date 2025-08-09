import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { StorageService } from '../services/storage';
import customersSlice from '../features/customers/customers.slice';
import quotesSlice from '../features/quotes/quotes.slice';
import invoicesSlice from '../features/invoices/invoices.slice';
import voiceSlice from '../features/voice/voice.slice';
import settingsSlice from './settings.slice';

const persistConfig = {
  key: 'root',
  storage: StorageService.createReduxPersistStorage(),
  whitelist: ['customers', 'quotes', 'invoices', 'settings'], // Only persist these slices
  blacklist: ['voice'], // Don't persist voice state
};

const rootReducer = combineReducers({
  customers: customersSlice,
  quotes: quotesSlice,
  invoices: invoicesSlice,
  voice: voiceSlice,
  settings: settingsSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

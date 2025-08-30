import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authSlice from './slices/authSlice';
import incidentSlice from './slices/incidentSlice';
import userSlice from './slices/userSlice';
import appSlice from './slices/appSlice';
import offlineSlice from './slices/offlineSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'app'], // Only persist these reducers
  blacklist: ['incidents'], // Don't persist incidents (too much data)
};

const rootReducer = combineReducers({
  auth: authSlice,
  incidents: incidentSlice,
  user: userSlice,
  app: appSlice,
  offline: offlineSlice,
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

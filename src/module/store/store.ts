import { configureStore, combineReducers } from '@reduxjs/toolkit';
import cartReducer, { CartState } from '../slice/CartSlice';
import dummyReducer from '../slice/DummySlice';
import adminReducer from '../slice/AdminSlice';
import productReducer from '../slice/ProductSlice';
import authReducer, { AuthState } from '../slice/AuthSlice';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['cartReducer', 'authReducer'] // Only persist cart and auth state
};

const rootReducer = combineReducers({
    cartReducer,
    dummyReducer,
    adminReducer,
    productReducer,
    authReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);
export { store }; 
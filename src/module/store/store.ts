import { configureStore, combineReducers } from '@reduxjs/toolkit';
import cartReducer, { CartState } from '../slice/CartSlice';
import dummyReducer from '../slice/DummySlice';
import adminReducer from '../slice/AdminSlice';
import productReducer from '../slice/ProductSlice';
import authReducer, { AuthState } from '../slice/AuthSlice';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['cartReducer', 'productReducer', 'authReducer']
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
            serializableCheck: false,
        }),
});

export interface RootState {
    cartReducer: CartState;
    authReducer: AuthState;
    [key: string]: any; // For other reducers
}

export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);
export { store }; 
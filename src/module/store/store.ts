import { configureStore, combineReducers } from '@reduxjs/toolkit';
import cartReducer, { CartState } from '../slice/CartSlice';
import dummyReducer from '../slice/DummySlice';
import adminReducer from '../slice/AdminSlice';
import productReducer from '../slice/ProductSlice';
import authReducer, { AuthState } from '../slice/AuthSlice';
import favoritesReducer from '../slice/FavoritesSlice';
import orderReducer from '../slice/OrderSlice';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { userSlice } from '../slice/UserSlice';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['cartReducer', 'authReducer', 'favoritesReducer', 'user'] // Only persist cart, auth, favorites and user state
};

const rootReducer = combineReducers({
    cartReducer,
    dummyReducer,
    adminReducer,
    productReducer,
    authReducer,
    favoritesReducer,
    orderReducer,
    user: userSlice.reducer
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
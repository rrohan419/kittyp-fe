import { configureStore, combineReducers } from '@reduxjs/toolkit';
import '@/utils/authStorage';
import cartReducer from '../slice/CartSlice';
import dummyReducer from '../slice/DummySlice';
import adminReducer from '../slice/AdminSlice';
import productReducer from '../slice/ProductSlice';
import authReducer from '../slice/AuthSlice';
import favoritesReducer from '../slice/FavoritesSlice';
import orderReducer from '../slice/OrderSlice';
import adminProductReducer from '../slice/AdminProductSlice';
import schedulingReducer from '../slice/SchedulingSlice';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

try {
    const fromSession = sessionStorage.getItem('persist:root');
    if (fromSession && !localStorage.getItem('persist:root')) {
        localStorage.setItem('persist:root', fromSession);
    }
    sessionStorage.removeItem('persist:root');
} catch {
    /* ignore */
}

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['cartReducer', 'favoritesReducer'],
};

const rootReducer = combineReducers({
    cartReducer,
    dummyReducer,
    adminReducer,
    productReducer,
    authReducer,
    favoritesReducer,
    orderReducer,
    scheduling: schedulingReducer,
    adminProducts: adminProductReducer,
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

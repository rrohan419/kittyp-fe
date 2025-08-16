import { configureStore, combineReducers } from '@reduxjs/toolkit';
import cartReducer from '../slice/CartSlice';
import dummyReducer from '../slice/DummySlice';
import adminReducer from '../slice/AdminSlice';
import productReducer from '../slice/ProductSlice';
import authReducer from '../slice/AuthSlice';
import favoritesReducer from '../slice/FavoritesSlice';
import orderReducer from '../slice/OrderSlice';
import adminProductReducer from '../slice/AdminProductSlice';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
// import schedularReducer from '../slice/SchedulingSlice';
// import vetReducer from '../slice/VetSlice';


const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['cartReducer', 'authReducer', 'favoritesReducer'] // Removed 'user' since it's now part of authReducer
};

const rootReducer = combineReducers({
    cartReducer,
    dummyReducer,
    adminReducer,
    productReducer,
    authReducer,
    favoritesReducer,
    orderReducer,
    // schedular: schedularReducer,
    adminProducts: adminProductReducer,
    // vet: vetReducer,
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
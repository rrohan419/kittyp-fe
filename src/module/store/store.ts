import { configureStore, combineReducers } from '@reduxjs/toolkit';
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
// import schedularReducer from '../slice/SchedulingSlice';
// import vetReducer from '../slice/VetSlice';


const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['cartReducer', 'authReducer', 'favoritesReducer'],
    transforms: [
        {
            in: (inboundState: unknown, key: string) => {
                if (key !== 'authReducer' || !inboundState || typeof inboundState !== 'object') {
                    return inboundState;
                }
                const state = inboundState as { user?: { accessToken?: string } | null };
                if (state.user && 'accessToken' in state.user) {
                    const { accessToken: _omit, ...safeUser } = state.user;
                    return { ...state, user: safeUser };
                }
                return inboundState;
            },
            out: (outboundState: unknown) => outboundState,
        },
    ],
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
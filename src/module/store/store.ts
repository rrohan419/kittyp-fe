import { configureStore, combineReducers } from '@reduxjs/toolkit';
import cartReducer, { CartState } from '../slice/CartSlice';
import dummyReducer from '../slice/DummySlice';
import adminReducer from '../slice/AdminSlice';
import productReducer from '../slice/ProductSlice';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['cartReducer', 'productReducer']
};

const rootReducer = combineReducers({
    cartReducer,
    dummyReducer,
    adminReducer,
    productReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export { store }; 
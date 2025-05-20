import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import {
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
    persistStore,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { counterSlice } from "../slice/DummySlice";
import { userSlice } from "../slice/UserSlice";


const rootReducer = combineReducers({
    dummyReducer: counterSlice.reducer,
    userReducer: userSlice.reducer
});

const persistConfig: any = {
    key: "root",
    version: 1,
    storage: storage,
    whitelist: ["userAuth"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    devTools: true,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

let persistor = persistStore(store);
export { store, persistor };
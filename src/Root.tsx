import { Provider, useStore } from 'react-redux';
import { persistor, store } from './module/store';
import App from './App';
import { PersistGate } from 'redux-persist/integration/react';


const CustomRoot = () => {

    return (
        <Provider store={store}>
            <PersistGate loading={<>...Loading</>} persistor={persistor}></PersistGate>
            <App />
        </Provider>
    );
}

export default CustomRoot;


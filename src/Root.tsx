import { Provider } from 'react-redux';
import { persistor, store } from './module/store/store';
import App from './App';
import { PersistGate } from 'redux-persist/integration/react';
import Loading from '@/components/ui/loading';

const Root = () => {
    return (
        <Provider store={store}>
            <PersistGate loading={<Loading />} persistor={persistor}>
                <App />
            </PersistGate>
        </Provider>
    );
}

export default Root;


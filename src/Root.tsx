import { Provider } from 'react-redux';
import { persistor, store } from './module/store/store';
import { RouterProvider } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import Loading from '@/components/ui/loading';
import { router } from './router';

const Root = () => {
    return (
        <Provider store={store}>
            <PersistGate loading={<Loading />} persistor={persistor}>
                <RouterProvider router={router} />
            </PersistGate>
        </Provider>
    );
}

export default Root;


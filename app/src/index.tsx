// React
import React from 'react';
import * as ReactDOM from 'react-dom/client';

// Third party
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import App from './App';

// Contexts
import AuthProvider from './contexts/AuthProvider';
import ListTargetProvider from './contexts/ListTarget';

const root = ReactDOM.createRoot(document.getElementById('root') as Element);
const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

/**
 * AuthProvider is used here
 * as to give entirety of application access to its context
 * including the App component itself.
 */
root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ListTargetProvider>
                    <App />
                </ListTargetProvider>
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    </React.StrictMode>
);

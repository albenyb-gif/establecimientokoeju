import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Force clear all SW caches so new deployments are always visible immediately
if ('serviceWorker' in navigator) {
    // On every load: tell active SW to skip waiting
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => {
            // Force update check
            reg.update();
            if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        });
    });
    // Clear all old caches
    caches.keys().then(names => {
        names.forEach(name => {
            if (!name.includes('all-cache-v2')) {
                caches.delete(name);
                console.log('[SW] Cleared old cache:', name);
            }
        });
    });
}

registerSW({
    immediate: true,
    onNeedRefresh() { window.location.reload(); },
    onOfflineReady() { },
});

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 40, fontFamily: 'monospace' }}>
                    <h1 style={{ color: 'red' }}>Error de la Aplicación</h1>
                    <pre style={{ whiteSpace: 'pre-wrap', background: '#fee', padding: 20, borderRadius: 8 }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '10px 20px', background: '#333', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                        Recargar
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)

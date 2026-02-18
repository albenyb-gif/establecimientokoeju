import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

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

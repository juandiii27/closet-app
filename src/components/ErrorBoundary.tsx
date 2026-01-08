import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                        <p className="text-gray-500 mb-6">
                            We're sorry, but the application encountered an unexpected error.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg text-left mb-6 overflow-auto max-h-40">
                            <code className="text-xs text-red-600 font-mono">
                                {this.state.error?.message || 'Unknown error'}
                            </code>
                        </div>
                        <Button
                            className="w-full bg-black text-white hover:bg-gray-800"
                            onClick={() => window.location.reload()}
                        >
                            Reload Application
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

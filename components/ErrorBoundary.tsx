import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const errObj = JSON.parse(this.state.error?.message || "");
        if (errObj.error && errObj.error.includes("permission-denied")) {
          message = "You don't have permission to perform this action. Please try logging in again.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">System Alert</h2>
          <p className="text-gray-500 mb-8 max-w-xs">{message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

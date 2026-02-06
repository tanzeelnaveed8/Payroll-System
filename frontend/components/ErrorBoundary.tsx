"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; resetErrorBoundary: () => void }) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error reporting service (e.g., Sentry, LogRocket)
      // errorReportingService.logError(error, errorInfo);
    } else {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        // Support both function and ReactNode fallbacks
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error || new Error('Unknown error'),
            resetErrorBoundary: this.handleReset,
          });
        }
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Something went wrong</h1>
              <p className="text-sm text-[#64748B] mb-4">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-left">
                  <p className="text-xs font-mono text-red-800 break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="gradient"
                onClick={this.handleReset}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="border-slate-200"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

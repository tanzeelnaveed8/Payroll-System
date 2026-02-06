"use client";

import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface ErrorFallbackProps {
  /**
   * The error that occurred
   */
  error: Error;
  /**
   * Function to reset/retry the error
   */
  resetErrorBoundary: () => void;
  /**
   * Optional custom title
   */
  title?: string;
  /**
   * Optional custom message
   */
  message?: string;
  /**
   * Whether to show error details (useful for development)
   */
  showDetails?: boolean;
  /**
   * Optional action button label
   */
  actionLabel?: string;
  /**
   * Optional secondary action
   */
  onSecondaryAction?: () => void;
  /**
   * Optional secondary action label
   */
  secondaryActionLabel?: string;
}

/**
 * Reusable Error Fallback Component
 * 
 * Provides a consistent error UI across the application with:
 * - Clear error messaging
 * - Retry functionality
 * - Optional error details for debugging
 * - Enterprise-appropriate UX copy
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary
 *   FallbackComponent={({ error, resetErrorBoundary }) => (
 *     <ErrorFallback
 *       error={error}
 *       resetErrorBoundary={resetErrorBoundary}
 *       title="Failed to load dashboard"
 *       message="We encountered an issue while loading your dashboard data."
 *     />
 *   )}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export default function ErrorFallback({
  error,
  resetErrorBoundary,
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again or contact support if the problem persists.",
  showDetails = process.env.NODE_ENV === "development",
  actionLabel = "Try Again",
  onSecondaryAction,
  secondaryActionLabel = "Go Home",
}: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full border-2 border-red-200 bg-white shadow-lg">
        <CardContent className="p-8 text-center">
          {/* Error Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2">{title}</h2>
            <p className="text-sm text-[#64748B] mb-4">{message}</p>
          </div>

          {/* Error Details (Development Only) */}
          {showDetails && error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-xs font-semibold text-red-800 mb-2">Error Details:</p>
              <p className="text-xs font-mono text-red-700 break-all whitespace-pre-wrap">
                {error.message || error.toString()}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs font-mono text-red-600 overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="gradient"
              onClick={resetErrorBoundary}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              aria-label={actionLabel}
            >
              {actionLabel}
            </Button>
            {onSecondaryAction && (
              <Button
                variant="outline"
                onClick={onSecondaryAction}
                className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                aria-label={secondaryActionLabel}
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>

          {/* Support Information */}
          <p className="mt-6 text-xs text-[#64748B]">
            If this problem continues, please contact your system administrator or support team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

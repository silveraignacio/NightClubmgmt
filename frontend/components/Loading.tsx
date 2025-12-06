import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
      '2xl': 'h-16 w-16',
    },
    color: {
      primary: 'text-purple-600',
      secondary: 'text-gray-600',
      white: 'text-white',
      success: 'text-green-600',
      error: 'text-red-600',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'primary',
  },
});

interface SpinnerProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, 'color'>,
    VariantProps<typeof spinnerVariants> {}

/**
 * Loading Spinner Component
 * A reusable, accessible loading indicator
 */
const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, color, ...props }, ref) => (
    <svg
      ref={ref}
      className={cn(spinnerVariants({ size, color }), className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-busy="true"
      role="status"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
);

Spinner.displayName = 'Spinner';

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ isLoading, message, size = 'md', fullScreen = false }, ref) => {
    if (!isLoading) return null;

    const containerClasses = fullScreen
      ? 'fixed inset-0 z-50'
      : 'absolute inset-0';

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center bg-white/80 backdrop-blur-sm',
          containerClasses
        )}
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <div className="flex flex-col items-center gap-3">
          <Spinner
            size={size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg'}
            color="primary"
          />
          {message && (
            <p className="text-sm font-medium text-gray-600">{message}</p>
          )}
        </div>
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

// Skeleton component for content placeholders
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  height?: string;
  width?: string;
  circle?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    { className, count = 1, height = 'h-4', width = 'w-full', circle = false, ...props },
    ref
  ) => {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            ref={i === 0 ? ref : undefined}
            className={cn(
              'animate-pulse bg-gray-200 rounded',
              circle && 'rounded-full',
              height,
              width
            )}
          />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

// PageLoader component - full page loading
interface PageLoaderProps {
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => (
  <div
    className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
    role="status"
    aria-live="polite"
    aria-label="Page loading"
  >
    <div className="flex flex-col items-center gap-4">
      <Spinner size="xl" color="primary" />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

PageLoader.displayName = 'PageLoader';

export { Spinner, LoadingOverlay, Skeleton, PageLoader, spinnerVariants };
export type { SpinnerProps, LoadingOverlayProps, SkeletonProps, PageLoaderProps };

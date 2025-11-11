import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    value: number;
    period?: string;
  };
  color?: 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'pink';
  onClick?: () => void;
  actionLabel?: string;
  showActionArrow?: boolean;
  loading?: boolean;
  compact?: boolean;
  footer?: React.ReactNode;
}

const colorClasses = {
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    trend: 'text-purple-600',
    border: 'border-purple-200',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    trend: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    trend: 'text-green-600',
    border: 'border-green-200',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    trend: 'text-red-600',
    border: 'border-red-200',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    trend: 'text-orange-600',
    border: 'border-orange-200',
  },
  pink: {
    bg: 'bg-pink-50',
    icon: 'text-pink-600',
    trend: 'text-pink-600',
    border: 'border-pink-200',
  },
};

/**
 * StatsCard Component
 * KPI card for displaying dashboard statistics
 */
const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      title,
      value,
      description,
      icon,
      trend,
      color = 'purple',
      onClick,
      actionLabel,
      showActionArrow = true,
      loading = false,
      compact = false,
      footer,
    },
    ref
  ) => {
    const colors = colorClasses[color];
    const isClickable = !!onClick;

    return (
      <Card
        ref={ref}
        shadow="md"
        padding={compact ? 'md' : 'lg'}
        border="light"
        interactive={isClickable}
        onClick={onClick}
        className="overflow-hidden"
        role={isClickable ? 'button' : 'region'}
        aria-label={title}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onClick?.();
                }
              }
            : undefined
        }
      >
        <CardContent className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {value}
                </p>
              )}
            </div>

            {icon && (
              <div
                className={cn(
                  'p-3 rounded-lg',
                  colors.bg
                )}
              >
                <div className={cn('h-6 w-6', colors.icon)}>
                  {icon}
                </div>
              </div>
            )}
          </div>

          {/* Description or Trend */}
          {description || trend ? (
            <div className="space-y-2 text-sm">
              {description && (
                <p className="text-gray-600">{description}</p>
              )}

              {trend && (
                <div
                  className={cn(
                    'flex items-center gap-1 font-medium',
                    trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.direction === 'up' ? (
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>
                    {trend.direction === 'up' ? '+' : '-'}
                    {trend.value}%
                  </span>
                  {trend.period && (
                    <span className="text-gray-600 font-normal">
                      vs {trend.period}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Action or Footer */}
          {actionLabel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              className={cn(
                'flex items-center gap-1 text-sm font-medium transition-colors',
                colors.trend,
                'hover:opacity-80'
              )}
              aria-label={actionLabel}
            >
              {actionLabel}
              {showActionArrow && <ArrowRight className="h-3 w-3" />}
            </button>
          )}

          {footer && (
            <div className="text-xs text-gray-500 border-t border-gray-200 pt-3 mt-3">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

StatsCard.displayName = 'StatsCard';

// StatsGrid component for displaying multiple stats cards
interface StatsGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

const StatsGrid = React.forwardRef<HTMLDivElement, StatsGridProps>(
  ({ children, columns = 3, gap = 'md', className }, ref) => (
    <div
      ref={ref}
      className={cn(
        'grid',
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
      role="region"
      aria-label="Statistics grid"
    >
      {children}
    </div>
  )
);

StatsGrid.displayName = 'StatsGrid';

export { StatsCard, StatsGrid };
export type { StatsCardProps, StatsGridProps };

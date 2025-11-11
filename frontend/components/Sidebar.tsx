import React, { useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SidebarMenuItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: number | string;
  children?: SidebarMenuItem[];
  requiredRoles?: string[];
  onClick?: () => void;
}

interface SidebarProps {
  items: SidebarMenuItem[];
  currentRole?: string;
  activeHref?: string;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      items,
      currentRole,
      activeHref,
      isCollapsed = false,
      onCollapsedChange,
      header,
      footer,
      className,
    },
    ref
  ) => {
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpanded = (label: string) => {
      setExpandedItems((prev) =>
        prev.includes(label)
          ? prev.filter((item) => item !== label)
          : [...prev, label]
      );
    };

    const hasAccess = (item: SidebarMenuItem): boolean => {
      if (!item.requiredRoles || item.requiredRoles.length === 0) {
        return true;
      }
      return currentRole ? item.requiredRoles.includes(currentRole) : false;
    };

    const renderMenuItems = (menuItems: SidebarMenuItem[]) => {
      return menuItems
        .filter(hasAccess)
        .map((item, index) => (
          <div key={index}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors',
                    'text-gray-700 hover:bg-gray-100',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500'
                  )}
                  aria-expanded={expandedItems.includes(item.label)}
                  aria-haspopup="true"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {item.icon && (
                      <span className="h-5 w-5 flex-shrink-0">
                        {item.icon}
                      </span>
                    )}
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        expandedItems.includes(item.label) && 'rotate-180'
                      )}
                    />
                  )}
                </button>

                {expandedItems.includes(item.label) && !isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-4"
                  >
                    {renderMenuItems(item.children)}
                  </motion.div>
                )}
              </div>
            ) : (
              <a
                href={item.href || '#'}
                onClick={() => item.onClick?.()}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500',
                  activeHref === item.href
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                aria-current={activeHref === item.href ? 'page' : undefined}
              >
                {item.icon && (
                  <span className="h-5 w-5 flex-shrink-0">{item.icon}</span>
                )}
                {!isCollapsed && (
                  <span className="text-sm font-medium flex-1">
                    {item.label}
                  </span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </a>
            )}
          </div>
        ));
    };

    return (
      <aside
        ref={ref}
        className={cn(
          'bg-white border-r border-gray-200 transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-64',
          className
        )}
        role="navigation"
        aria-label="Sidebar navigation"
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between p-4 border-b border-gray-200',
            isCollapsed && 'justify-center'
          )}
        >
          {!isCollapsed && header && <div>{header}</div>}
          <button
            onClick={() => onCollapsedChange?.(!isCollapsed)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={cn(
                'h-5 w-5 text-gray-600 transition-transform',
                isCollapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {renderMenuItems(items)}
        </nav>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 p-4">
            {!isCollapsed && footer}
          </div>
        )}
      </aside>
    );
  }
);

Sidebar.displayName = 'Sidebar';

export { Sidebar };
export type { SidebarProps, SidebarMenuItem };

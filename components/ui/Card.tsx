/**
 * Card component
 */

'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', title, header, footer, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}
        {...props}
      >
        {(title || header) && (
          <div className="px-6 py-4 border-b border-gray-200">
            {header || <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';


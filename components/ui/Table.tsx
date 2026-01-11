/**
 * Table component
 */

'use client';

import { HTMLAttributes } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

export interface TableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = 'No data available',
  className = '',
  ...props
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`} {...props}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


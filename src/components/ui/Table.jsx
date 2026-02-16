import React from 'react'

/**
 * Универсальный компонент таблицы
 */
const Table = ({ columns, data, onRowClick, onCellClick, compact = false, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 transition-colors ${className}`}>
      <table className="w-full border-collapse table-auto text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`p-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.className || ''}`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/30`}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`p-3 text-gray-700 dark:text-gray-300 ${compact ? 'py-1.5' : ''} ${onCellClick ? 'cursor-pointer' : ''} ${col.cellClassName || ''}`}
                  onClick={(e) => {
                    if (onCellClick) {
                      e.stopPropagation()
                      onCellClick(row, col.key || colIdx)
                    }
                  }}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table

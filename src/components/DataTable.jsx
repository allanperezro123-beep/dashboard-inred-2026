import { useState } from 'react';
import { exportTableCsv, exportTableExcel } from '../lib/exporters';

export function DataTable({ title, subtitle, columns, rows, filePrefix, onRowClick, exportMeta = {}, emptyLabel = 'Sin registros para mostrar.' }) {
  const [tipCol, setTipCol] = useState(null);

  return (
    <section className="table-card">
      <div className="table-card__head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="table-card__actions">
          <button type="button" className="table-card__action-btn" onClick={() => exportTableCsv(filePrefix, columns, rows)}>CSV</button>
          <button type="button" className="table-card__action-btn" onClick={() => exportTableExcel(filePrefix, columns, rows, { title, subtitle, ...exportMeta })}>Excel</button>
        </div>
      </div>

      <div className="table-card__body">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.description ? { cursor: 'help', position: 'relative', whiteSpace: 'nowrap' } : undefined}
                  onMouseEnter={column.description ? () => setTipCol(column.key) : undefined}
                  onMouseLeave={column.description ? () => setTipCol(null) : undefined}
                >
                  {column.label}
                  {column.description && tipCol === column.key && (
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 6px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#0d2048',
                      color: '#c5d0e0',
                      border: '1px solid rgba(255,255,255,.12)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: '.72rem',
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                      zIndex: 200,
                      boxShadow: '0 4px 16px rgba(0,0,0,.4)',
                      pointerEvents: 'none',
                    }}>
                      {column.description}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr
                  key={row.ticketId || row.label || `${filePrefix}-${index}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'table-row--interactive' : ''}
                >
                  {columns.map((column) => (
                    <td key={column.key}>{column.render ? column.render(row) : (row[column.key] ?? 'Sin dato')}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="table-card__empty">{emptyLabel}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
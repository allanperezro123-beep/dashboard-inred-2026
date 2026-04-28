import { RefreshCw, SlidersHorizontal, Wifi } from './Icons';

import { FILTER_FIELDS, QUICK_FLAGS } from '../lib/analytics';

export function Sidebar({ view, onViewChange, filters, flags, context, onFilterChange, onFlagChange, onReset }) {
  const activeCount =
    Object.values(filters).filter(Boolean).length +
    Object.values(flags).filter(Boolean).length;

  return (
    <aside className="sidebar">
      {/* ── Brand ─────────────────────────────────── */}
      <div className="sidebar-brand">
        <img src="/logo-inred.png" alt="INRED" className="sidebar-logo" />
        <div className="sidebar-brand__sub">Gestión de tickets</div>
      </div>

      {/* ── Filters ───────────────────────────────── */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav__label">
          <SlidersHorizontal size={11} style={{ display: 'inline', marginRight: 5 }} />
          Filtros
          {activeCount > 0 && (
            <span style={{
              marginLeft: 8,
              background: 'var(--brand)',
              color: '#fff',
              fontSize: '.66rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 999,
            }}>
              {activeCount}
            </span>
          )}
        </div>

        {FILTER_FIELDS.map((field) => {
          if (field.kind === 'date') {
            return (
              <div key={field.key} className="field" style={{ padding: '0 10px', marginBottom: 8 }}>
                <label style={{ fontSize: '.72rem', fontWeight: 600, color: '#546380', marginBottom: 3, display: 'block' }}>
                  {field.label}
                </label>
                <input
                  type="date"
                  value={filters[field.key]}
                  onChange={(e) => onFilterChange(field.key, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid rgba(255,255,255,.08)',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,.04)',
                    color: '#c5d0e0',
                    fontSize: '.78rem',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>
            );
          }
          const options = context?.availableOptions?.[field.key] || [];
          return (
            <div key={field.key} className="field" style={{ padding: '0 10px', marginBottom: 8 }}>
              <label style={{ fontSize: '.72rem', fontWeight: 600, color: '#546380', marginBottom: 3, display: 'block' }}>
                {field.label}
              </label>
              <select
                value={filters[field.key]}
                onChange={(e) => onFilterChange(field.key, e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid rgba(255,255,255,.08)',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,.04)',
                  color: '#c5d0e0',
                  fontSize: '.78rem',
                  outline: 'none',
                }}
              >
                <option value="" style={{ background: '#0d2048' }}>Todos</option>
                {options.map((opt) => (
                  <option key={opt} value={opt} style={{ background: '#0d2048' }}>{opt}</option>
                ))}
              </select>
            </div>
          );
        })}

        {/* ── Quick flags ────────────────────────────── */}
        <div style={{ padding: '4px 10px' }}>
          {QUICK_FLAGS.map((flag) => (
            <label
              key={flag.key}
              className={`toggle${flags[flag.key] ? ' toggle--active' : ''}`}
            >
              <input
                type="checkbox"
                checked={flags[flag.key]}
                onChange={() => onFlagChange(flag.key)}
                className="toggle__input"
                aria-label={flag.label}
              />
              <span className="toggle-track" />
              <span>{flag.label}</span>
            </label>
          ))}
        </div>
      </nav>

      {/* ── Footer ────────────────────────────────── */}
      <div className="sidebar-footer">
        <button type="button" className="sidebar-item" onClick={onReset}>
          <RefreshCw size={16} />
          Limpiar filtros
          {activeCount > 0 && <span className="sidebar-item__badge">{activeCount}</span>}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px' }}>
          <Wifi size={14} color="#546380" />
          <span style={{ fontSize: '.72rem', color: '#546380' }}>Dashboard INRED v1.0</span>
        </div>
      </div>
    </aside>
  );
}

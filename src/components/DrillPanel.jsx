import { X } from './Icons';
import { badgeTone, formatDays, formatInteger } from '../lib/analytics';

export function DrillPanel({ drill, onTicketClick, onClose }) {
  if (!drill) return null;

  const { title, subtitle, tickets } = drill;
  const open = tickets.filter((t) => t.ticketState === 'Abierto').length;
  const withStop = tickets.filter((t) => (t.currentStopDays || 0) > 0);
  const avgStop =
    withStop.length
      ? withStop.reduce((s, t) => s + (t.currentStopDays || 0), 0) / withStop.length
      : null;
  const display = tickets.slice(0, 30);

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="drill-overlay" role="dialog" aria-modal="true" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="drill-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drill-panel__head">
          <div>
            <div className="drill-panel__title">{title}</div>
            {subtitle && <div className="drill-panel__sub">{subtitle}</div>}
          </div>
          <button className="drill-panel__close" type="button" onClick={onClose} aria-label="Cerrar panel">
            <X size={14} />
          </button>
        </div>

        <div className="drill-panel__stats">
          <span>
            <em>Total</em>
            <strong>{formatInteger(tickets.length)}</strong>
          </span>
          <span>
            <em>Abiertos</em>
            <strong>{formatInteger(open)}</strong>
          </span>
          <span>
            <em>Cerrados</em>
            <strong>{formatInteger(tickets.length - open)}</strong>
          </span>
          {avgStop !== null && (
            <span>
              <em>Parada prom.</em>
              <strong>{formatDays(avgStop)}</strong>
            </span>
          )}
        </div>

        <div className="drill-panel__list" role="list">
          {display.length === 0 && (
            <p className="drill-panel__empty">Sin tickets para este filtro.</p>
          )}
          {display.map((ticket) => (
            <button
              key={ticket.ticketId}
              type="button"
              className="drill-row"
              role="listitem"
              onClick={() => {
                onTicketClick(ticket.ticketId);
                onClose();
              }}
            >
              <span className="drill-row__id">#{ticket.ticketId}</span>
              <span className={`badge badge--${badgeTone(ticket.priority, 'priority')}`}>
                {ticket.priority || '—'}
              </span>
              <span className="drill-row__name">{ticket.assignee || 'Sin asignado'}</span>
              <span className="drill-row__state">{ticket.ticketState || '—'}</span>
              {(ticket.currentStopDays || 0) > 0 && (
                <span className="drill-row__stop">{formatDays(ticket.currentStopDays)}</span>
              )}
            </button>
          ))}
          {tickets.length > 30 && (
            <p className="drill-panel__more">+{tickets.length - 30} tickets más en la tabla inferior.</p>
          )}
        </div>
      </div>
    </div>
  );
}

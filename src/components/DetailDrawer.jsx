import { useEffect } from 'react';

import { badgeTone, formatDate, formatDateTime, formatDays, parseCommentThread } from '../lib/analytics';

// ── Comment-type palette ─────────────────────────────────────────────────────
const TIPO_PALETTE = {
  descripcion: { dot: '#3b82f6', bg: 'rgba(59,130,246,.1)',  border: 'rgba(59,130,246,.25)', label: '#93c5fd' },
  seguimiento: { dot: '#eab308', bg: 'rgba(234,179,8,.1)',   border: 'rgba(234,179,8,.28)',  label: '#fde047' },
  solucion:    { dot: '#10b981', bg: 'rgba(16,185,129,.1)',  border: 'rgba(16,185,129,.28)', label: '#6ee7b7' },
  default:     { dot: '#94a3b8', bg: 'rgba(148,163,184,.08)',border: 'rgba(148,163,184,.2)', label: '#94a3b8' },
};

function tipoPalette(tipo) {
  const t = (tipo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (t.includes('descripcion') || t.includes('apertura')) return TIPO_PALETTE.descripcion;
  if (t.includes('seguimiento') || t.includes('tracking'))  return TIPO_PALETTE.seguimiento;
  if (t.includes('solucion') || t.includes('cierre') || t.includes('resolucion')) return TIPO_PALETTE.solucion;
  return TIPO_PALETTE.default;
}

export function DetailDrawer({ ticket, onClose }) {
  useEffect(() => {
    if (!ticket) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ticket, onClose]);

  if (!ticket) {
    return null;
  }

  const thread = parseCommentThread(ticket.openingComment, ticket.resolutionComment);
  const stopDays = ticket.currentStopDays || ticket.stopDaysTotal || 0;
  const ageDays  = ticket.openAgeDays || ticket.closeDurationDays || 0;
  const assignee = ticket.assignee || ticket.technician || 'Sin asignar';
  const topic = ticket.textAnalytics?.primaryTopic || ticket.category || 'Sin clasificar';
  return (
    <aside className="detail-drawer">
      <div className="detail-drawer__backdrop" onClick={onClose} />
      <div className="detail-drawer__panel">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header className="detail-drawer__header">
          <div className="detail-drawer__title-block">
            <div className="detail-drawer__badges">
              <span className={`badge badge--${badgeTone(ticket.ticketState, 'state')}`}>{ticket.ticketState || 'Sin estado'}</span>
              <span className={`badge badge--${badgeTone(ticket.priority, 'priority')}`}>{ticket.priority || 'Sin prioridad'}</span>
              {stopDays > 0 && <span className="badge badge--warn">Parada {Number(stopDays).toFixed(1)} d</span>}
            </div>
            <h2>Ticket #{ticket.ticketId}</h2>
            <p className="detail-drawer__subtitle">
              {[ticket.department, ticket.municipality, ticket.locality].filter(Boolean).join(' · ') || 'Sin territorio'}
            </p>
          </div>
          <button type="button" className="detail-drawer__close" onClick={onClose} aria-label="Cerrar detalle">×</button>
        </header>

        {/* ── METRICS STRIP ──────────────────────────────────────────────── */}
        <div className="detail-metrics-strip">
          <Metric label="Días de parada" value={stopDays > 0 ? formatDays(stopDays) : '—'} highlight={stopDays > 7} />
          <Metric label="Tiempo total" value={ageDays > 0 ? formatDays(ageDays) : '—'} />
          <Metric label="Asignado a" value={assignee} />
          <Metric label="Tema detectado" value={topic} />
        </div>

        {/* ── INFO: LOCALIZACIÓN + TRAZABILIDAD ─────────────────────────── */}
        <section className="detail-section">
          <div className="detail-section__heading"><h3>Información del caso</h3></div>
          <div className="detail-info-cols">
            <div className="detail-info-block">
              <div className="detail-info-block__title">Localización</div>
              <InfoRow label="Departamento"      value={ticket.department} />
              <InfoRow label="Municipio"         value={ticket.municipality} />
              <InfoRow label="Centro poblado"    value={ticket.locality} />
              <InfoRow label="Proyecto"          value={ticket.project} />
              <InfoRow label="Sub proyecto"      value={ticket.subProject} />
              <InfoRow label="Categoría"         value={ticket.category} />
              <InfoRow label="Grupo escalamiento" value={ticket.escalationGroup} />
              <InfoRow label="Fuente origen"     value={ticket.sourceOrigin} />
            </div>
            <div className="detail-info-block">
              <div className="detail-info-block__title">Trazabilidad temporal</div>
              <InfoRow label="Inicio ticket"  value={formatDateTime(ticket.ticketStart)} />
              <InfoRow label="Cierre ticket"  value={formatDateTime(ticket.ticketEnd)} />
              <InfoRow label="Inicio parada"  value={formatDateTime(ticket.currentStopStart)} />
              <InfoRow label="Fin parada"     value={formatDateTime(ticket.currentStopEnd)} />
              <InfoRow label="Días parada"    value={stopDays > 0 ? formatDays(stopDays) : '—'} />
              <InfoRow label="Días abierto"   value={ageDays  > 0 ? formatDays(ageDays)  : '—'} />
            </div>
          </div>
        </section>

        {/* ── COMMENT TIMELINE ───────────────────────────────────────────── */}
        <section className="detail-section">
          <div className="detail-section__heading">
            <h3>Historial de seguimiento</h3>
            <span className="detail-section__count">{thread.length} {thread.length === 1 ? 'entrada' : 'entradas'}</span>
          </div>
          {thread.length === 0 ? (
            <p className="detail-empty">Sin comentarios registrados para este ticket.</p>
          ) : (
            <ol className="detail-timeline">
              {thread.map((entry, idx) => {
                const pal = tipoPalette(entry.tipo);
                return (
                  <li
                    key={idx}
                    className="detail-timeline__entry"
                    style={{ '--entry-dot': pal.dot, '--entry-bg': pal.bg, '--entry-border': pal.border }}
                  >
                    <div className="detail-timeline__spine">
                      <span className="detail-timeline__dot" />
                      {idx < thread.length - 1 && <span className="detail-timeline__line" />}
                    </div>
                    <div className="detail-timeline__body">
                      <div className="detail-timeline__meta">
                        <span
                          className="detail-timeline__tipo"
                          style={{ color: pal.label, background: pal.bg, border: `1px solid ${pal.border}` }}
                        >{entry.tipo}</span>
                        {entry.fecha && (
                          <time className="detail-timeline__date">
                            {formatDateTime(entry.fecha)}
                          </time>
                        )}
                      </div>
                      <p className="detail-timeline__text">{entry.texto}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

      </div>
    </aside>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div className={`metric-tile${highlight ? ' metric-tile--warn' : ''}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="detail-info-row">
      <span className="detail-info-row__label">{label}</span>
      <span className="detail-info-row__value">{value || '—'}</span>
    </div>
  );
}
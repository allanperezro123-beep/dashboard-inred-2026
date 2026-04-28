import { useMemo, useState } from 'react';
import { 
  X, User, TrendingUp, Target, Clock, AlertCircle, FolderOpen, 
  Activity, Award, BarChart2, Bell, CheckCircle, Shield, 
  MessageSquare, AlertTriangle, Briefcase, Zap
} from './Icons';

const PERIODS = [
  { label: '6h',   days: 6 / 24  },
  { label: '12h',  days: 12 / 24 },
  { label: '1d',   days: 1       },
  { label: '3d',   days: 3       },
  { label: '7 d',  days: 7       },
  { label: '14 d', days: 14      },
  { label: '30 d', days: 30      },
  { label: '60 d', days: 60      },
  { label: '90 d', days: 90      },
  { label: 'Todo', days: 0       },
];

function fmtNum(n) {
  if (n == null || !isFinite(n)) return '—';
  return Number.isInteger(n) ? n.toLocaleString('es-CO') : n.toFixed(1);
}
function fmtDays(v) {
  if (!v || !isFinite(v) || v === 0) return '—';
  if (v < 1) return `${Math.round(v * 24)}h`;
  return `${v % 1 === 0 ? v : v.toFixed(1)}d`;
}
function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function buildChartData(tickets, periodDays) {
  if (!tickets.length) return { labels: [], opened: [], closed: [], cancelled: [], peak: 1 };

  if (periodDays > 0 && periodDays < 1) {
    const cutoffMs = Date.now() - periodDays * 86400000;
    const hourMap = {};
    tickets.forEach((t) => {
      const dateStr = t.ticketStart || t.referenceDate || '';
      if (!dateStr) return;
      const ts = new Date(dateStr).getTime();
      if (!isFinite(ts) || ts < cutoffMs) return;
      const dt = new Date(ts);
      const key = `${String(dt.getHours()).padStart(2, '0')}:00`;
      if (!hourMap[key]) hourMap[key] = { opened: 0, closed: 0, cancelled: 0 };
      hourMap[key].opened += 1;
      if (t.ticketState === 'Cerrado') hourMap[key].closed += 1;
      if (t.ticketState === 'Anulado') hourMap[key].cancelled += 1;
    });
    const sortedKeys = Object.keys(hourMap).sort();
    if (!sortedKeys.length) return { labels: [], opened: [], closed: [], cancelled: [], peak: 1 };
    const opened    = sortedKeys.map((k) => hourMap[k].opened);
    const closed    = sortedKeys.map((k) => hourMap[k].closed);
    const cancelled = sortedKeys.map((k) => hourMap[k].cancelled);
    return { labels: sortedKeys, opened, closed, cancelled, peak: Math.max(...opened, ...closed, ...cancelled, 1) };
  }

  const cutoff = periodDays > 0
    ? new Date(Date.now() - periodDays * 86400000).toISOString().slice(0, 10)
    : '2000-01-01';
  const dayMap = {};
  tickets.forEach((t) => {
    const day = (t.ticketStart || t.referenceDate || '').slice(0, 10);
    if (!day || day < cutoff) return;
    if (!dayMap[day]) dayMap[day] = { opened: 0, closed: 0, cancelled: 0 };
    dayMap[day].opened += 1;
    if (t.ticketState === 'Cerrado')  dayMap[day].closed   += 1;
    if (t.ticketState === 'Anulado')  dayMap[day].cancelled += 1;
  });
  const sortedDays = Object.keys(dayMap).sort();
  if (!sortedDays.length) return { labels: [], opened: [], closed: [], cancelled: [], peak: 1 };

  let labels, opened, closed, cancelled;
  const span = sortedDays.length;
  if (span <= 60) {
    labels    = sortedDays.map((d) => { const [,m,dy] = d.split('-'); return `${dy}/${m}`; });
    opened    = sortedDays.map((d) => dayMap[d].opened);
    closed    = sortedDays.map((d) => dayMap[d].closed);
    cancelled = sortedDays.map((d) => dayMap[d].cancelled);
  } else {
    const bucketFn = span <= 180
      ? (d) => { const dt = new Date(d); const s = new Date(dt); s.setDate(dt.getDate() - dt.getDay()); return s.toISOString().slice(0, 10); }
      : (d) => d.slice(0, 7);
    const bMap = {};
    sortedDays.forEach((d) => {
      const k = bucketFn(d);
      if (!bMap[k]) bMap[k] = { opened: 0, closed: 0, cancelled: 0 };
      bMap[k].opened    += dayMap[d].opened;
      bMap[k].closed    += dayMap[d].closed;
      bMap[k].cancelled += dayMap[d].cancelled;
    });
    const bks = Object.keys(bMap).sort();
    labels = bks.map((k) => {
      if (k.length === 7) {
        const [y, mo] = k.split('-');
        return new Date(+y, +mo - 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
      }
      const [,m,dy] = k.split('-'); return `${dy}/${m}`;
    });
    opened    = bks.map((k) => bMap[k].opened);
    closed    = bks.map((k) => bMap[k].closed);
    cancelled = bks.map((k) => bMap[k].cancelled);
  }
  const peak = Math.max(...opened, ...closed, ...cancelled, 1);
  return { labels, opened, closed, cancelled, peak };
}

function smoothPath(xs, ys, asArea, baseY) {
  if (xs.length < 2) return '';
  const pts = xs.map((x, i) => [x, ys[i]]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  if (asArea) {
    d += ` L ${pts[pts.length - 1][0]} ${baseY} L ${pts[0][0]} ${baseY} Z`;
  }
  return d;
}

export function OperatorModal({ operator, tickets, onClose }) {
  const [periodDays, setPeriodDays] = useState(30);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  
  const opTickets = useMemo(() => {
    if (!operator || !tickets) return [];
    const idSet = new Set(operator.touchedIds || []);
    return tickets.filter((t) => idSet.has(t.ticketId));
  }, [operator, tickets]);

  const filteredTickets = useMemo(() => {
    if (!periodDays) return opTickets;
    if (periodDays < 1) {
      const cutoffMs = Date.now() - periodDays * 86400000;
      return opTickets.filter((t) => {
        const start = t.ticketStart || t.referenceDate || '';
        if (!start) return false;
        const ts = new Date(start).getTime();
        return isFinite(ts) && ts >= cutoffMs;
      });
    }
    const cutoff = new Date(Date.now() - periodDays * 86400000).toISOString().slice(0, 10);
    return opTickets.filter((t) => (t.ticketStart || t.referenceDate || '') >= cutoff);
  }, [opTickets, periodDays]);

  const stats = useMemo(() => {
    const open      = filteredTickets.filter((t) => t.ticketState === 'Abierto').length;
    const closed    = filteredTickets.filter((t) => t.ticketState === 'Cerrado').length;
    const cancelled = filteredTickets.filter((t) => t.ticketState === 'Anulado').length;
    const highPri   = filteredTickets.filter((t) => t.priority === 'Alta').length;
    const withStop  = filteredTickets.filter((t) => (t.currentStopDays || 0) > 0);
    const avgStop   = withStop.length ? withStop.reduce((a, b) => a + (b.currentStopDays || 0), 0) / withStop.length : 0;
    const closedMttr = filteredTickets.filter((t) => t.ticketState === 'Cerrado' && (t.closeDurationDays || 0) > 0);
    const avgMttr   = closedMttr.length ? closedMttr.reduce((a, b) => a + b.closeDurationDays, 0) / closedMttr.length : 0;
    return { open, closed, cancelled, highPri, avgStop, avgMttr, total: filteredTickets.length };
  }, [filteredTickets]);

  const chartData = useMemo(() => buildChartData(opTickets, periodDays), [opTickets, periodDays]);

  if (!operator) return null;

  const initials = (operator.name || 'OP')
    .split(' ')
    .slice(0, 2)
    .map((w) => (w && w[0]) || '')
    .join('')
    .toUpperCase() || 'OP';

  // SVG chart geometry
  const SVG_W = 840, SVG_H = 260;
  const PAD_L = 40, PAD_R = 20, PAD_T = 20, PAD_B = 30;
  const CW = SVG_W - PAD_L - PAD_R;
  const CH = SVG_H - PAD_T - PAD_B;
  const n  = chartData.labels.length;
  const xOf = (i) => n > 1 ? PAD_L + (CW / (n - 1)) * i : PAD_L + CW / 2;
  const yOf = (v) => PAD_T + CH - (chartData.peak ? Math.max(0, (v / chartData.peak) * CH) : 0);
  const baseY = PAD_T + CH;

  const xs   = chartData.labels.map((_, i) => xOf(i));
  const ysO  = chartData.opened.map(yOf);
  const ysC  = chartData.closed.map(yOf);
  const ysA  = chartData.cancelled.map(yOf);

  const yTicks  = [0, 0.5, 1].map((f) => Math.round(f * chartData.peak));
  const lblStep = Math.ceil(n / 10);

  const roles = [
    { label: 'Tickets Liderados',    value: operator.assigned    || 0, color: '#3b82f6', icon: <Briefcase size={12}/> },
    { label: 'Apertura Incidencias', value: operator.created     || 0, color: '#22c55e', icon: <Activity size={12}/> },
    { label: 'Cierre Incidencias',   value: operator.closed      || 0, color: '#a78bfa', icon: <CheckCircle size={12}/> },
    { label: 'Supervisión Técnica',  value: operator.responsible || 0, color: '#f59e0b', icon: <Shield size={12}/> },
  ];
  const maxRole = Math.max(...roles.map((r) => r.value), 1);

  const formatHour = (h) => `${String(h).padStart(2, '0')}:00`;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2,8,23,.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0a1229', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, width: '100%', maxWidth: 960, maxHeight: '94vh', overflow: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,.8)', padding: '24px', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.05)', border: 'none', borderRadius: 8, padding: '8px', color: '#64748b', cursor: 'pointer', display: 'flex' }}
          title="Cerrar">
          <X size={18} />
        </button>

        {/* ── Header Profesional ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, color: '#fff', boxShadow: '0 8px 20px rgba(59,130,246,.3)' }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{operator.name}</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: '.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FolderOpen size={12} /> {operator.topProject || 'Sin proyecto dominante'}
              </span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#334155' }} />
              <span style={{ fontSize: '.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Última actividad: {fmtDate(operator.lastActivity)}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', background: 'rgba(59,130,246,.1)', padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(59,130,246,.2)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3b82f6', lineHeight: 1 }}>{fmtNum(operator.totalTouched)}</div>
            <div style={{ fontSize: '.65rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>Gestión Total</div>
          </div>
        </div>

        {/* ── Selectores y Resumen ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIODS.map((opt) => (
              <button key={opt.label} type="button" onClick={() => setPeriodDays(opt.days)}
                style={{ padding: '5px 14px', borderRadius: 10, border: '1px solid', borderColor: periodDays === opt.days ? '#3b82f6' : 'rgba(255,255,255,.1)', background: periodDays === opt.days ? 'rgba(59,130,246,.15)' : 'transparent', color: periodDays === opt.days ? '#93c5fd' : '#94a3b8', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '.75rem', color: '#64748b', fontWeight: 500 }}>
            Análisis de <strong style={{ color: '#e2e8f0' }}>{stats.total} gestiones</strong> en el período seleccionado
          </div>
        </div>

        {/* ── KPIs Formales ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Backlog Pendiente', value: stats.open, color: '#3b82f6', icon: <AlertCircle size={16} /> },
            { label: 'Gestiones Finalizadas', value: stats.closed, color: '#22c55e', icon: <CheckCircle size={16} /> },
            { label: 'Trámites Anulados', value: stats.cancelled, color: '#f59e0b', icon: <X size={16} /> },
            { label: 'Prioridad Crítica', value: stats.highPri, color: '#ef4444', icon: <AlertTriangle size={16} /> },
            { label: 'Parada Promedio', value: fmtDays(stats.avgStop), color: '#a78bfa', icon: <Clock size={16} />, isText: true },
            { label: 'Eficiencia (MTTR)', value: fmtDays(stats.avgMttr), color: '#06b6d4', icon: <Zap size={16} />, isText: true },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: '16px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'transform .2s' }}>
              <div style={{ color: kpi.color, background: `${kpi.color}15`, padding: 8, borderRadius: 10 }}>{kpi.icon}</div>
              <div style={{ fontSize: kpi.isText ? '1rem' : '1.4rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>{kpi.isText ? kpi.value : fmtNum(kpi.value)}</div>
              <div style={{ fontSize: '.62rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.03em' }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ── Gráfica Principal de Tendencia ── */}
        <div style={{ background: 'rgba(15,23,42,.4)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: '20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#f1f5f9' }}>Tendencia de Actividad Operativa</span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[['#3b82f6', 'Participación'], ['#22c55e', 'Finalizados']].map(([clr, lbl]) => (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: clr }} />
                  <span style={{ fontSize: '.7rem', color: '#94a3b8' }}>{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: SVG_H }}>
            {n === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', fontSize: '.85rem' }}>Sin registros suficientes en este rango</div>
            ) : (
              <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const svgX  = ((e.clientX - rect.left) / rect.width) * SVG_W;
                  const step  = CW / (n - 1);
                  const idx   = Math.round((svgX - PAD_L) / step);
                  setHoveredIdx(Math.max(0, Math.min(n - 1, idx)));
                }}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <defs>
                  <linearGradient id="gradO" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {yTicks.map((tick) => (
                  <g key={tick}>
                    <line x1={PAD_L} x2={SVG_W - PAD_R} y1={yOf(tick)} y2={yOf(tick)} stroke="rgba(255,255,255,.05)" />
                    <text x={PAD_L - 8} y={yOf(tick) + 4} textAnchor="end" fontSize="10" fill="#475569">{tick}</text>
                  </g>
                ))}
                <path d={smoothPath(xs, ysO, true, baseY)} fill="url(#gradO)" />
                <path d={smoothPath(xs, ysO, false, baseY)} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                <path d={smoothPath(xs, ysC, false, baseY)} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" />
                
                {hoveredIdx !== null && (
                  <g>
                    <line x1={xs[hoveredIdx]} x2={xs[hoveredIdx]} y1={PAD_T} y2={baseY} stroke="rgba(255,255,255,.2)" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx={xs[hoveredIdx]} cy={ysO[hoveredIdx]} r={5} fill="#3b82f6" stroke="#0a1229" strokeWidth="2" />
                    <rect x={xs[hoveredIdx] > SVG_W/2 ? xs[hoveredIdx]-130 : xs[hoveredIdx]+10} y={PAD_T} width="120" height="50" rx="8" fill="#0f172a" stroke="rgba(255,255,255,.1)" />
                    <text x={xs[hoveredIdx] > SVG_W/2 ? xs[hoveredIdx]-122 : xs[hoveredIdx]+18} y={PAD_T+18} fontSize="11" fill="#fff" fontWeight="700">{chartData.labels[hoveredIdx]}</text>
                    <text x={xs[hoveredIdx] > SVG_W/2 ? xs[hoveredIdx]-122 : xs[hoveredIdx]+18} y={PAD_T+38} fontSize="10" fill="#93c5fd">Gestión: {chartData.opened[hoveredIdx]}</text>
                  </g>
                )}
              </svg>
            )}
          </div>
        </div>

        {/* ── Nuevas Gráficas: Últimas 24h y Pico Horario ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
          
          {/* Actividad Reciente (24h) */}
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: '18px' }}>
            <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} style={{ color: '#06b6d4' }} /> Flujo de Actividad (Últimas 24h)
            </div>
            {(() => {
              const recentHours = operator.recentHours || Array(24).fill(0);
              const maxRecentVal = Math.max(...recentHours, 1);
              return (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
                  {recentHours.map((val, i) => {
                    const h = (val / maxRecentVal) * 100;
                    return (
                      <div key={i} style={{ flex: 1, background: val > 0 ? '#06b6d4' : 'rgba(255,255,255,.05)', height: `${Math.max(h, 4)}%`, borderRadius: '2px 2px 0 0' }} title={`${23-i}h atrás: ${val} gestiones`} />
                    );
                  })}
                </div>
              );
            })()}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '.6rem', color: '#475569' }}>
              <span>-24h</span>
              <span>-12h</span>
              <span>Ahora</span>
            </div>
          </div>

          {/* Distribución por Hora (Pico) */}
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: '18px' }}>
            <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={14} style={{ color: '#f59e0b' }} /> Perfil Horario (Pico: {operator.peakHour ? formatHour(operator.peakHour.hour) : '—'})
            </div>
            {(() => {
              const hourly = operator.hourly || Array(24).fill(0);
              const maxHourlyVal = Math.max(...hourly, 1);
              return (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
                  {hourly.map((val, i) => {
                    const h = (val / maxHourlyVal) * 100;
                    const isPeak = operator.peakHour?.hour === i;
                    return (
                      <div key={i} style={{ flex: 1, background: isPeak ? '#f59e0b' : 'rgba(245,158,11,.2)', height: `${Math.max(h, 4)}%`, borderRadius: '2px 2px 0 0' }} title={`${i}:00: ${val} acumulados`} />
                    );
                  })}
                </div>
              );
            })()}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '.6rem', color: '#475569' }}>
              <span>00:00</span>
              <span>12:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>

        {/* ── Desglose por Rol y Trazabilidad ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: '18px' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#475569', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Gestión Operativa por Rol
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {roles.map((r) => (
                <div key={r.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: 6 }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>{r.icon} {r.label}</span>
                    <span style={{ fontWeight: 800, color: r.color }}>{fmtNum(r.value)}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((r.value/maxRole)*100)}%`, background: r.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16, padding: '18px' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#475569', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Trazabilidad de Seguimiento
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Registros Seguimiento', value: operator.followUpCount, color: '#06b6d4', icon: <Bell size={14}/> },
                { label: 'Observaciones Totales', value: operator.commentCount, color: '#94a3b8', icon: <MessageSquare size={14}/> },
                { label: 'Asignaciones Activas', value: stats.open, color: '#3b82f6', icon: <Target size={14}/> },
                { label: 'Críticos (Alta Prior.)', value: operator.highPri, color: '#ef4444', icon: <AlertTriangle size={14}/> },
              ].map((m) => (
                <div key={m.label} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '12px', border: '1px solid rgba(255,255,255,.03)' }}>
                  <div style={{ color: m.color, marginBottom: 4 }}>{m.icon}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>{fmtNum(m.value)}</div>
                  <div style={{ fontSize: '.6rem', color: '#475569', fontWeight: 600, marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { formatCompactNumber, formatDays, formatInteger, formatPercent } from '../lib/analytics';

const WIDTH = 900;
const HEIGHT = 620;

function EmptyState({ label }) {
  return (
    <div className="chart-card" style={{ display: 'grid', placeItems: 'center', minHeight: 80, opacity: 0.55 }}>
      <span style={{ fontSize: '.85rem', color: 'var(--text-muted, #64748b)' }}>{label}</span>
    </div>
  );
}

export function LineChart({ chart, emptyLabel = 'Sin serie disponible.' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [hidden, setHidden] = useState(new Set());

  const values = chart?.series?.flatMap((series) => series.values || []) || [];
  const maxValue = Math.max(...values, 0);

  if (!chart?.labels?.length || !chart.series?.length || maxValue === 0) {
    return <EmptyState label={emptyLabel} />;
  }

  const stepX = chart.labels.length > 1 ? 760 / (chart.labels.length - 1) : 760;

  const toggleSeries = (name) =>
    setHidden((prev) => {
      const next = new Set(prev);
      // keep at least one visible
      if (next.has(name)) { next.delete(name); }
      else if (next.size < chart.series.length - 1) { next.add(name); }
      return next;
    });

  const pointsFor = (series) =>
    series.values
      .map((value, index) => {
        const x = 52 + stepX * index;
        const y = 230 - (value / maxValue) * 180;
        return `${x},${y}`;
      })
      .join(' ');

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 860;
    const idx = Math.max(0, Math.min(chart.labels.length - 1, Math.round((svgX - 52) / stepX)));
    setHoveredIdx(idx);
  };

  const tooltipLeft = hoveredIdx !== null
    ? `clamp(4px, calc(${((52 + stepX * hoveredIdx) / 860) * 100}% - 64px), calc(100% - 134px))`
    : '0';

  return (
    <div className="chart-card line-chart">
      <svg
        viewBox="0 0 860 270"
        role="img"
        aria-label="Serie temporal"
        style={{ cursor: 'crosshair', userSelect: 'none' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {[0, 1, 2, 3].map((tick) => {
          const y = 40 + tick * 45;
          const tickValue = Math.round(maxValue - (maxValue / 4) * tick);
          return (
            <g key={tick}>
              <line x1="52" x2="820" y1={y} y2={y} className="grid-line" />
              <text x="8" y={y + 4} className="axis-label">
                {formatCompactNumber(tickValue)}
              </text>
            </g>
          );
        })}

        {chart.series.map((series) => (
          <g key={series.name} style={{ opacity: hidden.has(series.name) ? 0.12 : 1, transition: 'opacity .25s' }}>
            <polyline points={pointsFor(series)} className="line-chart__line" style={{ '--line-color': series.color }} />
            {!hidden.has(series.name) && series.values.map((value, index) => {
              const x = 52 + stepX * index;
              const y = 230 - (value / maxValue) * 180;
              const isHov = hoveredIdx === index;
              return (
                <circle
                  key={`${series.name}-${index}`}
                  cx={x} cy={y}
                  r={isHov ? 6 : 3.5}
                  fill={series.color}
                  style={{ transition: 'r .12s ease' }}
                  aria-label={`${series.name} · ${chart.labels[index]}: ${formatCompactNumber(value)}`}
                />
              );
            })}
          </g>
        ))}

        {hoveredIdx !== null && (
          <line
            x1={52 + stepX * hoveredIdx} x2={52 + stepX * hoveredIdx}
            y1={30} y2={242}
            stroke="rgba(255,255,255,.15)" strokeWidth="1" strokeDasharray="4 3"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {chart.labels.map((label, index) => (
          <text
            key={label}
            x={52 + stepX * index}
            y="260"
            className="axis-label axis-label--center"
            style={hoveredIdx === index ? { fill: '#fff', fontWeight: 700 } : undefined}
          >
            {label}
          </text>
        ))}
      </svg>

      {hoveredIdx !== null && (
        <div className="line-chart__tooltip" style={{ left: tooltipLeft }}>
          <strong>{chart.labels[hoveredIdx]}</strong>
          {chart.series.filter((s) => !hidden.has(s.name)).map((s) => (
            <span key={s.name}>
              <i style={{ background: s.color }} />
              {s.name}: {formatCompactNumber(s.values[hoveredIdx])}
            </span>
          ))}
        </div>
      )}

      <div className="chart-card__legend">
        {chart.series.map((series) => (
          <button
            key={series.name}
            type="button"
            className={`legend-pill${hidden.has(series.name) ? ' legend-pill--off' : ''}`}
            onClick={() => toggleSeries(series.name)}
            title={hidden.has(series.name) ? 'Mostrar serie' : 'Ocultar serie'}
          >
            <i style={{ background: hidden.has(series.name) ? 'var(--muted)' : series.color }} />
            {series.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StackedRows({ rows, emptyLabel = 'Sin distribución para mostrar.', onSegmentClick }) {
  const [tooltip, setTooltip] = useState(null);
  const maxTotal = Math.max(...rows.map((row) => row.total), 0);
  if (!rows?.length || maxTotal === 0) {
    return <EmptyState label={emptyLabel} />;
  }

  return (
    <div className="chart-card stacked-rows" style={{ position: 'relative' }}>
      {rows.map((row) => (
        <div key={row.label} className="stacked-rows__row">
          <div>
            <div className="stacked-rows__label">{row.label}</div>
            <div className="stacked-rows__meta">{formatInteger(row.total)} tickets</div>
          </div>
          <div className="stacked-rows__track">
            {row.segments.map((segment) => {
              const pct = row.total ? Math.round((segment.value / row.total) * 100) : 0;
              const width = row.total ? `${(segment.value / row.total) * 100}%` : '0%';
              return segment.value ? (
                <div
                  key={`${row.label}-${segment.label}`}
                  className="stacked-rows__segment"
                  style={{ width, '--segment-color': segment.color, cursor: onSegmentClick ? 'pointer' : 'default' }}
                  onMouseEnter={() => setTooltip({ row: row.label, label: segment.label, value: segment.value, pct, color: segment.color })}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={onSegmentClick ? () => onSegmentClick({ rowLabel: row.label, segmentLabel: segment.label }) : undefined}
                  aria-label={`${row.label} · ${segment.label}: ${formatInteger(segment.value)}`}
                />
              ) : null;
            })}
          </div>
        </div>
      ))}
      {tooltip && (
        <div className="stacked-rows__tooltip">
          <strong>{tooltip.row}</strong>
          <span><i style={{ background: tooltip.color }} />{tooltip.label}: {formatInteger(tooltip.value)} ({tooltip.pct}%)</span>
        </div>
      )}
    </div>
  );
}

export function BarList({ items, formatter = formatInteger, emptyLabel = 'Sin datos disponibles.', tone = 'default', onItemClick }) {
  const [hovered, setHovered] = useState(null);
  const maxValue = Math.max(...items.map((item) => item.value), 0);
  if (!items?.length || maxValue === 0) {
    return <EmptyState label={emptyLabel} />;
  }

  return (
    <div className={`chart-card bar-list bar-list--${tone}${onItemClick ? ' bar-list--clickable' : ''}`}>
      {items.map((item, i) => {
        const pct = maxValue ? (item.value / maxValue) * 100 : 0;
        const isHov = hovered === item.label;
        return (
          <div
            key={item.label}
            className={`bar-list__row${isHov ? ' bar-list__row--hov' : ''}`}
            onMouseEnter={() => setHovered(item.label)}
            onMouseLeave={() => setHovered(null)}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
            role={onItemClick ? 'button' : undefined}
            tabIndex={onItemClick ? 0 : undefined}
            onKeyDown={onItemClick ? (e) => e.key === 'Enter' && onItemClick(item) : undefined}
          >
            <div className="bar-list__labels">
              <span>{item.label}</span>
              {item.meta && <small>{item.meta}</small>}
            </div>
            <div className="bar-list__track">
              <div className="bar-list__fill" style={{ width: `${pct}%`, animationDelay: `${i * 55}ms` }} />
              {isHov && <span className="bar-list__pct">{Math.round(pct)}%</span>}
            </div>
            <div className="bar-list__value">{formatter(item.value)}</div>
          </div>
        );
      })}
    </div>
  );
}

export function Histogram({ items, emptyLabel = 'Sin distribución disponible.', onItemClick }) {
  const [hovered, setHovered] = useState(null);
  const maxValue = Math.max(...items.map((item) => item.value), 0);
  if (!items?.length || maxValue === 0) {
    return <EmptyState label={emptyLabel} />;
  }

  return (
    <div className="chart-card histogram">
      {items.map((item, i) => {
        const isHov = hovered === item.label;
        return (
          <div
            key={item.label}
            className={`histogram__bar${isHov ? ' histogram__bar--hov' : ''}${onItemClick ? ' histogram__bar--clickable' : ''}`}
            onMouseEnter={() => setHovered(item.label)}
            onMouseLeave={() => setHovered(null)}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
            role={onItemClick ? 'button' : undefined}
            tabIndex={onItemClick ? 0 : undefined}
          >
            <div className="histogram__column">
              <div className="histogram__fill" style={{ height: `${(item.value / maxValue) * 100}%`, animationDelay: `${i * 70}ms` }} />
            </div>
            <strong>{formatInteger(item.value)}</strong>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── GeoMap: Leaflet map with pin markers ────────────────────────────────────
// 3-stop palette: #1a1a2e → #e94560 → #f5a623
function pinColor(t) {
  const LOW  = [26, 26, 46];
  const MID  = [233, 69, 96];
  const HIGH = [245, 166, 35];
  const lerp = (a, b, k) => Math.round(a + (b - a) * k);
  let r, g, b;
  if (t <= 0.5) {
    const k = t * 2;
    r = lerp(LOW[0], MID[0], k); g = lerp(LOW[1], MID[1], k); b = lerp(LOW[2], MID[2], k);
  } else {
    const k = (t - 0.5) * 2;
    r = lerp(MID[0], HIGH[0], k); g = lerp(MID[1], HIGH[1], k); b = lerp(MID[2], HIGH[2], k);
  }
  return `rgb(${r},${g},${b})`;
}

// SVG location pin icon (teardrop shape with dot)
function makePinIcon(color, size = 32) {
  const s = size;
  const h = Math.round(s * 1.45);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${h}" viewBox="0 0 32 46">
    <filter id="ps"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.55)"/></filter>
    <g filter="url(#ps)">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 11.5 14 28 16 30C18 44 32 27.5 32 16 32 7.163 24.837 0 16 0z"
        fill="${color}" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/>
      <circle cx="16" cy="16" r="6" fill="rgba(255,255,255,0.85)"/>
    </g>
  </svg>`;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize:   [s, h],
    iconAnchor: [s / 2, h],
    tooltipAnchor: [0, -h],
  });
}

export function GeoMap({ mode, departments, municipalities, activeDepartment, onDepartmentToggle }) {
  const mapRef      = useRef(null);
  const mapInst     = useRef(null);
  const layerRef    = useRef(null);

  const points = useMemo(
    () =>
      mode === 'municipality' && activeDepartment
        ? municipalities.filter((item) => item.meta === activeDepartment)
        : departments,
    [mode, activeDepartment, municipalities, departments],
  );

  const maxValue = useMemo(() => Math.max(...points.map((p) => p.value), 1), [points]);

  const isDepto = mode !== 'municipality';
  const subtitle = !isDepto && activeDepartment
    ? `${points.length} municipio${points.length !== 1 ? 's' : ''} · ${activeDepartment}`
    : 'Clic en un pin para ver los municipios del departamento';

  // ── Init Leaflet once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;

    const map = L.map(mapRef.current, {
      center: [4.6, -74.1],
      zoom: 6,
      zoomControl: true,
      attributionControl: false,
      maxBounds: [[-5, -82], [14, -66]],
      minZoom: 5,
      maxZoom: 13,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      opacity: 0.88,
    }).addTo(map);

    mapInst.current = map;

    return () => {
      map.remove();
      mapInst.current = null;
      layerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render pins whenever data/mode changes ─────────────────────────────
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;

    // clear previous pins
    if (layerRef.current) layerRef.current.clearLayers();
    else layerRef.current = L.layerGroup().addTo(map);

    if (!points.length) return;

    const clickable = isDepto;

    points.forEach((pt) => {
      const t    = pt.value / maxValue;
      const pct  = Math.round(t * 100);
      const size = isDepto ? Math.round(24 + t * 20) : Math.round(20 + t * 14);
      const color = pinColor(t);
      const icon  = makePinIcon(color, size);

      const marker = L.marker([pt.lat, pt.lon], { icon, interactive: true })
        .addTo(layerRef.current);

      marker.bindTooltip(
        `<div style="min-width:155px;font-family:system-ui,sans-serif;line-height:1.5;padding:2px 0">
          <strong style="color:#f8fafc;font-size:13px;display:block;margin-bottom:4px">${pt.label}</strong>
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:2px">
            <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;
              box-shadow:0 0 6px ${color}"></span>
            <span style="color:#e2e8f0;font-weight:600">${formatInteger(pt.value)} tickets</span>
          </div>
          <div style="color:#94a3b8;font-size:11px">${pct}% del máximo${pt.stopDays ? ` · ${formatDays(pt.stopDays)} parada` : ''}</div>
        </div>`,
        { className: 'geo-tooltip', direction: 'top', offset: [0, -size * 1.45] },
      );

      if (clickable) {
        marker.on('click', () => onDepartmentToggle(pt.label));
        marker.getElement()?.style && (marker.getElement().style.cursor = 'pointer');
      }
    });

    // Fly to bounds
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon]));
      map.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 0.9,
        easeLinearity: 0.15,
        maxZoom: isDepto ? 7 : 10,
      });
    }
  }, [points, maxValue, isDepto, onDepartmentToggle]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="geo-map" style={{ userSelect:'none' }}>
      {/* ── Toolbar ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:'1rem', fontWeight:700, color:'#f1f5f9', letterSpacing:'-0.01em' }}>
            {!isDepto && activeDepartment
              ? `Detalle municipal · ${activeDepartment}`
              : 'Distribución geográfica · Colombia'}
          </div>
          <div style={{ fontSize:'.72rem', color:'#64748b', marginTop:3 }}>{subtitle}</div>
        </div>
        {activeDepartment && (
          <button
            type="button"
            onClick={() => onDepartmentToggle('')}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'6px 14px', borderRadius:20,
              border:'1px solid rgba(233,69,96,0.4)',
              background:'rgba(233,69,96,0.08)',
              color:'#fca5a5', fontSize:'.75rem', fontWeight:600,
              cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
            }}
          >
            ← Volver a departamentos
          </button>
        )}
      </div>

      {/* ── Map container ── */}
      <div
        ref={mapRef}
        style={{
          height: 520, borderRadius: 14, overflow:'hidden',
          border:'1px solid rgba(233,69,96,0.18)',
          boxShadow:'0 0 0 1px rgba(26,26,46,0.8), 0 4px 32px rgba(0,0,0,0.6)',
        }}
      />

      {/* ── Legend ── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12 }}>
        <span style={{ fontSize:'.68rem', color:'#475569', whiteSpace:'nowrap' }}>0 tickets</span>
        <div style={{
          flex:1, height:8, borderRadius:4,
          background:'linear-gradient(to right,#1a1a2e 0%,#e94560 50%,#f5a623 100%)',
          boxShadow:'0 0 10px rgba(233,69,96,0.4)',
        }}/>
        <span style={{ fontSize:'.68rem', color:'#475569', whiteSpace:'nowrap' }}>
          {formatInteger(maxValue)} tickets
        </span>
      </div>
    </div>
  );
}

export function SignalCloud({ items, emptyLabel = 'Sin frases recurrentes.', onItemClick }) {
  if (!items?.length) {
    return <EmptyState label={emptyLabel} />;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 0);
  const interactive = typeof onItemClick === 'function';
  return (
    <div className="chart-card signal-cloud">
      {items.map((item, i) => {
        const scale = maxValue ? 0.85 + item.value / maxValue : 1;
        const content = (
          <>
            <span className="signal-cloud__label">{item.label}</span>
            <small>{item.meta || formatInteger(item.value)}</small>
          </>
        );

        if (interactive) {
          return (
            <button
              key={`${item.ticketId || item.label}-${i}`}
              type="button"
              className="signal-cloud__chip signal-cloud__chip--interactive"
              style={{ '--chip-scale': scale, '--chip-delay': `${i * 50}ms` }}
              onClick={() => onItemClick(item)}
              title={item.title || item.comment || item.label}
              aria-label={`Abrir ticket ${item.ticketId || ''}: ${item.label}`}
            >
              {content}
            </button>
          );
        }

        return (
          <span key={`${item.ticketId || item.label}-${i}`} className="signal-cloud__chip" style={{ '--chip-scale': scale, '--chip-delay': `${i * 50}ms` }} title={item.title || item.comment || item.label}>
            {content}
          </span>
        );
      })}
    </div>
  );
}

export function ComplianceMeter({ compliant, breach }) {
  const total = compliant + breach;
  const compliantRate = total ? (compliant / total) * 100 : 0;
  const [displayRate, setDisplayRate] = useState(0);

  useEffect(() => {
    if (!total) return;
    const id = setTimeout(() => setDisplayRate(compliantRate), 80);
    return () => clearTimeout(id);
  }, [compliantRate, total]);

  if (!total) return <EmptyState label="Sin tickets con parada visible." />;

  const color = displayRate >= 90 ? 'var(--success)' : displayRate >= 70 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="chart-card compliance-meter">
      <div
        className="compliance-meter__ring"
        style={{ '--ring-value': `${displayRate}%`, '--ring-color': color }}
      >
        <span className="compliance-meter__pct" style={{ color }}>
          {Math.round(displayRate)}%
        </span>
        <span className="compliance-meter__label">en SLA</span>
      </div>
      <div className="compliance-meter__legend">
        <span className="compliance-meter__legend-item compliance-meter__legend-item--ok">
          ✓ {formatInteger(compliant)} cumplieron
        </span>
        <span className="compliance-meter__legend-item compliance-meter__legend-item--breach">
          ✗ {formatInteger(breach)} incumplieron
        </span>
      </div>
    </div>
  );
}

// ─── Pie3D ────────────────────────────────────────────────────────────────────
const PIE_COLORS = [
  '#e94560','#f5a623','#3b82f6','#10b981','#a855f7',
  '#ec4899','#14b8a6','#f97316','#6366f1','#84cc16',
];

export function Pie3D({ items = [], onSliceClick }) {
  const total = useMemo(() => items.reduce((s, it) => s + (it.value ?? 0), 0), [items]);
  if (!total) return <EmptyState label="Sin datos de temas." />;

  const cx = 130, cy = 110, r = 85;
  let cumAngle = -Math.PI / 2;
  const slices = items.map((it, i) => {
    const fraction = it.value / total;
    const startAngle = cumAngle;
    cumAngle += fraction * 2 * Math.PI;
    const endAngle = cumAngle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    return { ...it, d, color: PIE_COLORS[i % PIE_COLORS.length], fraction, midAngle };
  });

  const [hovered, setHovered] = useState(null);

  return (
    <div className="chart-card" style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <svg viewBox="0 0 260 220" style={{ width:'100%', maxWidth:260, margin:'0 auto', display:'block' }}>
        {slices.map((sl, i) => (
          <path
            key={i}
            d={sl.d}
            fill={sl.color}
            opacity={hovered === null || hovered === i ? 1 : 0.45}
            stroke="var(--bg-card)"
            strokeWidth={2}
            style={{ cursor: onSliceClick ? 'pointer' : 'default', transition:'opacity .15s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSliceClick?.(sl)}
          />
        ))}
        {/* inner circle for donut effect */}
        <circle cx={cx} cy={cy} r={r * 0.45} fill="var(--bg-card)" />
        {hovered !== null ? (
          <>
            <text x={cx} y={cy - 9} textAnchor="middle" fontSize={11} fill="var(--text-muted)"
              style={{ pointerEvents:'none' }}>{slices[hovered].label}</text>
            <text x={cx} y={cy + 9} textAnchor="middle" fontSize={13} fontWeight="bold"
              fill={slices[hovered].color} style={{ pointerEvents:'none' }}>
              {formatInteger(slices[hovered].value)}
            </text>
            <text x={cx} y={cy + 24} textAnchor="middle" fontSize={10} fill="var(--text-muted)"
              style={{ pointerEvents:'none' }}>
              {formatPercent(slices[hovered].fraction * 100)}
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill="var(--text-muted)">Total</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize={15} fontWeight="bold" fill="var(--text-primary)">
              {formatInteger(total)}
            </text>
          </>
        )}
      </svg>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 14px', justifyContent:'center' }}>
        {slices.map((sl, i) => (
          <button
            key={i}
            onClick={() => onSliceClick?.(sl)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              background:'none', border:'none', cursor: onSliceClick ? 'pointer':'default',
              color:'var(--text-secondary)', fontSize:12, padding:'2px 0',
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span style={{ width:10, height:10, borderRadius:2, background:sl.color, flexShrink:0 }} />
            {sl.label} ({formatPercent(sl.fraction * 100)})
          </button>
        ))}
      </div>
    </div>
  );
}

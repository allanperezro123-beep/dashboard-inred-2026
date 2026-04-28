// ─────────────────────────────────────────────────────────────────────────────
// Date helper
// ─────────────────────────────────────────────────────────────────────────────
function fmtIso(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return String(iso); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive column schema for "Datos completos" sheet
// ─────────────────────────────────────────────────────────────────────────────
const DATOS_SECTIONS = [
  {
    label: 'IDENTIFICACIÓN',
    bg: '0F2A4A', fg: 'FFFFFF',
    cols: [
      { label: 'Ticket #',        get: r => r.ticketId,                       w: 10, t: 'txt' },
      { label: 'Cód. Operador',   get: r => r.operatorCode,                   w: 16, t: 'txt' },
      { label: 'Cód. Cliente',    get: r => r.clientCode,                     w: 14, t: 'txt' },
      { label: 'ID Beneficiario', get: r => r.beneficiaryId,                  w: 16, t: 'txt' },
      { label: 'Proyecto',        get: r => r.project,                        w: 24, t: 'txt' },
      { label: 'Sub Proyecto',    get: r => r.subProject,                     w: 20, t: 'txt' },
      { label: 'Tipo',            get: r => r.type,                           w: 14, t: 'txt' },
      { label: 'Categoría',       get: r => r.category,                       w: 18, t: 'txt' },
    ],
  },
  {
    label: 'ESTADO Y CLASIFICACIÓN',
    bg: '1B3A5C', fg: 'FFFFFF',
    cols: [
      { label: 'Estado',             get: r => r.ticketState,    w: 12, t: 'state'    },
      { label: 'Prioridad',          get: r => r.priority,       w: 11, t: 'priority' },
      { label: 'Impacto',            get: r => r.impact,         w: 12, t: 'txt'      },
      { label: 'Urgencia',           get: r => r.urgency,        w: 12, t: 'txt'      },
      { label: 'Grupo Escalamiento', get: r => r.escalationGroup,w: 24, t: 'txt'      },
      { label: 'Fuente Origen',      get: r => r.sourceOrigin,   w: 18, t: 'txt'      },
      { label: 'Responsable',        get: r => r.responsible,    w: 22, t: 'txt'      },
    ],
  },
  {
    label: 'TERRITORIO',
    bg: '1A4971', fg: 'FFFFFF',
    cols: [
      { label: 'Departamento',   get: r => r.department,        w: 18, t: 'txt' },
      { label: 'Municipio',      get: r => r.municipality,      w: 20, t: 'txt' },
      { label: 'Centro Poblado', get: r => r.locality,          w: 26, t: 'txt' },
      { label: 'Región',         get: r => r.geo?.region,       w: 14, t: 'txt' },
    ],
  },
  {
    label: 'TRAZABILIDAD TEMPORAL',
    bg: '1E5276', fg: 'FFFFFF',
    cols: [
      { label: 'Inicio Ticket',    get: r => fmtIso(r.ticketStart),    w: 14, t: 'txt' },
      { label: 'Fin Ticket',       get: r => fmtIso(r.ticketEnd),      w: 14, t: 'txt' },
      { label: 'Creación Cliente', get: r => fmtIso(r.clientCreated),  w: 16, t: 'txt' },
      { label: 'Días Abierto',     get: r => r.openAgeDays,            w: 12, t: 'num' },
      { label: 'Tiempo Res. (días)', get: r => r.closeDurationDays,      w: 12, t: 'num' },
    ],
  },
  {
    label: 'EQUIPO ASIGNADO',
    bg: '245980', fg: 'FFFFFF',
    cols: [
      { label: 'Creado Por',       get: r => r.creator,    w: 24, t: 'txt' },
      { label: 'Asignado A',       get: r => r.assignee,   w: 26, t: 'txt' },
      { label: 'Cerrado Por',      get: r => r.closer,     w: 24, t: 'txt' },
      { label: 'Técnico Asignado', get: r => r.technician, w: 26, t: 'txt' },
    ],
  },
  {
    label: 'MANTENIMIENTO',
    bg: '1D4E6B', fg: 'FFFFFF',
    cols: [
      { label: 'ID Mnt.',      get: r => r.maintenanceId,                w: 12, t: 'txt' },
      { label: 'Estado Mnt.',  get: r => r.maintenanceState,             w: 14, t: 'txt' },
      { label: 'Inicio Mnt.',  get: r => fmtIso(r.maintenanceStart),    w: 14, t: 'txt' },
      { label: 'Fin Mnt.',     get: r => fmtIso(r.maintenanceEnd),      w: 14, t: 'txt' },
      { label: 'Técnico Mnt.', get: r => r.maintenanceCreator,          w: 22, t: 'txt' },
    ],
  },
  {
    label: 'PARADA DE SERVICIO',
    bg: '7B1A1A', fg: 'FFFFFF',
    cols: [
      { label: 'Inicio Parada', get: r => fmtIso(r.stopStart),                         w: 15, t: 'txt' },
      { label: 'Fin Parada',    get: r => fmtIso(r.stopEnd),                           w: 15, t: 'txt' },
      { label: 'Días Parada',   get: r => r.currentStopDays ?? r.stopDaysTotal ?? null, w: 12, t: 'num' },
      { label: 'Segmentos',     get: r => r.currentStopSegments ?? r.stopSegmentCount ?? null, w: 11, t: 'num' },
      { label: 'Inicio Falla',  get: r => fmtIso(r.faultStart),                        w: 14, t: 'txt' },
      { label: 'Fin Falla',     get: r => fmtIso(r.faultEnd),                          w: 14, t: 'txt' },
      { label: 'Días Falla',    get: r => r.faultDurationDays,                         w: 11, t: 'num' },
    ],
  },
  {
    label: 'COMENTARIOS Y NARRATIVA',
    bg: '3A2A00', fg: 'FFFFFF',
    cols: [
      { label: 'Comentario Apertura', get: r => r.openingComment,    w: 55, t: 'wrap' },
      { label: 'Comentario Solución', get: r => r.resolutionComment, w: 55, t: 'wrap' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Color palette – matches dashboard dark theme
// ─────────────────────────────────────────────────────────────────────────────
const CLR = {
  navyBg:     '0F2A4A',
  navyText:   'FFFFFF',
  headerBg:   '1B3A5C',
  subBg:      '1E3A5F',
  rowAlt:     'EBF4FF',
  rowWhite:   'FFFFFF',
  priHighBg:  'FFE4E4', priHighFg:  'CC0000',
  priMedBg:   'FFF9E6', priMedFg:   '996600',
  priLowBg:   'E8F5E9', priLowFg:   '2E7D32',
  sectionBg:  'E3EDF7', sectionFg:  '1B3A5C',
  borderL:    'C5D8EF',
  borderD:    '8EB4D3',
  mutedFg:    '6B7E96',
  accentBg:   'E8F4FD',
  noteBg:     'FFFBF0',
  noteBorder: 'FFE082',
  numRight:   'right',
};

// ─────────────────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────────────────
function bgFill(color) {
  return { type: 'pattern', patternType: 'solid', fgColor: { rgb: color } };
}
function mkBorder(color, style = 'thin') {
  const b = { style, color: { rgb: color } };
  return { top: b, bottom: b, left: b, right: b };
}
function mkFont(bold, color, sz) {
  return { bold: !!bold, color: { rgb: color }, sz };
}

const S = {
  title: {
    fill: bgFill(CLR.navyBg),
    font: mkFont(true, CLR.navyText, 16),
    alignment: { horizontal: 'center', vertical: 'center' },
    border: mkBorder(CLR.navyBg),
  },
  subtitle: {
    fill: bgFill(CLR.subBg),
    font: mkFont(false, CLR.navyText, 10),
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: mkBorder(CLR.subBg),
  },
  metaLabel: {
    fill: bgFill(CLR.accentBg),
    font: mkFont(true, CLR.sectionFg, 10),
    alignment: { horizontal: 'right', vertical: 'center' },
    border: mkBorder(CLR.borderL),
  },
  metaVal: {
    fill: bgFill(CLR.accentBg),
    font: mkFont(false, CLR.sectionFg, 10),
    alignment: { horizontal: 'left', vertical: 'center' },
    border: mkBorder(CLR.borderL),
  },
  sectionHead: {
    fill: bgFill(CLR.sectionBg),
    font: mkFont(true, CLR.sectionFg, 11),
    alignment: { horizontal: 'left', vertical: 'center' },
    border: mkBorder(CLR.borderD, 'medium'),
  },
  tableHead: {
    fill: bgFill(CLR.headerBg),
    font: mkFont(true, CLR.navyText, 10),
    alignment: { horizontal: 'center', vertical: 'center' },
    border: mkBorder(CLR.headerBg, 'medium'),
  },
  rowA:    { fill: bgFill(CLR.rowWhite), font: mkFont(false, '222222', 10), alignment: { horizontal: 'left',  vertical: 'center' }, border: mkBorder(CLR.borderL) },
  rowB:    { fill: bgFill(CLR.rowAlt),   font: mkFont(false, '222222', 10), alignment: { horizontal: 'left',  vertical: 'center' }, border: mkBorder(CLR.borderL) },
  rowNumA: { fill: bgFill(CLR.rowWhite), font: mkFont(false, '222222', 10), alignment: { horizontal: 'right', vertical: 'center' }, border: mkBorder(CLR.borderL) },
  rowNumB: { fill: bgFill(CLR.rowAlt),   font: mkFont(false, '222222', 10), alignment: { horizontal: 'right', vertical: 'center' }, border: mkBorder(CLR.borderL) },
  priHigh: { fill: bgFill(CLR.priHighBg), font: mkFont(false, CLR.priHighFg, 10), alignment: { horizontal: 'left',  vertical: 'center' }, border: mkBorder(CLR.borderL) },
  priMed:  { fill: bgFill(CLR.priMedBg),  font: mkFont(false, CLR.priMedFg,  10), alignment: { horizontal: 'left',  vertical: 'center' }, border: mkBorder(CLR.borderL) },
  priLow:  { fill: bgFill(CLR.priLowBg),  font: mkFont(false, CLR.priLowFg,  10), alignment: { horizontal: 'left',  vertical: 'center' }, border: mkBorder(CLR.borderL) },
  dataHead: {
    fill: bgFill(CLR.navyBg),
    font: mkFont(true, CLR.navyText, 11),
    alignment: { horizontal: 'center', vertical: 'center' },
    border: mkBorder(CLR.navyBg, 'medium'),
  },
  blank: { fill: bgFill('F8FAFC'), border: mkBorder('F8FAFC') },
  note: {
    fill: bgFill(CLR.noteBg),
    font: { italic: true, color: { rgb: CLR.mutedFg }, sz: 9 },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: mkBorder(CLR.noteBorder),
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Cell constructors
// ─────────────────────────────────────────────────────────────────────────────
const cs = (v, s) => ({ v: v ?? '', t: 's', s });
const cn = (v, s) => ({ v: typeof v === 'number' ? v : Number(v) || 0, t: 'n', s });
const cb = ()    => ({ v: '', t: 's', s: S.blank });

// ─────────────────────────────────────────────────────────────────────────────
// Aggregation helpers
// ─────────────────────────────────────────────────────────────────────────────
function countBy(rows, keyFn) {
  const map = {};
  rows.forEach((row) => {
    const k = keyFn(row) || 'Sin dato';
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function priorityStyle(priority) {
  const p = (priority || '').toLowerCase();
  if (p.includes('alta') || p === 'high') return S.priHigh;
  if (p.includes('media') || p === 'medium') return S.priMed;
  return S.priLow;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the "Informe" summary worksheet
// ─────────────────────────────────────────────────────────────────────────────
function buildInformeSheet(XLSX, columns, rows, meta) {
  const NC = 8; // total columns in informe sheet
  const cells = [];  // array of row arrays
  const merges = [];
  const heights = [];

  function push(row, hpt = 18) {
    merges; // keep ref
    cells.push(row);
    heights.push({ hpt });
  }

  function fullMerge() {
    merges.push({ s: { r: cells.length - 1, c: 0 }, e: { r: cells.length - 1, c: NC - 1 } });
  }

  function paddedRow(cols) {
    const row = [...cols];
    while (row.length < NC) row.push(cb());
    return row;
  }

  function sectionBlank() {
    push(Array(NC).fill(cb()), 8);
  }

  function sectionHeader(label) {
    push(paddedRow([cs(label, S.sectionHead), ...Array(NC - 1).fill({ v: '', t: 's', s: S.sectionHead })]), 22);
    fullMerge();
  }

  function tableHeader(labels) {
    push(paddedRow(labels.map((l) => cs(l, S.tableHead))), 20);
  }

  function distRow(cols, isAlt, customRowStyle) {
    const base = customRowStyle || (isAlt ? S.rowB : S.rowA);
    const baseNum = customRowStyle
      ? { ...customRowStyle, alignment: { horizontal: 'right', vertical: 'center' } }
      : (isAlt ? S.rowNumB : S.rowNumA);
    const row = cols.map(([v, t]) => t === 'n' ? cn(v, baseNum) : cs(String(v ?? ''), base));
    while (row.length < NC) row.push(cb());
    push(row, 18);
  }

  // ── Title block ─────────────────────────────────────────────────────────
  push(paddedRow([cs('INRED · Gestión de Tickets', S.title)]), 48);
  fullMerge();

  const tableTitle = meta.title || 'Informe de Tickets';
  push(paddedRow([cs(tableTitle, S.subtitle)]), 30);
  fullMerge();

  if (meta.subtitle) {
    push(paddedRow([cs(meta.subtitle, S.subtitle)]), 22);
    fullMerge();
  }

  // ── Metadata row ────────────────────────────────────────────────────────
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const metaRi = cells.length;
  push([
    cs('Exportado:', S.metaLabel), cs(`${dateStr}, ${timeStr}`, S.metaVal), cb(), cb(),
    cs('Total registros:', S.metaLabel), cs(String(rows.length), { ...S.metaVal, font: mkFont(true, CLR.sectionFg, 10) }), cb(), cb(),
  ], 22);
  merges.push({ s: { r: metaRi, c: 1 }, e: { r: metaRi, c: 3 } });
  merges.push({ s: { r: metaRi, c: 5 }, e: { r: metaRi, c: 7 } });

  // ── Estado ──────────────────────────────────────────────────────────────
  sectionBlank();
  const stateCounts = countBy(rows, (r) => r.ticketState);
  if (stateCounts.length) {
    sectionHeader('DISTRIBUCIÓN POR ESTADO DEL TICKET');
    tableHeader(['Estado', 'Registros', '% del total']);
    stateCounts.forEach(([state, count], i) => {
      distRow([[state, 's'], [count, 'n'], [`${((count / rows.length) * 100).toFixed(1)}%`, 's']], i % 2 !== 0);
    });
  }

  // ── Prioridad ────────────────────────────────────────────────────────────
  sectionBlank();
  const priCounts = countBy(rows, (r) => r.priority);
  if (priCounts.length) {
    sectionHeader('DISTRIBUCIÓN POR PRIORIDAD');
    tableHeader(['Prioridad', 'Registros', '% del total']);
    priCounts.forEach(([pri, count]) => {
      distRow([[pri, 's'], [count, 'n'], [`${((count / rows.length) * 100).toFixed(1)}%`, 's']], false, priorityStyle(pri));
    });
  }

  // ── Territorio ──────────────────────────────────────────────────────────
  sectionBlank();
  const terrCounts = countBy(rows, (r) => r.department || (r.territory || '').split('·')[0]?.trim() || 'Sin dato');
  if (terrCounts.length) {
    sectionHeader('DISTRIBUCIÓN GEOGRÁFICA · TOP DEPARTAMENTOS');
    tableHeader(['Departamento', 'Tickets', '% del total']);
    terrCounts.slice(0, 15).forEach(([terr, count], i) => {
      distRow([[terr, 's'], [count, 'n'], [`${((count / rows.length) * 100).toFixed(1)}%`, 's']], i % 2 !== 0);
    });
  }

  // ── Asignados ────────────────────────────────────────────────────────────
  sectionBlank();
  const assigneeCounts = countBy(rows, (r) => r.assignee);
  if (assigneeCounts.length) {
    sectionHeader('DISTRIBUCIÓN POR TÉCNICO / ASIGNADO');
    tableHeader(['Técnico Asignado', 'Tickets', '% del total']);
    assigneeCounts.slice(0, 15).forEach(([name, count], i) => {
      distRow([[name, 's'], [count, 'n'], [`${((count / rows.length) * 100).toFixed(1)}%`, 's']], i % 2 !== 0);
    });
  }

  // ── Temas NLP ────────────────────────────────────────────────────────────
  const nlpCounts = countBy(rows, (r) => r.textAnalytics?.primaryTopic || r['textAnalytics.primaryTopic']);
  const hasNlp = nlpCounts.some(([k]) => k !== 'Sin dato');
  if (hasNlp) {
    sectionBlank();
    sectionHeader('DISTRIBUCIÓN POR TEMA NLP (ANÁLISIS DE TEXTO)');
    tableHeader(['Tema Detectado', 'Tickets', '% del total']);
    nlpCounts.slice(0, 12).forEach(([topic, count], i) => {
      distRow([[topic, 's'], [count, 'n'], [`${((count / rows.length) * 100).toFixed(1)}%`, 's']], i % 2 !== 0);
    });
  }

  // ── Paradas ──────────────────────────────────────────────────────────────
  const stopRows = rows.filter((r) => (r.currentStopDays || 0) > 0);
  if (stopRows.length > 0) {
    const totalStop = stopRows.reduce((s, r) => s + (r.currentStopDays || 0), 0);
    const avgStop = totalStop / stopRows.length;
    const maxStop = Math.max(...stopRows.map((r) => r.currentStopDays || 0));
    sectionBlank();
    sectionHeader('RESUMEN DE PARADAS DE SERVICIO');
    tableHeader(['Indicador', 'Valor', 'Unidad']);
    [
      ['Tickets con parada activa', stopRows.length, 'tickets'],
      ['Total días acumulados de parada', +totalStop.toFixed(2), 'días'],
      ['Promedio de días de parada por ticket', +avgStop.toFixed(2), 'días'],
      ['Máximo días de parada (peor caso)', +maxStop.toFixed(2), 'días'],
    ].forEach(([label, value, unit], i) => {
      distRow([[label, 's'], [value, 'n'], [unit, 's']], i % 2 !== 0);
    });
  }

  // ── Nota final ────────────────────────────────────────────────────────────
  sectionBlank();
  push(paddedRow([cs(
    'Sugerencia: para generar gráficos, seleccione cualquier tabla de distribución y use Insertar → Gráfico en Excel. Los datos ya están estructurados y listos para visualizar.',
    S.note,
  )]), 36);
  fullMerge();

  // ── Worksheet ─────────────────────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(cells);
  ws['!merges'] = merges;
  ws['!rows']   = heights;
  ws['!cols']   = [
    { wch: 44 }, { wch: 12 }, { wch: 18 }, { wch: 10 },
    { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
  ];
  return ws;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the "Datos completos" full-data worksheet
// ─────────────────────────────────────────────────────────────────────────────
function buildDatosSheet(XLSX, _columns, rows) {
  // ── Flatten all column definitions + compute section merges ───────────────
  const allCols = [];
  DATOS_SECTIONS.forEach((sec) => sec.cols.forEach((col) => allCols.push({ ...col, _sec: sec })));
  const NC = allCols.length;

  const secMerges = [];
  let cursor = 0;
  DATOS_SECTIONS.forEach((sec) => {
    const start = cursor;
    const end   = cursor + sec.cols.length - 1;
    if (end > start) secMerges.push({ s: { r: 0, c: start }, e: { r: 0, c: end } });
    cursor += sec.cols.length;
  });

  // ── Style builders ─────────────────────────────────────────────────────────
  const brd = (color, style = 'thin') => ({ style, color: { rgb: color } });
  const fullBorder = (c) => { const side = brd(c); return { top: side, bottom: side, left: side, right: side }; };

  const secHeadStyle = (sec) => ({
    fill: bgFill(sec.bg),
    font: { bold: true, color: { rgb: sec.fg }, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: fullBorder(sec.bg),
  });

  const colHeadStyle = (sec) => ({
    fill: bgFill(sec.bg),
    font: { bold: true, color: { rgb: 'D9EEFF' }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: { top: brd('FFFFFF', 'medium'), bottom: brd('FFFFFF', 'medium'), left: brd(sec.bg), right: brd(sec.bg) },
  });

  // Per-row tint (based on priority)
  const rowBase = (row, isAlt) => {
    const pri = (row.priority || '').toLowerCase();
    if (pri.includes('alta') || pri === 'high')
      return { bg: isAlt ? 'FFF0F0' : 'FFF8F8', fg: '2C0000', nfg: '8B0000' };
    if (pri.includes('media') || pri === 'medium')
      return { bg: isAlt ? 'FFFDE8' : 'FFFFF8', fg: '2C2000', nfg: '7A6000' };
    return { bg: isAlt ? 'EBF4FF' : 'FFFFFF', fg: '1A2A3A', nfg: '1B3A5C' };
  };

  // Special cell overrides for Estado / Prioridad cells
  const cellOverride = (col, row) => {
    if (col.t === 'state') {
      const s = (row.ticketState || '').toLowerCase();
      if (s === 'abierto') return { bg: 'DCEFFE', fg: '0A4080' };
      if (s === 'cerrado') return { bg: 'DCFCE7', fg: '166534' };
      if (s === 'anulado') return { bg: 'F3F4F6', fg: '6B7280' };
    }
    if (col.t === 'priority') {
      const p = (row.priority || '').toLowerCase();
      if (p.includes('alta') || p === 'high')   return { bg: 'FEE2E2', fg: 'B91C1C', bold: true };
      if (p.includes('media') || p === 'medium') return { bg: 'FEF3C7', fg: '92400E', bold: true };
      if (p.includes('baja') || p === 'low')     return { bg: 'D1FAE5', fg: '065F46' };
    }
    return null;
  };

  const mkCellStyle = (col, rb, ov) => ({
    fill: bgFill(ov?.bg || rb.bg),
    font: { bold: ov?.bold || false, color: { rgb: ov?.fg || (col.t === 'num' ? rb.nfg : rb.fg) }, sz: 9 },
    alignment: { horizontal: col.t === 'num' ? 'right' : 'left', vertical: 'center', wrapText: col.t === 'wrap' },
    border: fullBorder('C5D8EF'),
  });

  // ── Build row arrays ───────────────────────────────────────────────────────
  const sheetCells = [];
  const merges = [...secMerges];
  const rowHeights = [];

  // Row 0 — section group headers
  const secRow = [];
  DATOS_SECTIONS.forEach((sec) => {
    secRow.push({ v: sec.label, t: 's', s: secHeadStyle(sec) });
    sec.cols.slice(1).forEach(() => secRow.push({ v: '', t: 's', s: secHeadStyle(sec) }));
  });
  sheetCells.push(secRow);
  rowHeights.push({ hpt: 22 });

  // Row 1 — individual column headers
  sheetCells.push(allCols.map((col) => ({ v: col.label, t: 's', s: colHeadStyle(col._sec) })));
  rowHeights.push({ hpt: 26 });

  // Data rows
  rows.forEach((row, ri) => {
    const rb  = rowBase(row, ri % 2 !== 0);
    const dataRow = allCols.map((col) => {
      const raw = col.get(row);
      const ov  = cellOverride(col, row);
      const st  = mkCellStyle(col, rb, ov);
      if (col.t === 'num') {
        const n = raw != null && raw !== '' ? Number(raw) : null;
        return n === null ? { v: '', t: 's', s: st } : { v: n, t: 'n', s: st };
      }
      return { v: raw != null ? String(raw) : '', t: 's', s: st };
    });
    sheetCells.push(dataRow);
    const hasLong = row.openingComment || row.resolutionComment || (row.textAnalytics?.alertLabels || []).length;
    rowHeights.push({ hpt: hasLong ? 42 : 18 });
  });

  // ── Assemble worksheet ─────────────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(sheetCells);
  ws['!merges']     = merges;
  ws['!rows']       = rowHeights;
  ws['!cols']       = allCols.map((col) => ({ wch: col.w }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 1, c: 0 }, e: { r: 1, c: NC - 1 } }) };
  ws['!freeze']     = { xSplit: 0, ySplit: 2, topLeftCell: 'A3', activeCell: 'A3' };

  return ws;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse comment thread helper (mirrors analytics.js parseCommentThread)
// ─────────────────────────────────────────────────────────────────────────────
function parseCommentEntries(openingComment, resolutionComment) {
  const BLOCK_RE = /TIPO\s+Comentario\s*:\s*(.+?)\s*==>\s*FECHA\s*:\s*(.+?)\s+Comentario\s*:==>\s*([\s\S]*)/i;
  const combined = [openingComment, resolutionComment].filter(Boolean).join('\n######******######\n');
  const blocks = combined.split(/#{3,}\*+#{3,}/).map((b) => b.trim()).filter(Boolean);
  const entries = [];
  for (const block of blocks) {
    const match = block.match(BLOCK_RE);
    if (match) {
      entries.push({ tipo: match[1].trim(), fecha: match[2].trim(), texto: match[3].trim() });
    } else if (block.trim()) {
      entries.push({ tipo: 'Comentario', fecha: null, texto: block.trim() });
    }
  }
  return entries.sort((a, b) => {
    const da = a.fecha ? new Date(a.fecha) : new Date(0);
    const db = b.fecha ? new Date(b.fecha) : new Date(0);
    return da - db;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// "Historial de Comentarios" sheet — one row per comment entry per ticket
// ─────────────────────────────────────────────────────────────────────────────
function buildHistorialSheet(XLSX, rows) {
  const xb  = (c, s = 'thin')  => ({ style: s, color: { rgb: c } });
  const fb  = (c, s = 'thin')  => { const x = xb(c, s); return { top: x, bottom: x, left: x, right: x }; };

  const H_COLS = [
    { label: 'Ticket #',      wch: 10 },
    { label: 'Estado',        wch: 12 },
    { label: 'Prioridad',     wch: 14 },
    { label: 'Departamento',  wch: 20 },
    { label: 'Municipio',     wch: 20 },
    { label: 'Tipo',          wch: 16 },
    { label: 'Fecha',         wch: 22 },
    { label: 'Comentario',    wch: 80 },
  ];
  const NC = H_COLS.length;

  // Tipo colour mapping
  const tipoBg = (tipo) => {
    const t = (tipo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (t.includes('descripcion') || t.includes('apertura')) return { bg: 'DBEAFE', fg: '1E3A8A', bdr: '93C5FD' };
    if (t.includes('seguimiento'))                           return { bg: 'FEF9C3', fg: '713F12', bdr: 'FDE047' };
    if (t.includes('solucion') || t.includes('cierre') || t.includes('resolucion'))
                                                             return { bg: 'DCFCE7', fg: '166534', bdr: '86EFAC' };
    return { bg: 'F1F5F9', fg: '334155', bdr: 'CBD5E1' };
  };

  const titleStyle = {
    fill: bgFill('0F2A4A'),
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 13 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: fb('0F2A4A', 'medium'),
  };
  const subtitleStyle = {
    fill: bgFill('1E3A5F'),
    font: { color: { rgb: 'D9EEFF' }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: fb('1E3A5F'),
  };
  const headStyle = (col) => ({
    fill: bgFill('1B4F8A'),
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: fb('0F2A4A', 'medium'),
  });

  const cells   = [];
  const heights = [];
  const merges  = [];

  function addMerge(r, c1, c2) {
    merges.push({ s: { r, c: c1 }, e: { r, c: c2 } });
  }

  // Title
  cells.push([{ v: 'INRED · Historial de Comentarios y Seguimiento', t: 's', s: titleStyle }]);
  heights.push({ hpt: 32 });
  addMerge(0, 0, NC - 1);

  // Subtitle
  const totalEntries = rows.reduce((acc, r) => acc + parseCommentEntries(r.openingComment, r.resolutionComment).length, 0);
  cells.push([{
    v: `Cronología completa de todos los comentarios estructurados. ${rows.length} tickets · ${totalEntries} entradas totales.`,
    t: 's',
    s: subtitleStyle,
  }]);
  heights.push({ hpt: 22 });
  addMerge(1, 0, NC - 1);

  // Column headers
  cells.push(H_COLS.map((c) => ({ v: c.label, t: 's', s: headStyle(c) })));
  heights.push({ hpt: 24 });

  // Data rows
  rows.forEach((row) => {
    const entries = parseCommentEntries(row.openingComment, row.resolutionComment);
    if (!entries.length) return;

    const isAlt  = false;
    const priLow = (row.priority || '').toLowerCase();
    const rowBg  = priLow.includes('alta') || priLow === 'high'   ? 'FFF0F0'
                 : priLow.includes('media') || priLow === 'medium' ? 'FFFDE8'
                 : 'F8FAFC';
    const rowFg  = priLow.includes('alta') || priLow === 'high'   ? '7B1A1A'
                 : priLow.includes('media') || priLow === 'medium' ? '6B4E00'
                 : '1A2A3A';

    const baseCell = (v) => ({
      fill: bgFill(rowBg),
      font: { color: { rgb: rowFg }, sz: 9 },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: fb('D1D5DB'),
    });

    entries.forEach((entry, ei) => {
      const tp = tipoBg(entry.tipo);
      const tipoStyle = {
        fill: bgFill(tp.bg),
        font: { bold: true, color: { rgb: tp.fg }, sz: 9 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: fb(tp.bdr),
      };
      const textStyle = {
        fill: bgFill(rowBg),
        font: { color: { rgb: rowFg }, sz: 9 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: fb('D1D5DB'),
      };
      const numStyle = {
        fill: bgFill(rowBg),
        font: { bold: true, color: { rgb: rowFg }, sz: 9 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: fb('D1D5DB'),
      };
      const textLen = (entry.texto || '').length;
      const rowHpt  = Math.min(Math.max(Math.ceil(textLen / 90) * 14, 20), 120);

      cells.push([
        { v: String(row.ticketId || ''), t: 's', s: numStyle },
        { v: row.ticketState  || '—',   t: 's', s: baseCell() },
        { v: row.priority     || '—',   t: 's', s: baseCell() },
        { v: row.department   || '—',   t: 's', s: baseCell() },
        { v: row.municipality || '—',   t: 's', s: baseCell() },
        { v: entry.tipo,                t: 's', s: tipoStyle },
        { v: entry.fecha      || '—',   t: 's', s: baseCell() },
        { v: entry.texto      || '',    t: 's', s: textStyle },
      ]);
      heights.push({ hpt: rowHpt });
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(cells);
  ws['!merges']     = merges;
  ws['!rows']       = heights;
  ws['!cols']       = H_COLS.map((c) => ({ wch: c.wch }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 2, c: 0 }, e: { r: 2, c: NC - 1 } }) };
  ws['!freeze']     = { xSplit: 0, ySplit: 3, topLeftCell: 'A4', activeCell: 'A4' };
  return ws;
}

// ─────────────────────────────────────────────────────────────────────────────
// Download helper
// ─────────────────────────────────────────────────────────────────────────────
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Seguimiento de Casos sheet — one card per ticket, designed for case closure
// ─────────────────────────────────────────────────────────────────────────────
function buildSeguimientoSheet(XLSX, rows) {
  const NC = 7;

  // Sort: open first → stop days desc → days open desc
  const sorted = [...rows]
    .sort((a, b) => {
      const aOpen = a.ticketState === 'Abierto' ? 1 : 0;
      const bOpen = b.ticketState === 'Abierto' ? 1 : 0;
      const aStop = a.currentStopDays || a.stopDaysTotal || 0;
      const bStop = b.currentStopDays || b.stopDaysTotal || 0;
      return bOpen - aOpen || bStop - aStop || (b.openAgeDays || 0) - (a.openAgeDays || 0);
    })
    .slice(0, 120);

  const cells  = [];
  const merges = [];
  const heights = [];

  function addRow(row, hpt = 18) {
    while (row.length < NC) row.push({ v: '', t: 's', s: blkS });
    cells.push(row);
    heights.push({ hpt });
  }
  function addMerge(c1, c2) {
    merges.push({ s: { r: cells.length - 1, c: c1 }, e: { r: cells.length - 1, c: c2 } });
  }

  // ── Local style helpers ─────────────────────────────────────────────────
  const xb = (c, s = 'thin') => ({ style: s, color: { rgb: c } });
  const fb = (c, s = 'thin') => { const x = xb(c, s); return { top: x, bottom: x, left: x, right: x }; };

  const blkS   = { fill: bgFill('F8FAFC'), border: fb('E2EBF3') };
  const sepS   = { fill: bgFill('0F2A4A'), border: fb('0F2A4A', 'medium') };

  function cardHeaderStyle(row) {
    const p = (row.priority || '').toLowerCase();
    const bg = p.includes('alta') || p === 'high'   ? '7B1A1A'
             : p.includes('media') || p === 'medium' ? '6B4E00'
             : '0F3460';
    return {
      fill: bgFill(bg),
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
      border: fb(bg, 'medium'),
    };
  }

  const mkLbl = (bg, fg, bdr) => ({
    fill: bgFill(bg),
    font: { bold: true, color: { rgb: fg }, sz: 9 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: fb(bdr),
  });
  const mkVal = (bg, fg, bdr, wrap = false) => ({
    fill: bgFill(bg),
    font: { bold: false, color: { rgb: fg }, sz: 9 },
    alignment: { horizontal: 'left', vertical: wrap ? 'top' : 'center', wrapText: wrap },
    border: fb(bdr),
  });
  const mkNum = (bg, fg, bdr) => ({
    fill: bgFill(bg),
    font: { bold: true, color: { rgb: fg }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: fb(bdr),
  });

  // Colour tokens per zone
  const dateLblS  = mkLbl('D9EEFF', '1B3A5C', 'C5D8EF');
  const dateValS  = mkVal('FFFFFF', '1A2A3A', 'C5D8EF');
  const dateNumS  = mkNum('EBF4FF', '0F2A4A', '8EB4D3');

  const stopLblS  = mkLbl('FEE2E2', '991B1B', 'F87171');
  const stopValS  = mkVal('FFF0F0', '7B1A1A', 'F87171');
  const stopWarnS = { ...stopValS, font: { ...stopValS.font, bold: true } };

  const nlpLblS   = mkLbl('DCFCE7', '166534', '86EFAC');
  const nlpTopS   = mkVal('F0FDF4', '14532D', '86EFAC');
  const nlpAltS   = mkVal('FFFBEB', '92400E', 'FCD34D');

  const cmtNoneS  = mkVal('F8FAFC', '9CA3AF', 'E2EBF3');

  const resWrnLS  = mkLbl('FFEDD5', '9A3412', 'FDBA74');
  const resWrnVS  = mkVal('FFF7ED', '9A3412', 'FDBA74');

  const qLblS     = mkLbl('DBEAFE', '1E3A8A', '93C5FD');
  const qValS     = mkVal('EFF6FF', '1E3A8A', '93C5FD', true);

  // ── Comment-type colour map ───────────────────────────────────────────────
  function tipoColors(tipo) {
    const t = (tipo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (t.includes('descripcion') || t.includes('apertura'))
      return { bg: 'DBEAFE', fg: '1E3A8A', bdr: '93C5FD', icon: '📝' };
    if (t.includes('seguimiento') || t.includes('tracking'))
      return { bg: 'FEF9C3', fg: '713F12', bdr: 'FDE047', icon: '🔄' };
    if (t.includes('solucion') || t.includes('cierre') || t.includes('resolucion'))
      return { bg: 'DCFCE7', fg: '166534', bdr: '86EFAC', icon: '✅' };
    return { bg: 'F1F5F9', fg: '334155', bdr: 'CBD5E1', icon: '💬' };
  }
  const tlHeadS = mkLbl('1E3A5F', 'D9EEFF', '2D5A8E');

  // ── Topic icon map ────────────────────────────────────────────────────────
  function topicIcon(topic) {
    const t = (topic || '').toLowerCase();
    if (t.includes('conectividad'))                 return '📡';
    if (t.includes('infraestructura'))              return '🏗';
    if (t.includes('energia') || t.includes('energía')) return '⚡';
    if (t.includes('administrativo'))               return '📋';
    if (t.includes('mantenimiento'))                return '🔧';
    if (t.includes('software') || t.includes('sistema')) return '💻';
    if (t.includes('hardware'))                     return '🖥';
    return '🔍';
  }

  // ── Closure question generator ────────────────────────────────────────────
  function makeQuestions(row) {
    const q   = [];
    const pri = (row.priority || '').toLowerCase();
    const top = (row.textAnalytics?.primaryTopic || '').toLowerCase();
    const alr = (row.textAnalytics?.alertLabels || []).map(a => a.toLowerCase());
    const stp = row.currentStopDays || row.stopDaysTotal || 0;
    const age = row.openAgeDays || 0;

    if (!row.resolutionComment) {
      q.push('• ¿Cuál fue la acción técnica tomada para resolver este caso?');
      q.push('• ¿El cliente confirmó la restitución del servicio?');
    }
    if (stp > 7) {
      q.push(`• Parada de ${Number(stp).toFixed(1)} días ─ ¿se documentó la justificación de la brecha SLA?`);
      q.push('• ¿Se comunicó el impacto al cliente y se obtuvo acuse de recibo?');
    } else if (stp > 0) {
      q.push(`• ¿La parada de ${Number(stp).toFixed(1)} días fue reportada y aceptada por el cliente?`);
    }
    if (age > 30) {
      q.push(`• Con ${Number(age).toFixed(0)} días abierto ─ ¿cuál es el plan de cierre definido?`);
      q.push('• ¿El cliente ha recibido actualizaciones periódicas durante este tiempo?');
    }
    if (top.includes('conectividad'))
      q.push('• ¿Se realizó prueba de enlace end-to-end con resultado estable?');
    if (top.includes('infraestructura'))
      q.push('• ¿Hay equipos o componentes físicos pendientes de reemplazo o reparación?');
    if (top.includes('energia') || top.includes('energía'))
      q.push('• ¿Se verificó el suministro eléctrico continuo y la operación del UPS / planta eléctrica?');
    if (top.includes('administrativo'))
      q.push('• ¿Los trámites, autorizaciones y documentos requeridos están completos?');
    if (top.includes('mantenimiento'))
      q.push('• ¿El mantenimiento fue ejecutado y documentado con informe técnico de visita?');
    if (alr.some(a => a.includes('contacto') || a.includes('respuesta')))
      q.push('• ¿Se logró contacto efectivo con el encargado del sitio? De lo contrario, ¿se escaló?');
    if (pri.includes('alta') || pri === 'high')
      q.push('• Prioridad Alta ─ ¿se activó el protocolo urgente y se notificó a supervisión?');
    if (row.maintenanceId && !row.maintenanceEnd)
      q.push('• El mantenimiento asociado está pendiente de cierre — ¿cuál es su estado actual?');
    if (!row.assignee && !row.technician)
      q.push('• ¿El caso tiene un responsable o técnico asignado actualmente?');
    if (q.length === 0) {
      q.push('• ¿El servicio está operando correctamente en este momento?');
      q.push('• ¿El cliente confirmó la solución de manera satisfactoria?');
    }
    q.push('• ¿Existe riesgo de reincidencia? ¿Se tomaron acciones preventivas?');
    q.push('• ¿La documentación del caso está completa y lista para auditoría?');
    return q;
  }

  // ── Intro header ──────────────────────────────────────────────────────────
  addRow([{
    v: 'INRED · Seguimiento de Casos  ─  Ficha de Gestión y Cierre',
    t: 's',
    s: {
      fill: bgFill('0F2A4A'),
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: fb('0F2A4A', 'medium'),
    },
  }], 36);
  addMerge(0, NC - 1);

  addRow([{
    v: `Esta hoja presenta una ficha de seguimiento por cada ticket. Incluye el historial cronológico de comentarios (Descripción · Seguimiento · Solución) y preguntas orientadoras para facilitar el cierre. Total de fichas: ${sorted.length}.`,
    t: 's',
    s: {
      fill: bgFill('1E3A5F'),
      font: { bold: false, color: { rgb: 'D9EEFF' }, sz: 9 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: fb('1E3A5F'),
    },
  }], 28);
  addMerge(0, NC - 1);

  addRow(Array(NC).fill({ v: '', t: 's', s: sepS }), 10);
  addMerge(0, NC - 1);

  // ── One card per ticket ───────────────────────────────────────────────────
  sorted.forEach((row) => {
    const pri   = (row.priority || '').toLowerCase();
    const priIc = pri.includes('alta') || pri === 'high'   ? '🔴'
                : pri.includes('media') || pri === 'medium' ? '🟡' : '🟢';
    const stIc  = row.ticketState === 'Abierto' ? '🔓' : row.ticketState === 'Cerrado' ? '✅' : '⛔';
    const stp   = row.currentStopDays || row.stopDaysTotal || 0;
    const age   = row.openAgeDays || row.closeDurationDays || 0;
    const topic = row.textAnalytics?.primaryTopic || 'Sin clasificar';
    const ticon = topicIcon(topic);
    const terr  = [row.department, row.municipality, row.locality].filter(Boolean).join(' · ') || 'Sin territorio';

    // CARD HEADER
    addRow([{
      v: `${priIc}  TICKET #${row.ticketId}   ${stIc} ${row.ticketState}   ·   Prioridad: ${row.priority || 'Sin dato'}   ·   📍 ${terr}`,
      t: 's',
      s: cardHeaderStyle(row),
    }], 28);
    addMerge(0, NC - 1);

    // DATES + ASSIGNEE
    const assignee = row.assignee || row.technician || 'Sin asignar';
    const closeTxt = row.ticketState === 'Cerrado' ? `✅ Cerrado: ${fmtIso(row.ticketEnd) || '—'}` : '🔓 En curso';
    addRow([
      { v: '📅', t: 's', s: dateLblS },
      { v: 'Inicio del ticket', t: 's', s: dateLblS },
      { v: fmtIso(row.ticketStart) || 'Sin fecha', t: 's', s: dateValS },
      { v: '👤  Asignado a', t: 's', s: dateLblS },
      { v: assignee, t: 's', s: dateValS },
      { v: age ? `⏱ ${Number(age).toFixed(1)} d` : '—', t: 's', s: dateNumS },
      { v: closeTxt, t: 's', s: dateValS },
    ], 20);

    // STOP (only if present)
    if (stp > 0) {
      const slaBreach = stp > 7;
      const stopTxt = `${Number(stp).toFixed(2)} días acumulados${slaBreach ? '  ⚠ BRECHA SLA > 7 d' : ''}`;
      addRow([
        { v: '⏸', t: 's', s: stopLblS },
        { v: 'Parada de servicio', t: 's', s: stopLblS },
        { v: stopTxt, t: 's', s: slaBreach ? stopWarnS : stopValS },
        { v: '🗓 Inicio', t: 's', s: stopLblS },
        { v: fmtIso(row.stopStart) || '—', t: 's', s: stopValS },
        { v: '🗓 Fin', t: 's', s: stopLblS },
        { v: fmtIso(row.stopEnd) || 'En curso', t: 's', s: stopValS },
      ], 20);
    }

    // NLP TOPIC
    const conf    = row.textAnalytics?.confidence != null ? `${Math.round(row.textAnalytics.confidence * 100)}%` : '—';
    const alrTxt  = (row.textAnalytics?.alertLabels || []).join('  ·  ') || 'Ninguna detectada';
    const signals = (row.textAnalytics?.matchedSignals || []).slice(0, 5).join(', ') || '—';
    addRow([
      { v: '🧠', t: 's', s: nlpLblS },
      { v: 'Tema NLP detectado', t: 's', s: nlpLblS },
      { v: `${ticon}  ${topic}`, t: 's', s: nlpTopS },
      { v: `Confianza: ${conf}`, t: 's', s: nlpTopS },
      { v: `⚠ Alertas: ${alrTxt}`, t: 's', s: alrTxt !== 'Ninguna detectada' ? nlpAltS : nlpTopS },
    ], 20);
    addMerge(4, NC - 1);

    // SIGNALS (only if present)
    if (row.textAnalytics?.matchedSignals?.length) {
      addRow([
        { v: '🔑', t: 's', s: nlpLblS },
        { v: 'Señales textuales clave', t: 's', s: nlpLblS },
        { v: signals, t: 's', s: nlpTopS },
      ], 18);
      addMerge(2, NC - 1);
    }

    // COMMENT TIMELINE
    const thread = parseCommentEntries(row.openingComment, row.resolutionComment);

    // Sub-header
    addRow([
      { v: '📋', t: 's', s: tlHeadS },
      { v: `Historial de comentarios  ·  ${thread.length} ${thread.length === 1 ? 'entrada' : 'entradas'}`, t: 's', s: tlHeadS },
    ], 18);
    addMerge(1, NC - 1);

    if (thread.length === 0) {
      addRow([
        { v: '', t: 's', s: cmtNoneS },
        { v: '─ Sin comentarios registrados para este ticket ─', t: 's', s: cmtNoneS },
      ], 18);
      addMerge(1, NC - 1);
    } else {
      thread.forEach((entry) => {
        const tp   = tipoColors(entry.tipo);
        const iconS = { fill: bgFill(tp.bg), font: { sz: 10, color: { rgb: tp.fg } }, alignment: { horizontal: 'center', vertical: 'top' }, border: fb(tp.bdr) };
        const lblS  = { fill: bgFill(tp.bg), font: { bold: true,  sz: 9, color: { rgb: tp.fg } }, alignment: { horizontal: 'left', vertical: 'top' }, border: fb(tp.bdr) };
        const dateS = { fill: bgFill(tp.bg), font: { italic: true, sz: 8, color: { rgb: tp.fg } }, alignment: { horizontal: 'left', vertical: 'top' }, border: fb(tp.bdr) };
        const txtS  = { fill: bgFill('FAFBFC'), font: { sz: 9, color: { rgb: '1A2A3A' } }, alignment: { horizontal: 'left', vertical: 'top', wrapText: true }, border: fb('D1D5DB') };
        const textLen = (entry.texto || '').length;
        const hpt = Math.min(Math.max(Math.ceil(textLen / 95) * 14, 22), 110);
        addRow([
          { v: tp.icon,          t: 's', s: iconS },
          { v: entry.tipo,       t: 's', s: lblS  },
          { v: entry.fecha || '—', t: 's', s: dateS },
          { v: entry.texto || '', t: 's', s: txtS  },
        ], hpt);
        addMerge(3, NC - 1);
      });
    }

    // CLOSURE QUESTIONS
    const questions = makeQuestions(row);
    addRow([
      { v: '❓', t: 's', s: qLblS },
      { v: 'Preguntas orientadoras para cierre', t: 's', s: qLblS },
      { v: questions.join('\n'), t: 's', s: qValS },
    ], Math.max(questions.length * 14, 30));
    addMerge(2, NC - 1);

    // SEPARATOR
    addRow(Array(NC).fill({ v: '', t: 's', s: sepS }), 10);
    addMerge(0, NC - 1);
  });

  if (sorted.length === 0) {
    addRow([{ v: 'No hay tickets disponibles para mostrar en el seguimiento.', t: 's', s: blkS }], 28);
    addMerge(0, NC - 1);
  }

  // ── Assemble ─────────────────────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(cells);
  ws['!merges'] = merges;
  ws['!rows']   = heights;
  ws['!cols']   = [
    { wch: 4 }, { wch: 30 }, { wch: 32 }, { wch: 18 }, { wch: 38 }, { wch: 14 }, { wch: 20 },
  ];
  return ws;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
export function exportTableCsv(filename, columns, rows) {
  function esc(v) {
    const t = String(v ?? '');
    return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  }
  const header = columns.map((c) => esc(c.label)).join(';');
  const body = rows.map((row) =>
    columns.map((c) => esc(c.exportValue ? c.exportValue(row) : row[c.key])).join(';'),
  );
  const payload = [header, ...body].join('\n');
  download(new Blob(['\uFEFF' + payload], { type: 'text/csv;charset=utf-8' }), filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export async function exportTableExcel(filename, columns, rows, meta = {}) {
  const XLSX = (await import('xlsx-js-style')).default;

  const wb = XLSX.utils.book_new();

  if (meta.type === 'operators') {
    // Operators-specific workbook
    XLSX.utils.book_append_sheet(wb, buildOperadoresSheet(XLSX, rows, meta.tickets || []), 'Operadores');
    XLSX.utils.book_append_sheet(wb, buildGlosarioSheet(XLSX), 'Glosario de columnas');

    const TAB_COLORS = [
      '0F766E', // Operadores → teal
      '6C3483', // Glosario   → deep purple
    ];
    if (!wb.Workbook) wb.Workbook = { Sheets: [] };
    if (!wb.Workbook.Sheets) wb.Workbook.Sheets = [];
    while (wb.Workbook.Sheets.length < TAB_COLORS.length) wb.Workbook.Sheets.push({});
    TAB_COLORS.forEach((rgb, i) => {
      wb.Workbook.Sheets[i] = { ...wb.Workbook.Sheets[i], color: { rgb } };
    });
  } else {
    XLSX.utils.book_append_sheet(wb, buildInformeSheet(XLSX, columns, rows, meta), 'Informe');
    XLSX.utils.book_append_sheet(wb, buildDatosSheet(XLSX, columns, rows), 'Datos completos');
    XLSX.utils.book_append_sheet(wb, buildSeguimientoSheet(XLSX, rows), 'Seguimiento de Casos');
    XLSX.utils.book_append_sheet(wb, buildGraficasSheet(XLSX, rows), 'Gráficas ANS');
    XLSX.utils.book_append_sheet(wb, buildGlosarioSheet(XLSX), 'Glosario de columnas');

    // ── Sheet tab colors ──────────────────────────────────────────────────────
    const TAB_COLORS = [
      '1B4F8A', // Informe              → royal blue
      '0E6655', // Datos completos      → dark teal-green
      '922B21', // Seguimiento de Casos → deep crimson
      '5B2C8A', // Gráficas ANS        → deep violet
      '6C3483', // Glosario             → deep purple
    ];
    if (!wb.Workbook) wb.Workbook = { Sheets: [] };
    if (!wb.Workbook.Sheets) wb.Workbook.Sheets = [];
    while (wb.Workbook.Sheets.length < TAB_COLORS.length) wb.Workbook.Sheets.push({});
    TAB_COLORS.forEach((rgb, i) => {
      wb.Workbook.Sheets[i] = { ...wb.Workbook.Sheets[i], color: { rgb } };
    });
  }

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  download(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gráficas ANS sheet — visual bar charts via cell gradients
// ─────────────────────────────────────────────────────────────────────────────
function buildGraficasSheet(XLSX, rows) {
  const ANS_THRESHOLD = 12; // hours
  const cells  = [];
  const merges = [];
  const heights = [];
  const BAR_COLS = 20; // columns used for bar chart area

  const fb = (c, s = 'thin') => { const x = { style: s, color: { rgb: c } }; return { top: x, bottom: x, left: x, right: x }; };
  const bg = (hex) => ({ fgColor: { rgb: hex } });

  const titleS = { fill: bg('0B1D3A'), font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 16 }, alignment: { horizontal: 'center', vertical: 'center' }, border: fb('0B1D3A', 'medium') };
  const subS   = { fill: bg('0F2A4A'), font: { bold: false, color: { rgb: '93C5FD' }, sz: 9 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
  const secS   = (hex) => ({ fill: bg(hex), font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 }, alignment: { horizontal: 'left', vertical: 'center' }, border: fb(hex, 'medium') });
  const lblS   = { fill: bg('112A56'), font: { bold: true, color: { rgb: 'D9EEFF' }, sz: 9 }, alignment: { horizontal: 'left', vertical: 'center' }, border: fb('1B3A6A') };
  const pctS   = (good) => ({ fill: bg(good ? '0D3322' : '3B0A0A'), font: { bold: true, color: { rgb: good ? '4ADE80' : 'F87171' }, sz: 9 }, alignment: { horizontal: 'center', vertical: 'center' }, border: fb(good ? '166534' : '991B1B') });
  const barFill = (hex) => ({ fill: bg(hex), border: fb(hex) });
  const barEmpty = { fill: bg('0A1830'), border: fb('0E2248') };
  const numS   = { fill: bg('0B1D3A'), font: { bold: true, color: { rgb: 'F5A623' }, sz: 9 }, alignment: { horizontal: 'center', vertical: 'center' } };
  const sep    = { fill: bg('07111F'), font: { sz: 3 } };

  function push(row, hpt = 16) {
    const NC = 2 + BAR_COLS + 3;
    while (row.length < NC) row.push({ v: '', t: 's', s: sep });
    cells.push(row);
    heights.push({ hpt });
  }
  function addMerge(r, c1, c2) {
    merges.push({ s: { r, c: c1 }, e: { r, c: c2 } });
  }
  function cell(v, s, t = 's') { return { v: v ?? '', t, s }; }

  // ── Compute ANS stats ─────────────────────────────────────────────────────
  function computeAns(row) {
    const start = row.faultStart || row.ticketStart || row.referenceDate;
    const rawEnd = row.faultEnd || row.ticketEnd;
    const isOpen = row.ticketState === 'Abierto';
    const refEnd = rawEnd || (isOpen ? new Date().toISOString() : null);
    if (!start || !refEnd) return null;
    const stopH = (row.currentStopDays || row.stopDaysTotal || 0) * 24;
    const grossH = (new Date(refEnd) - new Date(start)) / 3600000;
    const netH = Math.max(0, grossH - stopH);
    return { netH, stopH, grossH, ok: netH <= ANS_THRESHOLD, isOpen };
  }

  const enriched = rows.map((r) => ({ ...r, _a: computeAns(r) })).filter((r) => r._a);
  const total   = enriched.length;
  const cumple  = enriched.filter((r) => r._a.ok).length;
  const incumple = total - cumple;
  const rate    = total ? Math.round((cumple / total) * 100) : 0;
  const exportDate = new Date().toLocaleString('es-CO');

  // ── Title ─────────────────────────────────────────────────────────────────
  push([cell('INRED · ANÁLISIS DE TIEMPOS DE RESPUESTA (ANS)', titleS)], 40);
  addMerge(cells.length - 1, 0, 2 + BAR_COLS + 2);
  push([cell(`Límite: ${ANS_THRESHOLD} h netas · ${total} tickets analizados · Exportado: ${exportDate}`, subS)], 22);
  addMerge(cells.length - 1, 0, 2 + BAR_COLS + 2);
  push([cell('', sep)], 8);
  addMerge(cells.length - 1, 0, 2 + BAR_COLS + 2);

  // ── Summary KPI row ────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Total analizados', value: total,    color: '1B4F8A', fgHex: '93C5FD' },
    { label: 'Dentro del límite ✓', value: cumple,   color: '0D3322', fgHex: '4ADE80' },
    { label: 'Fuera del límite ✗', value: incumple, color: '3B0A0A', fgHex: 'F87171' },
    { label: '% Cumplimiento', value: `${rate}%`, color: rate >= 80 ? '0D3322' : rate >= 50 ? '3B2200' : '3B0A0A', fgHex: rate >= 80 ? '4ADE80' : rate >= 50 ? 'F5A623' : 'F87171' },
    { label: 'Abiertos excedidos', value: enriched.filter(r => !r._a.ok && r._a.isOpen).length, color: '3B0A0A', fgHex: 'FCA5A5' },
  ];
  kpis.forEach((k) => {
    const r = cells.length;
    push([
      cell(k.label, { fill: bg(k.color), font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 9 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: fb(k.color) }),
      cell(String(k.value), { fill: bg(k.color), font: { bold: true, color: { rgb: k.fgHex }, sz: 18 }, alignment: { horizontal: 'center', vertical: 'center' }, border: fb(k.color) }),
    ], 36);
    addMerge(r, 0, 0);
    addMerge(r, 1, 4);
  });

  push([cell('', sep)], 8);
  addMerge(cells.length - 1, 0, 2 + BAR_COLS + 2);

  // ── Chart 1: By Department ────────────────────────────────────────────────
  push([cell('📊  CUMPLIMIENTO POR DEPARTAMENTO  (% tickets dentro del límite)', secS('1E3A8A'))], 26);
  addMerge(cells.length - 1, 0, 2 + BAR_COLS + 2);

  // Column headers
  push([
    cell('Departamento', lblS),
    cell('Total', numS),
    ...Array(BAR_COLS).fill(cell('', barEmpty)),
    cell('Cumple', { fill: bg('0D3322'), font: { bold: true, color: { rgb: '4ADE80' }, sz: 8 }, alignment: { horizontal: 'center' } }),
    cell('Excede', { fill: bg('3B0A0A'), font: { bold: true, color: { rgb: 'F87171' }, sz: 8 }, alignment: { horizontal: 'center' } }),
    cell('%', numS),
  ], 18);

  const byDept = new Map();
  enriched.forEach((r) => {
    const k = r.department || 'Sin dato';
    const cur = byDept.get(k) || { total: 0, ok: 0 };
    cur.total += 1;
    if (r._a.ok) cur.ok += 1;
    byDept.set(k, cur);
  });
  const deptRows = [...byDept.entries()]
    .map(([label, m]) => ({ label, total: m.total, ok: m.ok, fail: m.total - m.ok, rate: m.total ? Math.round((m.ok / m.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 18);

  deptRows.forEach((d) => {
    const filled = Math.round((d.rate / 100) * BAR_COLS);
    const barCells = [];
    for (let i = 0; i < BAR_COLS; i++) {
      const isGood = i < filled;
      const hex = isGood ? (d.rate >= 80 ? '166534' : d.rate >= 50 ? '854D0E' : '991B1B') : '0A1830';
      barCells.push(cell(i === 0 && filled > 0 ? '' : '', 'string' in {} ? {} : { fill: bg(hex), border: fb(hex) }));
      barCells[i] = { v: '', t: 's', s: isGood ? barFill(d.rate >= 80 ? '16A34A' : d.rate >= 50 ? 'CA8A04' : 'DC2626') : barEmpty };
    }
    push([
      cell(d.label, { fill: bg('0C1E40'), font: { color: { rgb: 'CBD5E1' }, sz: 9 }, alignment: { horizontal: 'left', vertical: 'center' }, border: fb('1B3A6A') }),
      { v: d.total, t: 'n', s: numS },
      ...barCells,
      { v: d.ok,   t: 'n', s: { fill: bg('0D3322'), font: { bold: true, color: { rgb: '4ADE80' }, sz: 9 }, alignment: { horizontal: 'center' } } },
      { v: d.fail, t: 'n', s: { fill: bg('3B0A0A'), font: { bold: true, color: { rgb: 'F87171' }, sz: 9 }, alignment: { horizontal: 'center' } } },
      cell(`${d.rate}%`, pctS(d.rate >= 80)),
    ], 18);
  });

  push([cell('', sep)], 8);
  addMerge(cells.length - 1, 0, 2 + BAR_COLS + 2);

  // ── Chart 2: By Priority ──────────────────────────────────────────────────
  push([cell('📊  CUMPLIMIENTO POR PRIORIDAD', secS('7B2D8B'))], 26);
  addMerge(cells.length - 1, 0, 2 + BAR_COLS + 2);

  push([
    cell('Prioridad', lblS),
    cell('Total', numS),
    ...Array(BAR_COLS).fill(cell('', barEmpty)),
    cell('Cumple', { fill: bg('0D3322'), font: { bold: true, color: { rgb: '4ADE80' }, sz: 8 }, alignment: { horizontal: 'center' } }),
    cell('Excede', { fill: bg('3B0A0A'), font: { bold: true, color: { rgb: 'F87171' }, sz: 8 }, alignment: { horizontal: 'center' } }),
    cell('%', numS),
  ], 18);

  const priMap = new Map();
  enriched.forEach((r) => {
    const k = r.priority || 'Sin dato';
    const cur = priMap.get(k) || { total: 0, ok: 0 };
    cur.total += 1;
    if (r._a.ok) cur.ok += 1;
    priMap.set(k, cur);
  });
  const PRI_ORDER = ['Alta', 'Media', 'Baja', 'Sin dato'];
  const PRI_COLOR = { Alta: 'B91C1C', Media: 'B45309', Baja: '15803D', 'Sin dato': '334155' };
  [...priMap.entries()]
    .sort((a, b) => PRI_ORDER.indexOf(a[0]) - PRI_ORDER.indexOf(b[0]))
    .forEach(([label, m]) => {
      const d = { label, total: m.total, ok: m.ok, fail: m.total - m.ok, rate: m.total ? Math.round((m.ok / m.total) * 100) : 0 };
      const filled = Math.round((d.rate / 100) * BAR_COLS);
      const colHex = PRI_COLOR[label] || '334155';
      const barCells = Array.from({ length: BAR_COLS }, (_, i) =>
        ({ v: '', t: 's', s: i < filled ? barFill(colHex) : barEmpty })
      );
      push([
        cell(label, { fill: bg('0C1E40'), font: { bold: true, color: { rgb: colHex }, sz: 9 }, alignment: { horizontal: 'left', vertical: 'center' }, border: fb('1B3A6A') }),
        { v: d.total, t: 'n', s: numS },
        ...barCells,
        { v: d.ok,   t: 'n', s: { fill: bg('0D3322'), font: { bold: true, color: { rgb: '4ADE80' }, sz: 9 }, alignment: { horizontal: 'center' } } },
        { v: d.fail, t: 'n', s: { fill: bg('3B0A0A'), font: { bold: true, color: { rgb: 'F87171' }, sz: 9 }, alignment: { horizontal: 'center' } } },
        cell(`${d.rate}%`, pctS(d.rate >= 80)),
      ], 22);
    });

  push([cell('', sep)], 8);
  addMerge(cells.length - 1, 0, 2 + BAR_COLS + 2);

  // ── Chart 3: Top 15 tickets excedidos ────────────────────────────────────
  push([cell('🔴  TOP 15 TICKETS CON MAYOR EXCEDENTE (tiempo neto sobre el límite)', secS('7F1D1D'))], 26);
  addMerge(cells.length - 1, 0, 2 + BAR_COLS + 2);

  const hdrs = ['Ticket', 'Operador', 'Depto.', 'Prioridad', 'T.Bruto(h)', 'T.Parada(h)', 'T.Neto(h)', 'Excedente(h)', 'Estado', 'Abierto?'];
  push(hdrs.map((h) => cell(h, { fill: bg('1E3A8A'), font: { bold: true, color: { rgb: 'DBEAFE' }, sz: 8 }, alignment: { horizontal: 'center', vertical: 'center' }, border: fb('1E3A8A') })), 20);

  const top15 = [...enriched]
    .filter((r) => !r._a.ok)
    .sort((a, b) => (b._a.netH - ANS_THRESHOLD) - (a._a.netH - ANS_THRESHOLD))
    .slice(0, 15);

  top15.forEach((r, i) => {
    const isAlt = i % 2 === 1;
    const bgHex = isAlt ? '1A0A0A' : '200A0A';
    const fmtH = (v) => (v != null && isFinite(v)) ? +v.toFixed(1) : 0;
    const excess = Math.max(0, r._a.netH - ANS_THRESHOLD);
    push([
      cell(`#${r.ticketId}`, { fill: bg(bgHex), font: { bold: true, color: { rgb: 'FCA5A5' }, sz: 9 }, alignment: { horizontal: 'center' } }),
      cell(r.operatorCode || r.assignee || '—', { fill: bg(bgHex), font: { color: { rgb: 'E2E8F0' }, sz: 9 } }),
      cell(r.department || '—', { fill: bg(bgHex), font: { color: { rgb: '94A3B8' }, sz: 9 } }),
      cell(r.priority || '—', { fill: bg(bgHex), font: { bold: true, color: { rgb: PRI_COLOR[r.priority] || '94A3B8' }, sz: 9 }, alignment: { horizontal: 'center' } }),
      { v: fmtH(r._a.grossH), t: 'n', s: { fill: bg(bgHex), font: { color: { rgb: '94A3B8' }, sz: 9 }, alignment: { horizontal: 'center' } } },
      { v: fmtH(r._a.stopH),  t: 'n', s: { fill: bg(bgHex), font: { color: { rgb: 'F5A623' }, sz: 9 }, alignment: { horizontal: 'center' } } },
      { v: fmtH(r._a.netH),   t: 'n', s: { fill: bg(bgHex), font: { bold: true, color: { rgb: 'F87171' }, sz: 9 }, alignment: { horizontal: 'center' } } },
      { v: fmtH(excess),      t: 'n', s: { fill: bg('4A0E0E'), font: { bold: true, color: { rgb: 'FECACA' }, sz: 10 }, alignment: { horizontal: 'center' }, border: fb('991B1B') } },
      cell(r.ticketState || '—', { fill: bg(bgHex), font: { color: { rgb: '94A3B8' }, sz: 9 }, alignment: { horizontal: 'center' } }),
      cell(r._a.isOpen ? 'Sí ⚠' : 'No', { fill: bg(r._a.isOpen ? '3B0A0A' : '0D1F0A'), font: { bold: true, color: { rgb: r._a.isOpen ? 'F87171' : '4ADE80' }, sz: 9 }, alignment: { horizontal: 'center' } }),
    ], 18);
  });

  if (top15.length === 0) {
    push([cell('✅  Todos los tickets cumplen el límite de tiempo ANS.', { fill: bg('0D3322'), font: { bold: true, color: { rgb: '4ADE80' }, sz: 10 }, alignment: { horizontal: 'center' } })], 24);
    addMerge(cells.length - 1, 0, 2 + BAR_COLS + 2);
  }

  // ── Assemble ─────────────────────────────────────────────────────────────
  const NC = 2 + BAR_COLS + 3;
  const ws = XLSX.utils.aoa_to_sheet(cells.map((row) => row.map((c) => c.v)));
  cells.forEach((row, r) => {
    row.forEach((c, col) => {
      const addr = XLSX.utils.encode_cell({ r, c: col });
      ws[addr] = { v: c.v, t: c.t, s: c.s };
    });
  });
  ws['!merges'] = merges;
  ws['!rows']   = heights;
  ws['!cols']   = [
    { wch: 28 }, // label
    { wch: 7  }, // total
    ...Array(BAR_COLS).fill({ wch: 1.5 }),
    { wch: 9 }, { wch: 9 }, { wch: 8 },
  ];
  ws['!freeze'] = { xSplit: 0, ySplit: 3, topLeftCell: 'A4', activeCell: 'A4' };
  return ws;
}

// ─────────────────────────────────────────────────────────────────────────────
// Operadores sheet – per-operator activity metrics + daily activity table
// ─────────────────────────────────────────────────────────────────────────────
function buildOperadoresSheet(XLSX, rows, tickets = []) {
  const cells  = [];
  const merges = [];
  const heights = [];
  const NC = 19;

  // ── Styles ────────────────────────────────────────────────────────────────
  const hdr  = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 }, fill: { fgColor: { rgb: '1A1A2E' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: { bottom: { style: 'medium', color: { rgb: 'F5A623' } } } };
  const sub  = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 }, fill: { fgColor: { rgb: 'E94560' } }, alignment: { horizontal: 'left', vertical: 'center', wrapText: true } };
  const lbl  = { font: { bold: true, color: { rgb: 'F5A623' }, sz: 9 }, fill: { fgColor: { rgb: '0D0D1E' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: { bottom: { style: 'thin', color: { rgb: 'F5A623' } } } };
  const dat  = { font: { color: { rgb: 'E2E8F0' }, sz: 9 }, fill: { fgColor: { rgb: '0A0A1E' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: { bottom: { style: 'hair', color: { rgb: '1E1E3F' } } } };
  const datL = { ...dat, alignment: { ...dat.alignment, horizontal: 'left' } };
  const datR = { ...dat, alignment: { ...dat.alignment, horizontal: 'right' } };
  const alt  = { ...dat, fill: { fgColor: { rgb: '0E0E26' } } };
  const altL = { ...alt, alignment: { ...alt.alignment, horizontal: 'left' } };
  const sep  = { font: { sz: 4 }, fill: { fgColor: { rgb: '060610' } } };
  const good = { ...dat, font: { ...dat.font, color: { rgb: '4ADE80' } } };
  const warn = { ...dat, font: { ...dat.font, color: { rgb: 'F5A623' } } };
  const bad  = { ...dat, font: { ...dat.font, color: { rgb: 'E94560' } } };
  const hi   = { ...dat, font: { ...dat.font, bold: true, color: { rgb: 'F5A623' } } };

  function push(row, hpt = 16) {
    while (row.length < NC) row.push({ v: '', t: 's', s: sep });
    cells.push(row);
    heights.push({ hpt });
  }
  function cell(v, style, t = 's') { return { v: v ?? '', t, s: style }; }
  function num(v, style, dec = 0)  {
    const n = typeof v === 'number' && isFinite(v) ? v : 0;
    return { v: dec > 0 ? +n.toFixed(dec) : Math.round(n), t: 'n', s: style };
  }
  function fmtDateTime(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso);
      const date = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const time = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      return `${date} ${time}`;
    } catch { return String(iso); }
  }
  function fmtDays(v) {
    if (!v || !isFinite(v) || v === 0) return '—';
    if (v < 1) return `${Math.round(v * 24)}h`;
    return `${v % 1 === 0 ? v : v.toFixed(1)}d`;
  }

  // ── Enrich operator rows with computed stats ───────────────────────────────
  const ticketsByOp = {};
  tickets.forEach((t) => {
    const touch = [t.assignee, t.creator, t.closer, t.responsible].filter(Boolean);
    touch.forEach((name) => {
      if (!ticketsByOp[name]) ticketsByOp[name] = [];
      ticketsByOp[name].push(t);
    });
  });

  const enriched = rows.map((op) => {
    const opTs = ticketsByOp[op.name] || [];
    const opened    = opTs.filter((t) => t.ticketState === 'Abierto').length;
    const closed    = opTs.filter((t) => t.ticketState === 'Cerrado').length;
    const cancelled = opTs.filter((t) => t.ticketState === 'Anulado').length;
    const closedWithMttr = opTs.filter((t) => t.ticketState === 'Cerrado' && (t.closeDurationDays || 0) > 0);
    const avgMttr = closedWithMttr.length ? closedWithMttr.reduce((a, b) => a + b.closeDurationDays, 0) / closedWithMttr.length : 0;
    const withStop = opTs.filter((t) => (t.currentStopDays || 0) > 0);
    const avgStop  = withStop.length ? withStop.reduce((a, b) => a + (b.currentStopDays || 0), 0) / withStop.length : 0;
    const dates = opTs.map((t) => t.ticketStart || t.referenceDate || '').filter(Boolean).sort();
    const firstActivity = dates[0] || op.firstActivity || '';
    const lastActivity  = dates[dates.length - 1] || op.lastActivity || '';

    // Top project
    const projCount = {};
    opTs.forEach((t) => { if (t.project) projCount[t.project] = (projCount[t.project] || 0) + 1; });
    const topProject = Object.entries(projCount).sort((a, b) => b[1] - a[1])[0]?.[0] || op.topProject || '—';

    // Top department / municipality
    const deptCount = {}, muniCount = {};
    opTs.forEach((t) => {
      if (t.department)  deptCount[t.department]  = (deptCount[t.department]  || 0) + 1;
      if (t.municipality) muniCount[t.municipality] = (muniCount[t.municipality] || 0) + 1;
    });
    const topDept = Object.entries(deptCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    const topMuni = Object.entries(muniCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return { ...op, opened, closed, cancelled, avgMttr, avgStop, firstActivity, lastActivity, topProject, topDept, topMuni };
  });

  // ── Title ─────────────────────────────────────────────────────────────────
  push([{ v: 'INRED · REPORTE DE ACTIVIDAD POR OPERADOR', t: 's', s: hdr }], 32);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: NC - 1 } });
  push([{ v: `${enriched.length} operadores analizados · exportado ${new Date().toLocaleString('es-CO')}`, t: 's', s: sub }], 14);
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: NC - 1 } });
  push([{ v: '', t: 's', s: sep }], 5);

  // ── Section label ─────────────────────────────────────────────────────────
  push([{ v: '1. MÉTRICAS AGREGADAS POR OPERADOR', t: 's', s: sub }], 18);
  merges.push({ s: { r: cells.length - 1, c: 0 }, e: { r: cells.length - 1, c: NC - 1 } });

  // ── Column headers ────────────────────────────────────────────────────────
  const COL_LABELS = [
    'Operador', 'Total', '% Cierre', 'Abiertos', 'Cerrados', 'Anulados',
    'Asignado', 'Creó', 'Cerró', 'Alta Pri.',
    'Tiempo res. prom. (días)', 'Parada prom. (días)',
    'Seguimientos', 'Comentarios',
    'Primera actividad', 'Última actividad',
    'Proyecto principal', 'Departamento top', 'Municipio top',
  ];
  const COL_WIDTHS = [30, 8, 9, 8, 8, 8, 8, 8, 8, 8, 14, 15, 12, 12, 17, 17, 28, 22, 22];
  push(COL_LABELS.map((l) => cell(l, lbl)), 24);

  // ── Data rows ─────────────────────────────────────────────────────────────
  enriched.forEach((op, i) => {
    const isAlt = i % 2 === 1;
    const d = isAlt ? alt : dat;
    const dL = isAlt ? altL : datL;
    const dR = { ...d, alignment: { ...d.alignment, horizontal: 'right' } };

    // MTTR style: green <7d, yellow <30d, red >=30d
    const mttrStyle = op.avgMttr === 0 ? d : op.avgMttr < 7 ? good : op.avgMttr < 30 ? warn : { ...dat, font: { ...dat.font, color: { rgb: 'F87171' } } };
    const stopStyle = op.avgStop === 0 ? d : op.avgStop < 3 ? good : op.avgStop < 14 ? warn : bad;

    const pctClose = op.totalTouched > 0 ? `${((op.closed / op.totalTouched) * 100).toFixed(1)}%` : '0%';
    const pctStyle = op.totalTouched > 0 && op.closed / op.totalTouched >= 0.8 ? good
                   : op.totalTouched > 0 && op.closed / op.totalTouched >= 0.5 ? warn : bad;

    push([
      cell(op.name, dL),
      num(op.totalTouched || 0, hi),
      cell(pctClose, pctStyle),
      num(op.opened || 0, d),
      num(op.closed || 0, good),
      num(op.cancelled || 0, d),
      num(op.assigned || 0, d),
      num(op.created || 0, d),
      num(op.closed || 0, d),
      num(op.highPri || 0, op.highPri > 5 ? bad : d),
      cell(fmtDays(op.avgMttr), mttrStyle),
      cell(fmtDays(op.avgStop), stopStyle),
      num(op.followUpCount || 0, d),
      num(op.commentCount || 0, d),
      cell(fmtDateTime(op.firstActivity), dR),
      cell(fmtDateTime(op.lastActivity), dR),
      cell(op.topProject || '—', dL),
      cell(op.topDept || '—', dL),
      cell(op.topMuni || '—', dL),
    ], 18);
  });

  // ── Monthly activity breakdown ────────────────────────────────────────────
  push([{ v: '', t: 's', s: sep }], 8);
  push([{ v: '2. ACTIVIDAD MENSUAL POR OPERADOR (tickets participados por mes)', t: 's', s: sub }], 18);
  merges.push({ s: { r: cells.length - 1, c: 0 }, e: { r: cells.length - 1, c: NC - 1 } });

  if (tickets.length > 0 && enriched.length > 0) {
    // Collect all months in data
    const monthSet = new Set();
    tickets.forEach((t) => {
      const m = (t.ticketStart || t.referenceDate || '').slice(0, 7);
      if (m.length === 7) monthSet.add(m);
    });
    const months = [...monthSet].sort().slice(-12); // last 12 months

    if (months.length > 0) {
      const NC_act = Math.min(months.length + 1, NC);
      // Header
      const actHdr = [
        cell('Operador', lbl),
        ...months.slice(0, NC - 1).map((m) => {
          const [y, mo] = m.split('-');
          const label = new Date(+y, +mo - 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
          return cell(label, lbl);
        }),
      ];
      push(actHdr, 22);

      enriched.forEach((op, i) => {
        const isAlt = i % 2 === 1;
        const d = isAlt ? alt : dat;
        const dL = isAlt ? altL : datL;
        const opTs = ticketsByOp[op.name] || [];
        const monthMap = {};
        opTs.forEach((t) => {
          const m = (t.ticketStart || t.referenceDate || '').slice(0, 7);
          if (m) monthMap[m] = (monthMap[m] || 0) + 1;
        });
        const row = [
          cell(op.name, dL),
          ...months.slice(0, NC - 1).map((m) => {
            const v = monthMap[m] || 0;
            const s = v === 0 ? { ...d, font: { ...d.font, color: { rgb: '334155' } } } : v >= 20 ? hi : d;
            return num(v, s);
          }),
        ];
        push(row, 16);
      });
    }
  }

  // ── Top-10 ranking ────────────────────────────────────────────────────────
  push([{ v: '', t: 's', s: sep }], 8);
  push([{ v: '3. TOP 10 OPERADORES — por tickets participados', t: 's', s: sub }], 18);
  merges.push({ s: { r: cells.length - 1, c: 0 }, e: { r: cells.length - 1, c: NC - 1 } });

  const top10Labels = ['#', 'Operador', 'Total', 'Cerrados', '% Cierre', 'Alta Prioridad', 'Tiempo res. prom.', 'Parada prom.', 'Proyecto principal'];
  const top10Widths = [5, 28, 8, 8, 9, 12, 14, 14, 28];
  const top10Hdr = top10Labels.map((l) => cell(l, lbl));
  push(top10Hdr, 22);

  const top10 = [...enriched].sort((a, b) => (b.totalTouched || 0) - (a.totalTouched || 0)).slice(0, 10);
  top10.forEach((op, i) => {
    const total = op.totalTouched || 1;
    const pctClose = total > 0 ? Math.round((op.closed / total) * 100) : 0;
    const rankStyle = i === 0 ? { ...hi, font: { ...hi.font, bold: true, sz: 10 } } : i < 3 ? hi : dat;
    push([
      cell(`${i + 1}`, rankStyle),
      cell(op.name, { ...rankStyle, alignment: { ...rankStyle.alignment, horizontal: 'left' } }),
      num(op.totalTouched || 0, rankStyle),
      num(op.closed || 0, good),
      cell(`${pctClose}%`, pctClose >= 80 ? good : pctClose >= 50 ? warn : bad),
      num(op.highPri || 0, op.highPri > 5 ? bad : dat),
      cell(fmtDays(op.avgMttr), dat),
      cell(fmtDays(op.avgStop), dat),
      cell(op.topProject || '—', { ...dat, alignment: { ...dat.alignment, horizontal: 'left' } }),
    ], 18);
  });

  // ── Build worksheet ───────────────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(cells.map((row) => row.map((c) => c.v)));
  cells.forEach((row, r) => {
    row.forEach((c, col) => {
      const addr = XLSX.utils.encode_cell({ r, c: col });
      ws[addr] = { v: c.v, t: c.t, s: c.s };
    });
  });
  ws['!merges'] = merges;
  ws['!rows']   = heights;
  ws['!cols']   = COL_WIDTHS.map((w) => ({ wch: w }));
  return ws;
}

// ─────────────────────────────────────────────────────────────────────────────
// Glosario sheet – one-page column dictionary
// ─────────────────────────────────────────────────────────────────────────────
function buildGlosarioSheet(XLSX) {
  const GLOSSARY = [
    ['IDENTIFICACIÓN', 'Ticket #',          'Número único del ticket en el sistema de gestión.'],
    ['IDENTIFICACIÓN', 'Cód. Operador',     'Código del operador de red asociado al ticket.'],
    ['IDENTIFICACIÓN', 'Cód. Cliente',      'Identificador del cliente (beneficiario del servicio).'],
    ['IDENTIFICACIÓN', 'ID Beneficiario',   'Identificador MINTIC del beneficiario del servicio.'],
    ['IDENTIFICACIÓN', 'Proyecto',          'Proyecto MINTIC o contrato al que pertenece el ticket.'],
    ['IDENTIFICACIÓN', 'Sub Proyecto',      'Subproyecto o componente dentro del proyecto principal.'],
    ['IDENTIFICACIÓN', 'Tipo',              'Tipo de solicitud (Incidente, Requerimiento, etc.).'],
    ['IDENTIFICACIÓN', 'Categoría',         'Categoría temática del ticket según clasificación operativa.'],
    ['ESTADO Y CLASIFICACIÓN', 'Estado',           'Estado actual: Abierto, Cerrado o Anulado.'],
    ['ESTADO Y CLASIFICACIÓN', 'Prioridad',        'Nivel de prioridad: Alta, Media o Baja.'],
    ['ESTADO Y CLASIFICACIÓN', 'Impacto',          'Nivel de impacto declarado en la apertura del ticket.'],
    ['ESTADO Y CLASIFICACIÓN', 'Urgencia',         'Nivel de urgencia declarado en la apertura del ticket.'],
    ['ESTADO Y CLASIFICACIÓN', 'Grupo Escalamiento','Grupo o área responsable del escalamiento del caso.'],
    ['ESTADO Y CLASIFICACIÓN', 'Fuente Origen',    'Canal por el que se originó el ticket (Portal, Llamada, etc.).'],
    ['ESTADO Y CLASIFICACIÓN', 'Responsable',      'Persona o área responsable de la resolución.'],
    ['TERRITORIO', 'Departamento',   'Departamento geográfico colombiano del sitio afectado.'],
    ['TERRITORIO', 'Municipio',      'Municipio donde se ubica el sitio o beneficiario afectado.'],
    ['TERRITORIO', 'Centro Poblado', 'Centro poblado o localidad más específica del sitio.'],
    ['TERRITORIO', 'Región',         'Región geográfica macro (Caribe, Andina, Pacífica, etc.).'],
    ['TRAZABILIDAD TEMPORAL', 'Inicio Ticket',    'Fecha en que se creó o abrió el ticket en el sistema.'],
    ['TRAZABILIDAD TEMPORAL', 'Fin Ticket',       'Fecha en que se cerró o anuló el ticket.'],
    ['TRAZABILIDAD TEMPORAL', 'Creación Cliente', 'Fecha de creación registrada por el cliente o portal externo.'],
    ['TRAZABILIDAD TEMPORAL', 'Días Abierto',     'Días transcurridos desde el inicio hasta la fecha de exportación (solo tickets abiertos).'],
    ['TRAZABILIDAD TEMPORAL', 'Tiempo res. (días)',      'Días entre inicio y fin del ticket.'],
    ['EQUIPO ASIGNADO', 'Creado Por',       'Usuario que creó el ticket en el sistema.'],
    ['EQUIPO ASIGNADO', 'Asignado A',       'Usuario o grupo actualmente responsable del ticket.'],
    ['EQUIPO ASIGNADO', 'Cerrado Por',      'Usuario que realizó el cierre formal del ticket.'],
    ['EQUIPO ASIGNADO', 'Técnico Asignado', 'Técnico de campo o soporte asignado para atención in situ.'],
    ['MANTENIMIENTO', 'ID Mnt.',      'Identificador del registro de mantenimiento vinculado.'],
    ['MANTENIMIENTO', 'Estado Mnt.',  'Estado actual del proceso de mantenimiento asociado.'],
    ['MANTENIMIENTO', 'Inicio Mnt.',  'Fecha de inicio del mantenimiento programado.'],
    ['MANTENIMIENTO', 'Fin Mnt.',     'Fecha de cierre del mantenimiento.'],
    ['MANTENIMIENTO', 'Técnico Mnt.', 'Técnico responsable de la ejecución del mantenimiento.'],
    ['PARADA DE SERVICIO', 'Inicio Parada', 'Fecha de inicio de la parada de servicio reportada.'],
    ['PARADA DE SERVICIO', 'Fin Parada',   'Fecha de fin de la parada de servicio.'],
    ['PARADA DE SERVICIO', 'Días Parada',  'Días acumulados de parada dentro del horizonte temporal visible.'],
    ['PARADA DE SERVICIO', 'Segmentos',    'Número de segmentos o eventos de parada registrados para este ticket.'],
    ['PARADA DE SERVICIO', 'Inicio Falla', 'Fecha de inicio de la falla técnica que originó la parada.'],
    ['PARADA DE SERVICIO', 'Fin Falla',    'Fecha de restitución del servicio tras la falla.'],
    ['PARADA DE SERVICIO', 'Días Falla',   'Duración en días del período de falla técnica.'],
    ['COMENTARIOS', 'Comentario Apertura', 'Texto literal del comentario registrado al abrir el ticket.'],
    ['COMENTARIOS', 'Comentario Solución', 'Texto literal del comentario de resolución registrado al cerrar el ticket.'],
  ];

  const brd = (c, s = 'thin') => ({ style: s, color: { rgb: c } });
  const fb  = (c) => { const x = brd(c); return { top: x, bottom: x, left: x, right: x }; };

  const titleS = { fill: bgFill('0F2A4A'), font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 }, alignment: { horizontal: 'center', vertical: 'center' }, border: fb('0F2A4A') };
  const headS  = { fill: bgFill('1B3A5C'), font: { bold: true, color: { rgb: 'D9EEFF' }, sz: 10 }, alignment: { horizontal: 'center', vertical: 'center' }, border: fb('1B3A5C') };

  const secColors = {
    'IDENTIFICACIÓN': '0F2A4A', 'ESTADO Y CLASIFICACIÓN': '1B3A5C', 'TERRITORIO': '1A4971',
    'TRAZABILIDAD TEMPORAL': '1E5276', 'EQUIPO ASIGNADO': '245980', 'MANTENIMIENTO': '1D4E6B',
    'PARADA DE SERVICIO': '7B1A1A', 'COMENTARIOS': '3A2A00',
  };

  const secStyle = (sec) => ({
    fill: bgFill(secColors[sec] || '1B3A5C'),
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 9 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: fb(secColors[sec] || '1B3A5C'),
  });
  const colStyle = (sec, isAlt) => ({
    fill: bgFill(isAlt ? 'EBF4FF' : 'FFFFFF'),
    font: { bold: true, color: { rgb: '1B3A5C' }, sz: 9 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: fb('C5D8EF'),
  });
  const descStyle = (sec, isAlt) => ({
    fill: bgFill(isAlt ? 'EBF4FF' : 'FFFFFF'),
    font: { bold: false, color: { rgb: '334155' }, sz: 9 },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: fb('C5D8EF'),
  });

  const cells = [];
  const merges = [];
  const heights = [];

  cells.push([{ v: 'INRED · Glosario de Columnas — Datos completos', t: 's', s: titleS }, { v: '', t: 's', s: titleS }, { v: '', t: 's', s: titleS }]);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });
  heights.push({ hpt: 36 });

  cells.push([
    { v: 'Sección', t: 's', s: headS },
    { v: 'Columna', t: 's', s: headS },
    { v: 'Descripción', t: 's', s: headS },
  ]);
  heights.push({ hpt: 20 });

  GLOSSARY.forEach(([sec, col, desc], i) => {
    const isAlt = i % 2 !== 0;
    cells.push([
      { v: sec,  t: 's', s: secStyle(sec) },
      { v: col,  t: 's', s: colStyle(sec, isAlt) },
      { v: desc, t: 's', s: descStyle(sec, isAlt) },
    ]);
    heights.push({ hpt: 20 });
  });

  const ws = XLSX.utils.aoa_to_sheet(cells);
  ws['!merges'] = merges;
  ws['!rows']   = heights;
  ws['!cols']   = [{ wch: 26 }, { wch: 22 }, { wch: 70 }];
  ws['!freeze'] = { xSplit: 0, ySplit: 2, topLeftCell: 'A3', activeCell: 'A3' };
  return ws;
}

// ═════════════════════════════════════════════════════════════════════════════
// exportJDIReport — Informe ANS dedicado Juntas de Internet (GP-D-JDI-023)
// ═════════════════════════════════════════════════════════════════════════════
export async function exportJDIReport(availCtx, meta = {}) {
  const XLSX = (await import('xlsx-js-style')).default;
  const wb   = XLSX.utils.book_new();

  const exportDate = new Date().toLocaleString('es-CO');
  const periodH    = availCtx?.kpis?.periodHours ?? 720;

  // ── Shared style helpers ─────────────────────────────────────────────────
  const bg   = (hex) => ({ fgColor: { rgb: hex } });
  const fb   = (c, s = 'thin') => { const x = { style: s, color: { rgb: c } }; return { top: x, bottom: x, left: x, right: x }; };
  const cell = (v, s, t = 's') => ({ v: v ?? '', t, s });
  const num  = (v, s) => ({ v: v ?? 0, t: 'n', s });

  // ─── Style presets ────────────────────────────────────────────────────────
  const PALETTE = {
    navy:   '0A1628',
    blue1:  '0F2044',
    blue2:  '1A3A6E',
    blue3:  '2563EB',
    teal:   '0F766E',
    green1: '064E3B',
    green2: '065F46',
    green3: '10B981',
    amber1: '78350F',
    amber2: 'D97706',
    red1:   '450A0A',
    red2:   '991B1B',
    red3:   'EF4444',
    slate:  '1E293B',
    muted:  '334155',
    white:  'FFFFFF',
    silver: 'CBD5E1',
    light:  '94A3B8',
  };

  const titleS = {
    fill: bg(PALETTE.navy),
    font: { bold: true, color: { rgb: PALETTE.white }, sz: 20, name: 'Calibri' },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: fb(PALETTE.navy, 'medium'),
  };
  const subTitleS = {
    fill: bg(PALETTE.blue1),
    font: { bold: false, color: { rgb: '93C5FD' }, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  };
  const sectionS = (hex) => ({
    fill: bg(hex),
    font: { bold: true, color: { rgb: PALETTE.white }, sz: 11 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: fb(hex, 'medium'),
  });
  const headerS = {
    fill: bg(PALETTE.blue2),
    font: { bold: true, color: { rgb: PALETTE.white }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: fb(PALETTE.blue2),
  };
  const rowEven = {
    fill: bg(PALETTE.blue1),
    font: { color: { rgb: PALETTE.silver }, sz: 9 },
    alignment: { vertical: 'center' },
    border: fb(PALETTE.muted),
  };
  const rowOdd = {
    fill: bg(PALETTE.navy),
    font: { color: { rgb: PALETTE.silver }, sz: 9 },
    alignment: { vertical: 'center' },
    border: fb(PALETTE.muted),
  };
  const sepS = { fill: bg('05101F'), font: { sz: 3 } };
  const noteS = {
    fill: bg(PALETTE.blue1),
    font: { color: { rgb: PALETTE.light }, sz: 8, italic: true },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
  };

  const kpiCardS = (hex) => ({
    fill: bg(hex),
    font: { bold: true, color: { rgb: PALETTE.white }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: fb(hex, 'medium'),
  });
  const kpiValS = (fgHex, bgHex) => ({
    fill: bg(bgHex),
    font: { bold: true, color: { rgb: fgHex }, sz: 22 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: fb(bgHex, 'medium'),
  });

  const cumpleS = {
    fill: bg(PALETTE.green1),
    font: { bold: true, color: { rgb: PALETTE.green3 }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: fb(PALETTE.teal),
  };
  const incumpleS = {
    fill: bg(PALETTE.red1),
    font: { bold: true, color: { rgb: PALETTE.red3 }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: fb(PALETTE.red2),
  };
  const availGoodS  = { fill: bg(PALETTE.green1), font: { bold: true, color: { rgb: PALETTE.green3 }, sz: 9 }, alignment: { horizontal: 'right', vertical: 'center' }, border: fb(PALETTE.teal) };
  const availWarnS  = { fill: bg(PALETTE.amber1), font: { bold: true, color: { rgb: PALETTE.amber2 }, sz: 9 }, alignment: { horizontal: 'right', vertical: 'center' }, border: fb(PALETTE.amber1) };
  const availBadS   = { fill: bg(PALETTE.red1),   font: { bold: true, color: { rgb: PALETTE.red3   }, sz: 9 }, alignment: { horizontal: 'right', vertical: 'center' }, border: fb(PALETTE.red2) };
  const numGoodS    = { ...availGoodS,  alignment: { horizontal: 'center', vertical: 'center' } };
  const numBadS     = { ...availBadS,   alignment: { horizontal: 'center', vertical: 'center' } };

  // ─────────────────────────────────────────────────────────────────────────
  // SHEET 1 — Resumen Ejecutivo JDI
  // ─────────────────────────────────────────────────────────────────────────
  function buildResumenSheet() {
    const cells = [], merges = [], heights = [];
    const NC = 8;
    const push = (row, hpt = 18) => {
      while (row.length < NC) row.push(cell('', sepS));
      cells.push(row); heights.push({ hpt });
    };
    const mrg  = (r, c1, c2) => merges.push({ s: { r, c: c1 }, e: { r, c: c2 } });

    // Title block
    push([cell('INRED · PROYECTO JUNTAS DE INTERNET', titleS)], 50); mrg(0, 0, NC - 1);
    push([cell('Acuerdo de Nivel de Servicio — Metodología GP-D-JDI-023 · Contrato 001 de 2025', subTitleS)], 24); mrg(1, 0, NC - 1);
    push([cell(`Período de referencia: ${periodH} horas (30 días) · Generado: ${exportDate}`, { ...subTitleS, font: { ...subTitleS.font, sz: 8 } })], 18); mrg(2, 0, NC - 1);
    push([cell('', sepS)], 8); mrg(cells.length - 1, 0, NC - 1);

    // ── KPI cards ────────────────────────────────────────────────────────────
    const kpis = availCtx?.kpis;
    const avKpis = [
      { lbl: 'Juntas evaluadas',      val: kpis?.total           ?? '—', bg: PALETTE.blue2,  fg: 'BFDBFE' },
      { lbl: `Cumplen ≥ 98 %`,        val: kpis?.cumple          ?? '—', bg: PALETTE.green2, fg: '6EE7B7' },
      { lbl: 'No cumplen',            val: kpis?.incumple        ?? '—', bg: PALETTE.red2,   fg: 'FCA5A5' },
      { lbl: 'Disponib. promedio',    val: kpis?.avgAvailability != null ? `${Number(kpis.avgAvailability).toFixed(2)} %` : '—', bg: (kpis?.avgAvailability ?? 0) >= 98 ? PALETTE.green2 : PALETTE.amber1, fg: (kpis?.avgAvailability ?? 0) >= 98 ? '6EE7B7' : 'FDE68A' },
      { lbl: 'Total horas de caída',  val: kpis?.totalDowntimeHours != null ? `${Number(kpis.totalDowntimeHours).toFixed(1)} h` : '—', bg: PALETTE.amber1, fg: 'FDE68A' },
    ];
    avKpis.forEach(({ lbl, val, bg: b, fg }) => {
      const r = cells.length;
      push([cell(lbl, kpiCardS(b)), cell(String(val), kpiValS(fg, b))], 44);
      mrg(r, 0, 0); mrg(r, 1, NC - 1);
    });

    push([cell('', sepS)], 8); mrg(cells.length - 1, 0, NC - 1);

    // ── Scope notice ──────────────────────────────────────────────────────────
    push([cell('✅  Esta metodología aplica exclusivamente al proyecto Juntas de Internet (JDI).', sectionS(PALETTE.teal))], 26); mrg(cells.length - 1, 0, NC - 1);
    push([cell('Para otros proyectos la lógica de cálculo es similar, pero los umbrales y categorías imputables pueden diferir según contrato. Consulte la metodología específica.', noteS)], 36); mrg(cells.length - 1, 0, NC - 1);
    push([cell('', sepS)], 8); mrg(cells.length - 1, 0, NC - 1);

    // ── Indicadores reference ─────────────────────────────────────────────────
    push([cell('INDICADORES CONTRACTUALES', sectionS(PALETTE.blue3))], 22); mrg(cells.length - 1, 0, NC - 1);
    [
      ['Indicador 1', 'Velocidad Efectiva Mínima de Navegación', 'Muestra: 10 % hogares activos · Cumplimiento: ≥ 80 % de la muestra'],
      ['Indicador 2', 'Disponibilidad por Red de Acceso',        'Fórmula: [(720h − T.Indisponibilidad) / 720h] × 100 ≥ 98 %'],
    ].forEach(([ind, nombre, formula], i) => {
      const s = i % 2 === 0 ? rowEven : rowOdd;
      push([cell(ind, { ...s, font: { ...s.font, bold: true, color: { rgb: '93C5FD' } } }), cell(nombre, { ...s, font: { ...s.font, bold: true } }), cell(formula, { ...s, font: { ...s.font, italic: true, color: { rgb: PALETTE.light } } })], 22);
      mrg(cells.length - 1, 2, NC - 1);
    });

    const ws = XLSX.utils.aoa_to_sheet(cells);
    ws['!merges'] = merges;
    ws['!rows']   = heights;
    ws['!cols']   = Array(NC).fill({ wch: 14 });
    ws['!cols'][0] = { wch: 26 };
    ws['!cols'][1] = { wch: 50 };
    return ws;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SHEET 2 — Indicador 2: Disponibilidad
  // ─────────────────────────────────────────────────────────────────────────
  function buildDisponibilidadSheet() {
    const juntas = availCtx?.juntas ?? [];
    const cells = [], merges = [], heights = [];
    const push = (row, hpt = 18) => { cells.push(row); heights.push({ hpt }); };
    const mrg  = (r, c1, c2) => merges.push({ s: { r, c: c1 }, e: { r, c: c2 } });
    const NC   = 8;

    push([cell('INDICADOR 2 · DISPONIBILIDAD POR RED DE ACCESO', titleS)], 40); mrg(0, 0, NC - 1);
    push([cell('Fórmula: [(Tiempo Total – Tiempo de Indisponibilidad) / Tiempo Total] × 100 ≥ 98 %  ·  Responsable: Inred  ·  Prioridad: Alta', subTitleS)], 22); mrg(1, 0, NC - 1);
    push([cell(`Categorías imputables: Falla Mikrotik · Falla UTP Mikrotik–SW Troncal · Falla en la totalidad de Access Point de la Junta  ·  Período base: ${periodH} h`, { ...subTitleS, font: { ...subTitleS.font, sz: 8 } })], 18); mrg(2, 0, NC - 1);
    push([cell('', sepS)], 8); mrg(3, 0, NC - 1);

    // Column headers
    push([
      cell('N°',                headerS),
      cell('Junta / Centro Poblado', headerS),
      cell('Departamento',      headerS),
      cell('Municipio',         headerS),
      cell('Tickets imputables',headerS),
      cell('Horas de caída',    headerS),
      cell('Disponibilidad %',  headerS),
      cell('Estado ANS',        headerS),
    ], 22);

    juntas.forEach((j, i) => {
      const s        = i % 2 === 0 ? rowEven : rowOdd;
      const ok       = j.cumple;
      const availSty = j.availability >= 99 ? availGoodS : j.availability >= 98 ? availWarnS : availBadS;
      push([
        num(i + 1, { ...s, alignment: { horizontal: 'center', vertical: 'center' } }),
        cell(j.junta       || '—', { ...s, font: { ...s.font, bold: true } }),
        cell(j.department  || '—', s),
        cell(j.municipality || '—', s),
        num(j.imputableCount, j.imputableCount > 0 ? numBadS : { ...s, alignment: { horizontal: 'center', vertical: 'center' } }),
        { v: j.totalDowntimeHours ?? 0, t: 'n', z: '#,##0.00 "h"', s: j.totalDowntimeHours > 0 ? availWarnS : s },
        { v: j.availability ?? 0,        t: 'n', z: '#,##0.00"%"',  s: availSty },
        cell(ok ? '✓ Cumple' : '✗ No cumple', ok ? cumpleS : incumpleS),
      ], 18);
    });

    if (juntas.length === 0) {
      push([cell('Sin datos de juntas en el período actual.', { ...noteS, alignment: { horizontal: 'center', vertical: 'center' } })], 28);
      mrg(cells.length - 1, 0, NC - 1);
    }

    // Summary footer
    push([cell('', sepS)], 8); mrg(cells.length - 1, 0, NC - 1);
    const kpis = availCtx?.kpis;
    const okColor  = (kpis?.cumple / Math.max(kpis?.total, 1)) * 100 >= 90 ? PALETTE.green1 : PALETTE.amber1;
    push([
      cell('RESUMEN', sectionS(PALETTE.blue3)),
      cell(`Juntas evaluadas: ${kpis?.total ?? '—'}`, sectionS(PALETTE.blue2)),
      cell(`Cumplen ≥ 98 %: ${kpis?.cumple ?? '—'}`, sectionS(PALETTE.green2)),
      cell(`No cumplen: ${kpis?.incumple ?? '—'}`, sectionS(PALETTE.red2)),
      cell(`Prom. disponibilidad: ${kpis?.avgAvailability?.toFixed(2) ?? '—'} %`, sectionS(okColor)),
    ], 24);
    mrg(cells.length - 1, 4, NC - 1);

    const ws = XLSX.utils.aoa_to_sheet(cells);
    ws['!merges'] = merges;
    ws['!rows']   = heights;
    ws['!cols']   = [{ wch: 5 }, { wch: 32 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
    ws['!freeze'] = { xSplit: 0, ySplit: 5, topLeftCell: 'A6', activeCell: 'A6' };
    ws['!autofilter'] = { ref: 'A5:H5' };
    return ws;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SHEET 3 — Tickets imputables (detalle)
  // ─────────────────────────────────────────────────────────────────────────
  function buildTicketsImputablesSheet() {
    const juntas = availCtx?.juntas ?? [];
    const cells = [], merges = [], heights = [];
    const push = (row, hpt = 18) => { cells.push(row); heights.push({ hpt }); };
    const mrg  = (r, c1, c2) => merges.push({ s: { r, c: c1 }, e: { r, c: c2 } });
    const NC   = 9;

    push([cell('TICKETS IMPUTABLES — DETALLE POR JUNTA', titleS)], 40); mrg(0, 0, NC - 1);
    push([cell('Solo tickets con Responsable = Inred · Prioridad = Alta · Categoría imputable (ver Metodología).  Tiempo caída = fecha creación ticket → fecha cierre.', subTitleS)], 22); mrg(1, 0, NC - 1);
    push([cell('', sepS)], 8); mrg(2, 0, NC - 1);

    push([
      cell('Junta',             headerS),
      cell('Ticket #',          headerS),
      cell('Categoría',         headerS),
      cell('Prioridad',         headerS),
      cell('Fecha inicio',      headerS),
      cell('Fecha cierre',      headerS),
      cell('Estado ticket',     headerS),
      cell('Horas caída',       headerS),
      cell('Computable',        headerS),
    ], 22);

    let rowIdx = 0;
    juntas.forEach((j) => {
      if (!j.imputables?.length) return;
      j.imputables.forEach((t) => {
        const s   = rowIdx % 2 === 0 ? rowEven : rowOdd;
        const isClosed = (t.ticketState || '').toLowerCase().includes('cerrad');
        push([
          cell(j.junta || '—',          { ...s, font: { ...s.font, bold: true, color: { rgb: '93C5FD' } } }),
          cell(`#${t.ticketId}`,          { ...s, font: { ...s.font, color: { rgb: 'FDE68A' } } }),
          cell(t.category   || '—',      s),
          cell(t.priority   || '—',      { ...s, font: { ...s.font, color: { rgb: 'FCA5A5' } } }),
          cell(t.ticketStart ? new Date(t.ticketStart).toLocaleString('es-CO') : '—', s),
          cell(t.ticketEnd   ? new Date(t.ticketEnd  ).toLocaleString('es-CO') : (isClosed ? '—' : 'Abierto'), s),
          cell(t.ticketState || '—',     s),
          { v: t.downtimeHours ?? 0, t: 'n', z: '#,##0.00 "h"', s: t.downtimeHours > 0 ? availWarnS : s },
          cell('✓ Sí',                   cumpleS),
        ], 18);
        rowIdx++;
      });
    });

    if (rowIdx === 0) {
      push([cell('Sin tickets imputables en el período actual.', { ...noteS, alignment: { horizontal: 'center', vertical: 'center' } })], 28);
      mrg(cells.length - 1, 0, NC - 1);
    }

    const ws = XLSX.utils.aoa_to_sheet(cells);
    ws['!merges'] = merges;
    ws['!rows']   = heights;
    ws['!cols']   = [{ wch: 28 }, { wch: 10 }, { wch: 34 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 10 }];
    ws['!freeze'] = { xSplit: 0, ySplit: 4, topLeftCell: 'A5', activeCell: 'A5' };
    return ws;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SHEET 4 — Indicador 1: Velocidad
  // ─────────────────────────────────────────────────────────────────────────
  function buildVelocidadSheet() {
    const cells = [], merges = [], heights = [];
    const push = (row, hpt = 18) => { cells.push(row); heights.push({ hpt }); };
    const mrg  = (r, c1, c2) => merges.push({ s: { r, c: c1 }, e: { r, c: c2 } });
    const NC   = 6;

    push([cell('INDICADOR 1 · VELOCIDAD EFECTIVA MÍNIMA DE NAVEGACIÓN', titleS)], 40); mrg(0, 0, NC - 1);
    push([cell('Muestra aleatoria del 10 % de hogares encendidos y activos por Junta · Cumplimiento: ≥ 80 % de la muestra debe superar los umbrales por tecnología', subTitleS)], 24); mrg(1, 0, NC - 1);
    push([cell('', sepS)], 8); mrg(2, 0, NC - 1);

    // Thresholds table
    push([cell('UMBRALES POR TECNOLOGÍA DE RED TRONCAL', sectionS(PALETTE.blue3))], 22); mrg(cells.length - 1, 0, NC - 1);
    push([
      cell('Tecnología',          headerS),
      cell('Descarga mín. (Mbps)', headerS),
      cell('Subida mín. (Mbps)',   headerS),
      cell('Reuso',                headerS),
      cell('Referencia',           headerS),
    ], 22); mrg(cells.length - 1, 4, NC - 1);

    [
      ['Satelital GEO',       '≥ 0,5',   '≥ 0,1',   '1:16', 'Numeral 3.1.a GP-D-JDI-023'],
      ['Satelital LEO',       '≥ 1,0',   '≥ 0,2',   '1:16', 'Numeral 3.1.b GP-D-JDI-023'],
      ['Fibra / Radioenlace', '≥ 1,5625','≥ 0,3125', '1:16', 'Numeral 3.1.c GP-D-JDI-023'],
    ].forEach(([tech, dl, ul, reuse, ref], i) => {
      const s = i % 2 === 0 ? rowEven : rowOdd;
      push([
        cell(tech,  { ...s, font: { ...s.font, bold: true, color: { rgb: '93C5FD' } } }),
        cell(dl,    { ...s, font: { ...s.font, bold: true, color: { rgb: '6EE7B7' } }, alignment: { horizontal: 'center', vertical: 'center' } }),
        cell(ul,    { ...s, font: { ...s.font, bold: true, color: { rgb: '60A5FA' } }, alignment: { horizontal: 'center', vertical: 'center' } }),
        cell(reuse, { ...s, alignment: { horizontal: 'center', vertical: 'center' } }),
        cell(ref,   { ...s, font: { ...s.font, italic: true, color: { rgb: PALETTE.light } } }),
      ], 20);
      mrg(cells.length - 1, 4, NC - 1);
    });

    push([cell('', sepS)], 8); mrg(cells.length - 1, 0, NC - 1);

    // Template section
    push([cell('PLANTILLA DE REGISTRO DE PRUEBAS DE VELOCIDAD', sectionS(PALETTE.teal))], 22); mrg(cells.length - 1, 0, NC - 1);
    push([cell('Complete los datos de prueba mensualmente. Cada junta debe aportar al menos una medición en el 10 % de sus hogares activos.', noteS)], 22); mrg(cells.length - 1, 0, NC - 1);
    push([
      cell('Junta de Internet',   headerS),
      cell('Identificador hogar', headerS),
      cell('Tecnología',          headerS),
      cell('Fecha y hora',        headerS),
      cell('Descarga (Mbps)',      headerS),
      cell('Subida (Mbps)',        headerS),
    ], 22);
    // 10 empty template rows
    for (let i = 0; i < 10; i++) {
      const s = i % 2 === 0 ? rowEven : rowOdd;
      push([cell('', s), cell('', s), cell('', s), cell('', s), cell('', s), cell('', s)], 18);
    }

    push([cell('', sepS)], 8); mrg(cells.length - 1, 0, NC - 1);
    push([cell('ℹ Criterio de cumplimiento: una junta cumple cuando ≥ 80 % de las pruebas de la muestra superan los umbrales mínimos definidos para su tecnología de red troncal.', noteS)], 30); mrg(cells.length - 1, 0, NC - 1);

    const ws = XLSX.utils.aoa_to_sheet(cells);
    ws['!merges'] = merges;
    ws['!rows']   = heights;
    ws['!cols']   = [{ wch: 28 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 18 }];
    return ws;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SHEET 5 — Metodología
  // ─────────────────────────────────────────────────────────────────────────
  function buildMetodologiaSheet() {
    const cells = [], merges = [], heights = [];
    const push = (row, hpt = 18) => { cells.push(row); heights.push({ hpt }); };
    const mrg  = (r, c1, c2) => merges.push({ s: { r, c: c1 }, e: { r, c: c2 } });
    const NC   = 2;

    const lblS = {
      fill: bg(PALETTE.blue2),
      font: { bold: true, color: { rgb: '93C5FD' }, sz: 9 },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: fb(PALETTE.blue2),
    };
    const valS = {
      fill: bg(PALETTE.navy),
      font: { color: { rgb: PALETTE.silver }, sz: 9 },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: fb(PALETTE.muted),
    };

    push([cell('METODOLOGÍA — REFERENCIA GP-D-JDI-023 · ANEXO 11', titleS)], 40); mrg(0, 0, NC - 1);
    push([cell('', sepS)], 8); mrg(1, 0, NC - 1);

    const rows = [
      ['Documento',              'GP-D-JDI-023 — Metodología Cálculo de Indicadores · Versión 1 · 05.01.2026'],
      ['Elaboró',                'Dayan Robles — Gerente de Proyecto'],
      ['Revisó y aprobó',        'Yamit Amaya — Director de Planeación'],
      ['Contrato',               'Contrato de Provisión, Instalación y Soporte de Equipos para las Juntas de Internet No. 001 de 2025'],
      ['Empresa',                'Red de Ingeniería S.A.S (INRED)'],
      ['Alcance',                'Todas las Redes de Acceso implementadas en las Juntas de Internet asignadas al Proveedor de Bienes y Servicios'],
      ['Indicador 1',            'Velocidad Efectiva Mínima de Navegación — medida entre nodo de red de acceso y CPE en cada hogar'],
      ['Indicador 2',            'Disponibilidad por Red de Acceso — % de tiempo operativo por Junta de Internet'],
      ['Umbral Disponibilidad',  '≥ 98 % por Red de Acceso'],
      ['Período de medición',    '720 horas (30 días) por mes'],
      ['Fórmula disponibilidad', 'Disponibilidad (%) = [(Tiempo Total – Tiempo de Indisponibilidad) / Tiempo Total] × 100'],
      ['Indisponibilidad mide',  'Desde fecha/hora de creación del ticket en Mesa de Ayuda hasta fecha/hora de cierre, una vez restablecido el servicio'],
      ['Tickets imputables',     'Responsable = Inred + Prioridad = Alta + Categoría: Falla Mikrotik / Falla UTP Mikrotik–SW Troncal / Falla en la totalidad de Access Point de la Junta'],
      ['No imputables (excluidos)', 'Tickets de terceros o proveedor troncal · Prioridad Baja o Media · Mantenimientos preventivos programados · Fallas eléctricas generalizadas · Fuerza mayor'],
      ['Indicador 1 muestra',    '10 % de los hogares encendidos y activos por Junta por mes'],
      ['Indicador 1 cumplimiento', '≥ 80 % de las pruebas de la muestra deben superar los umbrales de velocidad y latencia para el tipo de tecnología'],
    ];

    rows.forEach(([lbl, val], i) => {
      push([cell(lbl, lblS), cell(val, valS)], i < 4 ? 22 : 28);
    });

    const ws = XLSX.utils.aoa_to_sheet(cells);
    ws['!merges'] = merges;
    ws['!rows']   = heights;
    ws['!cols']   = [{ wch: 26 }, { wch: 90 }];
    return ws;
  }

  // ── Assemble workbook ─────────────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb, buildResumenSheet(),           'Resumen Ejecutivo');
  XLSX.utils.book_append_sheet(wb, buildDisponibilidadSheet(),    'Indicador 2 – Disponibilidad');
  XLSX.utils.book_append_sheet(wb, buildTicketsImputablesSheet(), 'Tickets Imputables');
  XLSX.utils.book_append_sheet(wb, buildVelocidadSheet(),         'Indicador 1 – Velocidad');
  XLSX.utils.book_append_sheet(wb, buildMetodologiaSheet(),       'Metodología');

  const TAB_COLORS = [
    '0B3D91', // Resumen Ejecutivo   → deep royal blue
    '065F46', // Disponibilidad      → deep teal-green
    '7C2D12', // Tickets imputables  → deep red-orange
    '1E3A5F', // Velocidad           → deep slate blue
    '3B0764', // Metodología         → deep purple
  ];
  if (!wb.Workbook) wb.Workbook = { Sheets: [] };
  if (!wb.Workbook.Sheets) wb.Workbook.Sheets = [];
  while (wb.Workbook.Sheets.length < TAB_COLORS.length) wb.Workbook.Sheets.push({});
  TAB_COLORS.forEach((rgb, i) => {
    wb.Workbook.Sheets[i] = { ...wb.Workbook.Sheets[i], color: { rgb } };
  });

  const fname = meta.filename ?? `JDI_Informe_ANS_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  download(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    fname.endsWith('.xlsx') ? fname : `${fname}.xlsx`,
  );
}
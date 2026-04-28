export const SLA_THRESHOLD_DAYS = 7;
export const PRIORITY_ORDER = ['Alta', 'Media', 'Baja', 'Sin dato'];
export const STATE_ORDER = ['Abierto', 'Cerrado', 'Anulado', 'Sin dato'];
export const VIEW_OPTIONS = [
  { key: 'general', label: 'General' },
  { key: 'operators', label: 'Operadores' },
  { key: 'maintenance', label: 'Mantenimiento' },
  { key: 'ans', label: 'ANS – Indicadores (JDI)' },
];

// ─── Metodología Anexo 11 (GP-D-JDI-023) ──────────────────────────────────
// Indicador 1: Velocidad Efectiva Mínima de Navegación
export const VELOCITY_COMPLIANCE_THRESHOLD = 80;   // ≥ 80 % de la muestra debe cumplir
export const VELOCITY_SAMPLE_PCT = 10;             // 10 % de hogares encendidos/activos
export const VELOCITY_THRESHOLDS = {
  GEO:   { download: 0.5,    upload: 0.1,    label: 'Satelital GEO' },
  LEO:   { download: 1.0,    upload: 0.2,    label: 'Satelital LEO' },
  FIBER: { download: 1.5625, upload: 0.3125, label: 'Fibra / Radioenlace' },
};

// Indicador 2: Disponibilidad por Red de Acceso
export const AVAILABILITY_MIN_PCT     = 98;   // umbral mínimo contractual
export const AVAILABILITY_PERIOD_HOURS = 720; // 30 días × 24 h
// Categorías de ticket imputables al proveedor (Inred, prioridad Alta)
export const IMPUTABLE_CATEGORIES = [
  'Falla Mikrotik',
  'Falla UTP Mikrotik - SW Troncal',
  'Fallla UTP Mikrotik - SW Troncal', // typo que aparece en la tabla del documento
  'Falla en la totalidad de Access Point de la Junta',
];
export const DEFAULT_FILTERS = {
  dateFrom: '',
  dateTo: '',
  department: '',
  municipality: '',
  locality: '',
  operatorCode: '',
  project: '',
  subProject: '',
  priority: '',
  ticketState: '',
  sourceOrigin: '',
  escalationGroup: '',
  assignee: '',
};
export const DEFAULT_FLAGS = {
  openOnly: false,
  highPriorityOnly: false,
  slaBreachOnly: false,
};
export const FILTER_FIELDS = [
  { key: 'dateFrom', label: 'Fecha desde', kind: 'date' },
  { key: 'dateTo', label: 'Fecha hasta', kind: 'date' },
  { key: 'ticketState', label: 'Estado ticket', kind: 'select' },
  { key: 'priority', label: 'Prioridad', kind: 'select' },
  { key: 'department', label: 'Departamento', kind: 'select' },
  { key: 'municipality', label: 'Municipio', kind: 'select' },
  { key: 'locality', label: 'Centro poblado', kind: 'select' },
  { key: 'operatorCode', label: 'Código operador', kind: 'select' },
  { key: 'project', label: 'Proyecto', kind: 'select' },
  { key: 'subProject', label: 'Sub proyecto', kind: 'select' },
  { key: 'sourceOrigin', label: 'Fuente origen', kind: 'select' },
  { key: 'escalationGroup', label: 'Grupo escalamiento', kind: 'select' },
  { key: 'assignee', label: 'Operador asignado', kind: 'select' },
];
export const QUICK_FLAGS = [
  { key: 'openOnly', label: 'Solo abiertos' },
  { key: 'highPriorityOnly', label: 'Alta prioridad' },
  { key: 'slaBreachOnly', label: 'Brechas SLA > 7d' },
];
export const MAP_OUTLINE = [
  { lon: -79.1, lat: 8.8 },
  { lon: -77.7, lat: 10.8 },
  { lon: -75.2, lat: 12.2 },
  { lon: -72.1, lat: 12.8 },
  { lon: -69.1, lat: 11.2 },
  { lon: -67.2, lat: 8.2 },
  { lon: -67.5, lat: 4.1 },
  { lon: -69.2, lat: -1.2 },
  { lon: -71.2, lat: -3.8 },
  { lon: -74.7, lat: -2.2 },
  { lon: -77.9, lat: 0.6 },
  { lon: -78.9, lat: 4.4 },
  { lon: -79.1, lat: 8.8 },
];

const STOPWORDS = new Set([
  'para', 'como', 'desde', 'hasta', 'entre', 'sobre', 'tras', 'ante', 'bajo', 'contra', 'segun', 'sin', 'con',
  'una', 'unos', 'unas', 'que', 'del', 'las', 'los', 'por', 'fue', 'esta', 'este', 'esto', 'cliente', 'ticket',
  'servicio', 'caso', 'solucion', 'apertura', 'comentario', 'observacion', 'observaciones', 'requiere', 'realiza',
  'realizado', 'hace', 'donde', 'cuando', 'porque', 'traslado', 'validacion', 'proyecto', 'operador', 'centro',
  'municipio', 'departamento', 'favor', 'favorable', 'dias', 'dia', 'hora', 'horas', 'minutos', 'mintic', 'usuario',
  'queda', 'quedo', 'informa', 'informo', 'falla', 'parada', 'mantenimiento', 'sitio', 'lugar', 'equipo', 'red',
  'mas', 'menos', 'muy', 'aun', 'falta', 'estado', 'alta', 'media', 'baja', 'abierto', 'cerrado', 'anulado', 'tipo',
  'descripcion', 'fecha', 'numero', 'seguimiento', 'cierre', 'gestion', 'comunicacion', 'comentario', 'descripcion',
]);

export function buildDashboardContext(data, state) {
  const availableOptions = buildFilterOptions(data, state);
  const interactionScope = Array.isArray(state.interactionTicketIds) ? new Set(state.interactionTicketIds.map((id) => String(id))) : null;
  const baseTickets = data.tickets.filter((ticket) => {
    if (!matchesTicket(ticket, state, { includeSlaFlag: false })) return false;
    if (state.textSearch && !matchesText(ticket, state.textSearch)) return false;
    if (state.quickTicket && !String(ticket.ticketId).includes(state.quickTicket.replace('#',''))) return false;
    if (state.quickMnt) {
      if (!ticket.maintenanceId) return false;
      if (!String(ticket.maintenanceId).toLowerCase().includes(state.quickMnt.trim().toLowerCase())) return false;
    }
    return true;
  });
  const baseIds = new Set(baseTickets.map((ticket) => ticket.ticketId));
  const scopedStopEvents = data.stopEvents.filter(
    (event) => baseIds.has(event.ticketId) && matchesDate(getEventReferenceDate(event), state.filters.dateFrom, state.filters.dateTo),
  );
  const stopAggregation = aggregateStopEvents(scopedStopEvents);

  let tickets = baseTickets.map((ticket) => attachScopedStops(ticket, stopAggregation[ticket.ticketId]));
  if (state.flags.slaBreachOnly) {
    tickets = tickets.filter((ticket) => (ticket.currentStopDays || 0) > SLA_THRESHOLD_DAYS);
  }
  if (interactionScope && interactionScope.size > 0) {
    tickets = tickets.filter((ticket) => interactionScope.has(String(ticket.ticketId)));
  }

  const finalIds = new Set(tickets.map((ticket) => ticket.ticketId));
  const stopEvents = scopedStopEvents.filter((event) => finalIds.has(event.ticketId));
  const finalStopAggregation = aggregateStopEvents(stopEvents);
  tickets = tickets.map((ticket) => attachScopedStops(ticket, finalStopAggregation[ticket.ticketId]));

  const closedTickets = tickets.filter((ticket) => ticket.ticketState === 'Cerrado');
  const openTickets = tickets.filter((ticket) => ticket.ticketState === 'Abierto');
  const stopTickets = tickets.filter((ticket) => (ticket.currentStopDays || 0) > 0);
  const maintenanceTickets = tickets.filter((ticket) => ticket.maintenanceId);
  const maintenanceOpen = maintenanceTickets.filter((ticket) => !ticket.maintenanceEnd);
  const textMatches = tickets.slice(); // Search is already applied as a hard filter
  const topicDistribution = groupSummary(textMatches, (ticket) => ticket.textAnalytics?.primaryTopic || 'Sin clasificar');
  const alertDistribution = groupNestedSummary(textMatches, (ticket) => ticket.textAnalytics?.alertLabels || []);
  const highPriorityComments = getHighPriorityComments(textMatches);
  const topDepartment = topGroup(tickets, (ticket) => ticket.department || 'Sin dato');
  const topMunicipality = topGroup(tickets, (ticket) => ticket.municipality || 'Sin dato');
  const topProject = topGroup(tickets, (ticket) => ticket.project || 'Sin dato');

  const totals = {
    tickets: tickets.length,
    open: openTickets.length,
    closed: closedTickets.length,
    cancelled: tickets.filter((ticket) => ticket.ticketState === 'Anulado').length,
    mttr: average(closedTickets.map((ticket) => ticket.closeDurationDays)),
    totalStopDays: sum(stopEvents.map((event) => event.stopDays || 0)),
    stopTickets: stopTickets.length,
    maintenanceOpen: maintenanceOpen.length,
    slaRate: stopTickets.length ? (stopTickets.filter((ticket) => ticket.currentStopDays <= SLA_THRESHOLD_DAYS).length / stopTickets.length) * 100 : 100,
    resolutionCoverage: percentage(tickets.filter((ticket) => hasText(ticket.resolutionComment)).length, tickets.length),
    openingCoverage: percentage(tickets.filter((ticket) => hasText(ticket.openingComment)).length, tickets.length),
  };

  const medianOpenAge = median(openTickets.map((ticket) => ticket.openAgeDays));
  const heroHighlights = [
    {
      label: 'Backlog activo',
      value: formatInteger(totals.open),
      unit: 'tickets abiertos',
      meta: medianOpenAge ? `Edad mediana: ${formatDays(medianOpenAge)}` : 'Sin antigüedad calculable',
      accent: '#3b82f6',
    },
    {
      label: 'Tiempo de resolución',
      value: formatDays(totals.mttr),
      unit: 'tiempo de resolución prom.',
      meta: totals.closed ? `Basado en ${formatInteger(totals.closed)} tickets cerrados` : 'Sin tickets cerrados',
      accent: '#10b981',
    },
    {
      label: 'Departamento top',
      value: topDepartment?.label || 'Sin dato',
      unit: 'mayor concentración',
      meta: topDepartment ? `${formatPercent(topDepartment.share)} del volumen visible` : 'Sin concentración dominante',
      accent: '#f59e0b',
    },
    {
      label: 'Proyecto dominante',
      value: topProject?.label ? (topProject.label.length > 22 ? topProject.label.slice(0, 22) + '…' : topProject.label) : 'Sin dato',
      unit: 'mayor volumen',
      meta: topProject ? `${formatPercent(topProject.share)} de los tickets` : 'Sin proyecto dominante',
      accent: '#a855f7',
    },
  ];

  const quickFacts = [
    { label: 'Territorio líder', value: topDepartment?.label || 'Sin dato', meta: topDepartment ? formatPercent(topDepartment.share) : '0%' },
    { label: 'Municipio líder', value: topMunicipality?.label || 'Sin dato', meta: topMunicipality ? formatPercent(topMunicipality.share) : '0%' },
    { label: 'Proyecto dominante', value: topProject?.label || 'Sin dato', meta: topProject ? formatPercent(topProject.share) : '0%' },
    { label: 'Rango visible', value: buildVisibleDateRange(tickets, stopEvents), meta: `${formatInteger(stopEvents.length)} eventos de parada en foco` },
  ];

  // ── KPI 0: Context-aware filter detection ──────────────────────────────
  const isFiltered = totals.tickets < data.tickets.length;
  const hasDateFilter = !!(state.filters.dateFrom || state.filters.dateTo);
  const fullDataRange = buildKpiDateRange(data.tickets, data.stopEvents);

  let kpi0Label, kpi0Value, kpi0Meta;
  if (!isFiltered) {
    kpi0Label = 'Tickets totales';
    kpi0Value = formatInteger(data.tickets.length);
    kpi0Meta = fullDataRange;
  } else if (hasDateFilter) {
    kpi0Label = 'Tickets en el período';
    kpi0Value = formatInteger(totals.tickets);
    const from = state.filters.dateFrom ? formatDate(state.filters.dateFrom) : '…';
    const to = state.filters.dateTo ? formatDate(state.filters.dateTo) : 'hoy';
    kpi0Meta = `${from} → ${to} · de ${formatInteger(data.tickets.length)} totales`;
  } else {
    kpi0Label = 'Tickets filtrados';
    kpi0Value = formatInteger(totals.tickets);
    kpi0Meta = `de ${formatInteger(data.tickets.length)} totales · ${formatPercent(percentage(totals.tickets, data.tickets.length))} del consolidado`;
  }

  const highPriorityCount = tickets.filter((ticket) => ticket.priority === 'Alta').length;

  const kpis = [
    {
      label: kpi0Label,
      value: kpi0Value,
      meta: kpi0Meta,
      footer: [
        { label: 'Abiertos', value: formatInteger(totals.open) },
        { label: 'Cerrados', value: formatInteger(totals.closed) },
      ],
    },
    {
      label: 'Tickets cerrados',
      value: formatInteger(totals.closed),
      meta: `Tasa de cierre: ${formatPercent(percentage(totals.closed, totals.tickets))} · Tiempo res. ${formatDays(totals.mttr)}`,
      footer: [
        { label: 'Tasa cierre', value: formatPercent(percentage(totals.closed, totals.tickets)) },
        { label: 'Anulados', value: formatInteger(totals.cancelled) },
      ],
    },
    {
      label: 'Tiempo resolución',
      value: formatDays(totals.mttr),
      meta: 'Tiempo medio hasta resolución · base tickets cerrados',
      footer: [
        { label: 'Mediana', value: formatDays(median(closedTickets.map((ticket) => ticket.closeDurationDays))) },
        { label: 'Máximo', value: formatDays(max(closedTickets.map((ticket) => ticket.closeDurationDays))) },
      ],
    },
    {
      label: 'Cumplimiento SLA',
      value: formatPercent(totals.slaRate),
      meta: `Tickets dentro del umbral de ${SLA_THRESHOLD_DAYS} días de parada acumulada`,
      footer: [
        { label: 'Con parada', value: formatInteger(totals.stopTickets) },
        { label: 'En brecha', value: formatInteger(stopTickets.filter((ticket) => ticket.currentStopDays > SLA_THRESHOLD_DAYS).length) },
      ],
    },
    {
      label: 'Paradas de reloj',
      value: formatDays(totals.totalStopDays),
      meta: 'Tiempo acumulado de reloj detenido en el período',
      footer: [
        { label: 'Promedio', value: formatDays(average(stopTickets.map((ticket) => ticket.currentStopDays))) },
        { label: 'Máximo', value: formatDays(max(stopTickets.map((ticket) => ticket.currentStopDays))) },
      ],
    },
    {
      label: 'Señales NLP',
      value: formatInteger(sum(alertDistribution.map((item) => item.value))),
      meta: 'Alertas detectadas por clasificación automática del comentariado',
      footer: [
        { label: 'Cob. apertura', value: formatPercent(totals.openingCoverage) },
        { label: 'Cob. solución', value: formatPercent(totals.resolutionCoverage) },
      ],
    },
  ];

  return {
    availableOptions,
    tickets,
    stopEvents,
    totals,
    heroHighlights,
    quickFacts,
    kpis,
    topDepartment,
    activeFilterLabels: buildActiveFilterLabels(state),
    filterHeadline: `${formatInteger(totals.tickets)} tickets en foco`,
    filterSummary: `${formatInteger(totals.stopTickets)} tickets con parada · ${formatInteger(stopEvents.length)} eventos · horizonte ${buildVisibleDateRange(tickets, stopEvents)}`,
    notes: (data.meta?.warnings || []).concat([
      `El umbral de SLA operativo se interpreta con ${SLA_THRESHOLD_DAYS} días de parada acumulada por ticket.`,
      'La capa NLP clasifica temas y alertas a partir de lexicones operativos normalizados.',
    ]),
    general: {
      trend: buildTicketTrend(tickets),
      statePriorityRows: buildStatePriorityRows(tickets),
      assigneeLoad: groupSummary(openTickets, (ticket) => ticket.assignee || 'Sin dato').slice(0, 8),
      departmentMapData: buildDepartmentMapData(tickets),
      municipalityMapData: buildMunicipalityMapData(tickets),
      rows: tickets
        .slice()
        .sort((left, right) => {
          const leftOpen = left.ticketState === 'Abierto' ? 1 : 0;
          const rightOpen = right.ticketState === 'Abierto' ? 1 : 0;
          return rightOpen - leftOpen || (right.currentStopDays || 0) - (left.currentStopDays || 0) || compareDatesDesc(left.ticketStart, right.ticketStart);
        })
        .slice(0, 80),
    },
    sla: {
      trend: buildStopTrend(stopEvents),
      compliance: {
        compliant: stopTickets.filter((ticket) => ticket.currentStopDays <= SLA_THRESHOLD_DAYS).length,
        breach: stopTickets.filter((ticket) => ticket.currentStopDays > SLA_THRESHOLD_DAYS).length,
      },
      localityImpact: buildLocalityImpact(tickets).slice(0, 10),
      histogram: buildHistogramBuckets(stopTickets.map((ticket) => ticket.currentStopDays || 0)),
      rows: stopTickets.slice().sort((left, right) => (right.currentStopDays || 0) - (left.currentStopDays || 0)).slice(0, 80),
    },
    operations: {
      assigneeLoad: groupSummary(openTickets, (ticket) => ticket.assignee || 'Sin dato').slice(0, 10),
      escalationGroups: groupSummary(tickets, (ticket) => ticket.escalationGroup || 'Sin dato').slice(0, 10),
      maintenanceStates: groupSummary(maintenanceTickets, (ticket) => ticket.maintenanceState || 'Sin estado').slice(0, 8),
      categoryMix: groupSummary(tickets, (ticket) => ticket.category || 'Sin categoría').slice(0, 10),
      rows: buildAssigneeRanking(tickets),
    },
    operators: buildOperatorMetrics(tickets),
    text: {
      topics: topicDistribution,
      alerts: alertDistribution,
      highPriorityComments,
      rows: textMatches.slice().sort((left, right) => compareTextRank(left, right, state.textSearch)).slice(0, 80),
      textSearchMeta: state.textSearch
        ? `${formatInteger(textMatches.length)} tickets coinciden con “${state.textSearch}”.`
        : `${formatInteger(textMatches.length)} tickets con contenido textual visible.`,
      coverage: {
        opening: totals.openingCoverage,
        resolution: totals.resolutionCoverage,
      },
    },
  };
}

export function buildFilterOptions(data, state) {
  const options = {};
  const optionAccessors = {
    department: (ticket) => ticket.department,
    municipality: (ticket) => ticket.municipality,
    locality: (ticket) => ticket.locality,
    operatorCode: (ticket) => ticket.operatorCode,
    project: (ticket) => ticket.project,
    subProject: (ticket) => ticket.subProject,
    priority: (ticket) => ticket.priority,
    ticketState: (ticket) => ticket.ticketState,
    sourceOrigin: (ticket) => ticket.sourceOrigin,
    escalationGroup: (ticket) => ticket.escalationGroup,
    assignee: (ticket) => ticket.assignee,
  };

  Object.entries(optionAccessors).forEach(([field, accessor]) => {
    options[field] = unique(
      data.tickets
        .filter((ticket) => {
          if (!matchesTicket(ticket, state, { excludeField: field, includeSlaFlag: false })) return false;
          if (state.textSearch && !matchesText(ticket, state.textSearch)) return false;
          if (state.quickTicket && !String(ticket.ticketId).includes(state.quickTicket.replace('#',''))) return false;
          if (state.quickMnt) {
            if (!ticket.maintenanceId) return false;
            if (!String(ticket.maintenanceId).toLowerCase().includes(state.quickMnt.trim().toLowerCase())) return false;
          }
          return true;
        })
        .map(accessor)
        .filter(Boolean),
    );
  });

  return options;
}

export function sanitizeFilters(filters, availableOptions) {
  const next = { ...filters };
  ['department', 'municipality', 'locality', 'operatorCode', 'project', 'subProject', 'priority', 'ticketState', 'sourceOrigin', 'escalationGroup', 'assignee'].forEach((field) => {
    if (next[field] && !availableOptions[field]?.includes(next[field])) {
      next[field] = '';
    }
  });
  return next;
}

export function buildTicketNarrative(ticket) {
  const territory = [ticket.department, ticket.municipality, ticket.locality].filter(Boolean).join(' · ') || 'sin detalle territorial';
  const stopSummary = ticket.currentStopDays > 0 ? `${formatDays(ticket.currentStopDays)} de parada acumulada` : 'sin parada acumulada visible';
  const topic = ticket.textAnalytics?.primaryTopic || 'Sin clasificar';
  return `${ticket.ticketState || 'Sin estado'} · prioridad ${String(ticket.priority || 'sin dato').toLowerCase()} · ${stopSummary} · ${territory}. Tema dominante: ${topic}.${ticket.assignee ? ` Asignado a ${ticket.assignee}.` : ' Sin asignado explícito.'}`;
}

function matchesTicket(ticket, state, options = {}) {
  const excludeField = options.excludeField;
  const includeSlaFlag = Object.prototype.hasOwnProperty.call(options, 'includeSlaFlag') ? options.includeSlaFlag : true;
  const { filters, flags } = state;
  
  const vis = state.visibility || 'visible';
  const sp = (ticket.subProject || '').toLowerCase();
  const isInternal = sp.includes('interno') && !sp.includes('interventoria');
  if (vis === 'visible' && isInternal) return false;

  if (!matchesDate(getTicketReferenceDate(ticket), filters.dateFrom, filters.dateTo)) {
    return false;
  }

  if (excludeField !== 'department' && filters.department && ticket.department !== filters.department) return false;
  if (excludeField !== 'municipality' && filters.municipality && ticket.municipality !== filters.municipality) return false;
  if (excludeField !== 'locality' && filters.locality && ticket.locality !== filters.locality) return false;
  if (excludeField !== 'operatorCode' && filters.operatorCode && ticket.operatorCode !== filters.operatorCode) return false;
  if (excludeField !== 'project' && filters.project && ticket.project !== filters.project) return false;
  if (excludeField !== 'subProject' && filters.subProject && ticket.subProject !== filters.subProject) return false;
  if (excludeField !== 'priority' && filters.priority && ticket.priority !== filters.priority) return false;
  if (excludeField !== 'ticketState' && filters.ticketState && ticket.ticketState !== filters.ticketState) return false;
  if (excludeField !== 'sourceOrigin' && filters.sourceOrigin && ticket.sourceOrigin !== filters.sourceOrigin) return false;
  if (excludeField !== 'escalationGroup' && filters.escalationGroup && ticket.escalationGroup !== filters.escalationGroup) return false;
  if (excludeField !== 'assignee' && filters.assignee && ticket.assignee !== filters.assignee) return false;

  if (flags.openOnly && ticket.ticketState !== 'Abierto') return false;
  if (flags.highPriorityOnly && ticket.priority !== 'Alta') return false;
  if (includeSlaFlag && flags.slaBreachOnly && (ticket.currentStopDays || ticket.stopDaysTotal || 0) <= SLA_THRESHOLD_DAYS) return false;

  return true;
}

function aggregateStopEvents(events) {
  return events.reduce((accumulator, event) => {
    const current = accumulator[event.ticketId] || {
      stopDaysTotal: 0,
      segmentCount: 0,
      firstStop: null,
      lastStop: null,
      faultStart: null,
      faultEnd: null,
      beneficiaryId: event.beneficiaryId || null,
    };

    current.stopDaysTotal += event.stopDays || 0;
    current.segmentCount += 1;
    current.firstStop = minDate(current.firstStop, event.stopStart);
    current.lastStop = maxDate(current.lastStop, event.stopEnd);
    current.faultStart = minDate(current.faultStart, event.faultStart);
    current.faultEnd = maxDate(current.faultEnd, event.faultEnd);
    current.beneficiaryId = current.beneficiaryId || event.beneficiaryId || null;

    accumulator[event.ticketId] = current;
    return accumulator;
  }, {});
}

function attachScopedStops(ticket, aggregation = {}) {
  return {
    ...ticket,
    currentStopDays: round(aggregation.stopDaysTotal || 0, 2),
    currentStopSegments: aggregation.segmentCount || 0,
    currentStopStart: aggregation.firstStop || ticket.stopStart || null,
    currentStopEnd: aggregation.lastStop || ticket.stopEnd || null,
    faultStart: aggregation.faultStart || ticket.faultStart || null,
    faultEnd: aggregation.faultEnd || ticket.faultEnd || null,
    beneficiaryId: aggregation.beneficiaryId || ticket.beneficiaryId || null,
  };
}

function buildTicketTrend(tickets) {
  const started = bucketByMonth(tickets, (ticket) => getTicketReferenceDate(ticket), () => 1);
  const closed = bucketByMonth(tickets.filter((ticket) => ticket.ticketEnd && ticket.ticketState === 'Cerrado'), (ticket) => ticket.ticketEnd, () => 1);
  const cancelled = bucketByMonth(tickets.filter((ticket) => ticket.ticketState === 'Anulado'), (ticket) => getTicketReferenceDate(ticket), () => 1);
  const labels = unique([...Object.keys(started), ...Object.keys(closed), ...Object.keys(cancelled)]).sort();
  return {
    labels: labels.map(formatMonthLabel),
    series: [
      { name: 'Abiertos', values: labels.map((label) => started[label] || 0), color: '#3b82f6' },
      { name: 'Cerrados', values: labels.map((label) => closed[label] || 0), color: '#22c55e' },
      { name: 'Anulados', values: labels.map((label) => cancelled[label] || 0), color: '#f59e0b' },
    ],
  };
}

function buildStopTrend(events) {
  const buckets = bucketByMonth(events, (event) => getEventReferenceDate(event), (event) => event.stopDays || 0);
  const labels = Object.keys(buckets).sort();
  return {
    labels: labels.map(formatMonthLabel),
    series: [
      { name: 'Días de parada', values: labels.map((label) => round(buckets[label], 2)), color: '#cf6a4b' },
    ],
  };
}

function buildStatePriorityRows(tickets) {
  return STATE_ORDER.map((stateLabel) => {
    const scoped = tickets.filter((ticket) => (ticket.ticketState || 'Sin dato') === stateLabel);
    const segments = PRIORITY_ORDER.map((priority) => ({
      label: priority,
      value: scoped.filter((ticket) => (ticket.priority || 'Sin dato') === priority).length,
      color: priorityColor(priority),
    }));
    return { label: stateLabel, total: scoped.length, segments };
  }).filter((row) => row.total > 0);
}

function buildDepartmentMapData(tickets) {
  const grouped = new Map();
  tickets.forEach((ticket) => {
    const label = ticket.department || 'Sin dato';
    const current = grouped.get(label) || {
      label,
      value: 0,
      stopDays: 0,
      open: 0,
      lat: ticket.geo?.departmentLat || ticket.geo?.lat || 4.57,
      lon: ticket.geo?.departmentLon || ticket.geo?.lon || -74.29,
      region: ticket.geo?.region || 'Nacional',
    };
    current.value += 1;
    current.stopDays += ticket.currentStopDays || 0;
    current.open += ticket.ticketState === 'Abierto' ? 1 : 0;
    grouped.set(label, current);
  });
  return Array.from(grouped.values()).sort((left, right) => right.value - left.value);
}

function buildMunicipalityMapData(tickets) {
  const grouped = new Map();
  tickets.forEach((ticket) => {
    const label = ticket.municipality || 'Sin dato';
    const current = grouped.get(label) || {
      label,
      value: 0,
      stopDays: 0,
      open: 0,
      lat: ticket.geo?.lat || ticket.geo?.departmentLat || 4.57,
      lon: ticket.geo?.lon || ticket.geo?.departmentLon || -74.29,
      precision: ticket.geo?.precision || 'department-fallback',
      meta: ticket.department || 'Sin dato',
    };
    current.value += 1;
    current.stopDays += ticket.currentStopDays || 0;
    current.open += ticket.ticketState === 'Abierto' ? 1 : 0;
    grouped.set(label, current);
  });
  return Array.from(grouped.values()).sort((left, right) => right.value - left.value);
}

function buildLocalityImpact(tickets) {
  const grouped = new Map();
  tickets.forEach((ticket) => {
    const label = ticket.locality || 'Sin dato';
    const current = grouped.get(label) || { value: 0, meta: [ticket.department, ticket.municipality].filter(Boolean).join(' · ') };
    current.value += ticket.currentStopDays || 0;
    grouped.set(label, current);
  });
  return Array.from(grouped.entries())
    .map(([label, payload]) => ({ label, value: round(payload.value, 2), meta: payload.meta }))
    .sort((left, right) => right.value - left.value);
}

function buildHistogramBuckets(values) {
  const ranges = [
    { label: '0-1d', min: 0, max: 1 },
    { label: '1-3d', min: 1, max: 3 },
    { label: '3-7d', min: 3, max: 7 },
    { label: '7-15d', min: 7, max: 15 },
    { label: '15-30d', min: 15, max: 30 },
    { label: '>30d', min: 30, max: Infinity },
  ];
  return ranges.map((range) => ({
    label: range.label,
    value: values.filter((value) => value > range.min && value <= range.max).length,
    minVal: range.min,
    maxVal: range.max,
  }));
}

function buildAssigneeRanking(tickets) {
  const grouped = new Map();
  tickets.forEach((ticket) => {
    const label = ticket.assignee || 'Sin dato';
    const current = grouped.get(label) || { label, total: 0, open: 0, closed: 0, mttr: [], stops: [], projects: new Map() };
    current.total += 1;
    if (ticket.ticketState === 'Abierto') current.open += 1;
    if (ticket.ticketState === 'Cerrado') current.closed += 1;
    if (isFiniteNumber(ticket.closeDurationDays)) current.mttr.push(ticket.closeDurationDays);
    if (isFiniteNumber(ticket.currentStopDays)) current.stops.push(ticket.currentStopDays);
    if (ticket.project) current.projects.set(ticket.project, (current.projects.get(ticket.project) || 0) + 1);
    grouped.set(label, current);
  });
  return Array.from(grouped.values())
    .map((item) => ({
      label: item.label,
      total: item.total,
      open: item.open,
      closed: item.closed,
      avgMttr: average(item.mttr),
      avgStopDays: average(item.stops),
      topProject: topMapEntry(item.projects),
    }))
    .sort((left, right) => right.open - left.open || right.closed - left.closed)
    .slice(0, 20);
}

function buildOperatorMetrics(tickets) {
  // Regex to detect comment entries and extract tipo + date
  const COMMENT_RE = /TIPO\s+Comentario\s*:\s*(.+?)\s*==>\s*FECHA\s*:\s*([^\s]+(?:\s+\d{2}:\d{2}(?::\d{2})?)?)\s+Comentario\s*:==>/gi;

  const opMap = new Map();

  function getOrCreate(rawName) {
    if (!rawName || !rawName.trim()) return null;
    const key = rawName.trim();
    if (!opMap.has(key)) {
      opMap.set(key, {
        name: key,
        touchedIds: new Set(),
        // Role counts (ticket can appear in multiple roles for same operator)
        cntAssigned: 0, cntCreated: 0, cntClosed: 0, cntResponsible: 0, cntTechnician: 0,
        // Assigned-role-only metrics (SLA / MTTR / comments)
        openCount: 0, highPri: 0,
        mttr: [], stops: [],
        commentCount: 0, followUpCount: 0,
        // General across all roles
        projects: new Map(),
        dailyCounts: {},
        lastActivity: null,
      });
    }
    return opMap.get(key);
  }

  tickets.forEach((ticket) => {
    const tid = ticket.ticketId;
    const refDay = (ticket.ticketStart || ticket.referenceDate || '').slice(0, 10);
    const isHighPri = (ticket.priority || '').toLowerCase().includes('alta');

    // All operator role fields in this ticket
    const rolePairs = [
      { name: ticket.assignee,    prop: 'cntAssigned'    },
      { name: ticket.creator,     prop: 'cntCreated'     },
      { name: ticket.closer,      prop: 'cntClosed'      },
      { name: ticket.responsible, prop: 'cntResponsible' },
      { name: ticket.technician,  prop: 'cntTechnician'  },
    ];

    // Track which operators we already registered daily activity for this ticket
    const seenThisTicket = new Set();

    rolePairs.forEach(({ name, prop }) => {
      const op = getOrCreate(name);
      if (!op) return;

      op[prop] += 1;
      op.touchedIds.add(tid);

      // Daily activity: one point per touched ticket per operator (by ticket date)
      if (!seenThisTicket.has(op.name)) {
        seenThisTicket.add(op.name);
        if (refDay) {
          op.dailyCounts[refDay] = (op.dailyCounts[refDay] || 0) + 1;
          if (!op.lastActivity || refDay > op.lastActivity) op.lastActivity = refDay;
        }
        if (ticket.project) op.projects.set(ticket.project, (op.projects.get(ticket.project) || 0) + 1);
      }

      // Metrics that only make sense for the assigned operator
      if (prop === 'cntAssigned') {
        if (ticket.ticketState === 'Abierto') op.openCount += 1;
        if (isHighPri) op.highPri += 1;
        if (isFiniteNumber(ticket.closeDurationDays)) op.mttr.push(ticket.closeDurationDays);
        if (isFiniteNumber(ticket.currentStopDays) && ticket.currentStopDays > 0) op.stops.push(ticket.currentStopDays);

        // Count comment entries in tickets this operator is assigned to.
        // Comments don't carry author info, so the assignee "owns" them.
        const combined = [ticket.openingComment, ticket.resolutionComment].filter(Boolean).join('\n');
        COMMENT_RE.lastIndex = 0;
        let m;
        while ((m = COMMENT_RE.exec(combined)) !== null) {
          op.commentCount += 1;
          const tipo = m[1].trim().toLowerCase();
          if (tipo.includes('seguimiento')) op.followUpCount += 1;
          // Also register comment date as activity signal
          const comRaw = m[2].trim();
          const comDay = comRaw.slice(0, 10);
          if (/^\d{4}-\d{2}-\d{2}$/.test(comDay)) {
            op.dailyCounts[comDay] = (op.dailyCounts[comDay] || 0) + 1;
            if (!op.lastActivity || comDay > op.lastActivity) op.lastActivity = comDay;
          }
        }
      }
    });
  });

  const now = new Date();
  return Array.from(opMap.values())
    .map((op) => {
      const daily = [];
      for (let i = 89; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        daily.push({ date: key, count: op.dailyCounts[key] || 0 });
      }
      return {
        name: op.name,
        // Unique tickets this operator appears in across any role
        totalTouched: op.touchedIds.size,
        // Per-role breakdowns
        assigned: op.cntAssigned,
        created: op.cntCreated,
        closed: op.cntClosed,
        responsible: op.cntResponsible,
        technician: op.cntTechnician,
        // Quality metrics (from assigned tickets)
        open: op.openCount,
        highPri: op.highPri,
        avgMttr: average(op.mttr),
        avgStopDays: average(op.stops),
        // Comment activity (from assigned tickets)
        commentCount: op.commentCount,
        followUpCount: op.followUpCount,
        // Context
        topProject: topMapEntry(op.projects),
        lastActivity: op.lastActivity,
        daily,
        hourly: op.hourlyCounts || Array(24).fill(0),
        // Array of ticketIds for drill-down filtering
        touchedIds: Array.from(op.touchedIds),
      };
    })
    .sort((a, b) => b.totalTouched - a.totalTouched);
}

function buildActiveFilterLabels(state) {
  const labels = [];
  Object.entries(state.filters).forEach(([key, value]) => {
    if (!value) return;
    const meta = FILTER_FIELDS.find((field) => field.key === key);
    if (key === 'dateFrom') labels.push(`Desde: ${formatDate(value)}`);
    else if (key === 'dateTo') labels.push(`Hasta: ${formatDate(value)}`);
    else labels.push(`${meta?.label || key}: ${value}`);
  });
  QUICK_FLAGS.forEach((flag) => {
    if (state.flags[flag.key]) labels.push(flag.label);
  });
  return labels;
}

function buildKpiDateRange(tickets, events) {
  const dates = tickets.map((ticket) => getTicketReferenceDate(ticket)).concat(events.map((event) => getEventReferenceDate(event))).map(parseDate).filter(Boolean).sort((left, right) => left - right);
  if (!dates.length) return 'sin rango temporal';
  const fmt = (d) => d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(dates[0])} → ${fmt(dates[dates.length - 1])}`;
}

function buildVisibleDateRange(tickets, events) {
  const dates = tickets.map((ticket) => getTicketReferenceDate(ticket)).concat(events.map((event) => getEventReferenceDate(event))).map(parseDate).filter(Boolean).sort((left, right) => left - right);
  if (!dates.length) return 'sin rango temporal';
  return `${formatMonthLabel(makeMonthKey(dates[0]))} → ${formatMonthLabel(makeMonthKey(dates[dates.length - 1]))}`;
}

function getFrequentPhrases(tickets) {
  const counter = new Map();
  tickets.forEach((ticket) => {
    const tokens = tokenize(`${ticket.openingComment || ''} ${ticket.resolutionComment || ''}`).filter((token) => token.length > 3 && !STOPWORDS.has(token));
    for (let index = 0; index < tokens.length - 1; index += 1) {
      const phrase = `${tokens[index]} ${tokens[index + 1]}`;
      if (STOPWORDS.has(tokens[index]) || STOPWORDS.has(tokens[index + 1])) continue;
      counter.set(phrase, (counter.get(phrase) || 0) + 1);
    }
  });
  return Array.from(counter.entries())
    .map(([label, value]) => ({ label, value }))
    .filter((item) => item.value > 1)
    .sort((left, right) => right.value - left.value)
    .slice(0, 14);
}

function getHighPriorityComments(tickets) {
  return tickets
    .filter((ticket) => ticket.priority === 'Alta')
    .flatMap((ticket) => {
      const baseScore = Math.max(1, Math.min(12, Math.round(ticket.currentStopDays || ticket.closeDurationDays || ticket.openAgeDays || 1)));
      return [
        { type: 'Apertura', comment: ticket.openingComment },
        { type: 'Solución', comment: ticket.resolutionComment },
      ]
        .filter((entry) => hasText(entry.comment))
        .map((entry) => {
          const comment = String(entry.comment).trim();
          return {
            ticketId: ticket.ticketId,
            ticketStart: ticket.ticketStart || ticket.referenceDate || ticket.clientCreated || ticket.stopStart || ticket.faultStart || null,
            label: truncate(comment, 96),
            meta: `Ticket #${ticket.ticketId} · ${entry.type}`,
            value: baseScore,
            comment,
            type: entry.type,
            title: `${entry.type} · Ticket #${ticket.ticketId}`,
          };
        });
    })
    .sort((left, right) => right.value - left.value || compareDatesDesc(left.ticketStart, right.ticketStart) || String(left.ticketId).localeCompare(String(right.ticketId)))
    .slice(0, 14);
}

function groupSummary(items, labelAccessor) {
  const grouped = new Map();
  items.forEach((item) => {
    const label = labelAccessor(item) || 'Sin dato';
    grouped.set(label, (grouped.get(label) || 0) + 1);
  });
  return Array.from(grouped.entries())
    .map(([label, value]) => ({ label, value, share: percentage(value, items.length) }))
    .sort((left, right) => right.value - left.value);
}

function groupNestedSummary(items, accessor) {
  const grouped = new Map();
  items.forEach((item) => {
    accessor(item).forEach((label) => grouped.set(label, (grouped.get(label) || 0) + 1));
  });
  return Array.from(grouped.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
}

function topGroup(items, accessor) {
  const groups = groupSummary(items, accessor);
  if (!groups.length) return null;
  return groups[0];
}

function topMapEntry(map) {
  return Array.from(map.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] || 'Sin dato';
}

function bucketByMonth(items, dateAccessor, valueAccessor) {
  return items.reduce((accumulator, item) => {
    const date = parseDate(dateAccessor(item));
    if (!date) return accumulator;
    const key = makeMonthKey(date);
    accumulator[key] = round((accumulator[key] || 0) + valueAccessor(item), 4);
    return accumulator;
  }, {});
}

function mergeMonthKeys(left, right) {
  return unique(Object.keys(left).concat(Object.keys(right)));
}

function makeMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function priorityColor(priority) {
  if (priority === 'Alta') return '#c24b4e';
  if (priority === 'Media') return '#d3962a';
  if (priority === 'Baja') return '#2f8b57';
  return '#5387a6';
}

function tokenize(text) {
  return normalizeText(text).split(/\s+/).filter(Boolean);
}

function buildSearchHaystack(ticket) {
  return normalizeText([
    ticket.ticketId,
    '#' + ticket.ticketId,
    ticket.department,
    ticket.municipality,
    ticket.locality,
    ticket.category,
    ticket.project,
    ticket.subProject,
    ticket.assignee,
    ticket.creator,
    ticket.technician,
    ticket.operatorCode,
    ticket.ticketState,
    ticket.priority,
    ticket.escalationGroup,
    ticket.sourceOrigin,
    ticket.openingComment,
    ticket.resolutionComment,
    ticket.textAnalytics?.primaryTopic,
    ...(ticket.textAnalytics?.alertLabels || []),
    ...(ticket.textAnalytics?.matchedSignals || []),
  ].filter(Boolean).join(' '));
}

function matchesText(ticket, query) {
  if (!query) return true;
  const rawQ = query.trim().replace(/^#/, '');
  if (/^\d+$/.test(rawQ) && String(ticket.ticketId).includes(rawQ)) return true;
  
  if (!ticket._haystack) {
    ticket._haystack = buildSearchHaystack(ticket);
  }
  const haystack = ticket._haystack;

  const norm = normalizeText(query.trim());
  const andTerms = norm.split(/\s+/).filter(Boolean);
  return andTerms.every((term) => {
    if (term.startsWith('-') && term.length > 1) {
      return !haystack.includes(term.slice(1));
    }
    if (term.includes('|')) {
      return term.split('|').filter(Boolean).some((opt) => haystack.includes(opt));
    }
    return haystack.includes(term);
  });
}

function compareTextRank(left, right, query) {
  if (!query) {
    return (right.currentStopDays || 0) - (left.currentStopDays || 0) || compareDatesDesc(left.ticketStart, right.ticketStart);
  }
  const norm = normalizeText(query.trim());
  const terms = norm.split(/\s+/).filter((t) => !t.startsWith('-'));
  const score = (ticket) => {
    let pts = 0;
    const idStr = String(ticket.ticketId || '');
    if (idStr.startsWith(norm) || idStr === norm) pts += 20;
    terms.forEach((term) => {
      if (normalizeText(idStr).includes(term)) pts += 10;
      if (normalizeText(ticket.openingComment).includes(term)) pts += 2;
      if (normalizeText(ticket.resolutionComment).includes(term)) pts += 3;
      if (normalizeText(ticket.textAnalytics?.primaryTopic).includes(term)) pts += 2;
      if ((ticket.textAnalytics?.alertLabels || []).some((l) => normalizeText(l).includes(term))) pts += 2;
      if (normalizeText(ticket.assignee).includes(term)) pts += 4;
      if (normalizeText(ticket.department).includes(term)) pts += 3;
      if (normalizeText(ticket.municipality).includes(term)) pts += 3;
    });
    return pts;
  };
  return score(right) - score(left) || (right.currentStopDays || 0) - (left.currentStopDays || 0) || compareDatesDesc(left.ticketStart, right.ticketStart);
}

function getTicketReferenceDate(ticket) {
  return ticket.referenceDate || ticket.ticketStart || ticket.faultStart || ticket.stopStart || null;
}

function getEventReferenceDate(event) {
  return event.stopStart || event.faultStart || null;
}

function matchesDate(value, from, to) {
  if (!from && !to) return true;
  const date = parseDate(value);
  if (!date) return false;
  if (from && date < parseDate(`${from}T00:00:00`)) return false;
  if (to && date > parseDate(`${to}T23:59:59`)) return false;
  return true;
}

export function parseCommentThread(openingComment, resolutionComment) {
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

export function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeText(value) {
  return removeAccents(String(value || '')).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function removeAccents(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function formatDate(value) {
  const date = parseDate(value);
  if (!date) return 'Sin dato';
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' });
}

export function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return 'Sin dato';
  return date.toLocaleString('es-CO', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function formatMonthLabel(key) {
  const date = parseDate(`${key}-01T00:00:00`);
  return date ? date.toLocaleDateString('es-CO', { year: '2-digit', month: 'short' }) : key;
}

export function formatInteger(value) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value || 0);
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
}

export function formatPercent(value) {
  if (!isFiniteNumber(value)) return 'Sin dato';
  return `${round(value, 1).toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`;
}

export function formatDays(value) {
  if (!isFiniteNumber(value)) return 'Sin dato';
  if (value === 0) return '0 d';
  if (value < 1) return `${round(value * 24, 1).toLocaleString('es-CO', { maximumFractionDigits: 1 })} h`;
  return `${round(value, value >= 10 ? 1 : 2).toLocaleString('es-CO', { maximumFractionDigits: value >= 10 ? 1 : 2 })} d`;
}

export function badgeTone(label, type = 'state') {
  const token = String(label || 'Sin dato');
  if (type === 'priority') {
    if (token === 'Alta') return 'danger';
    if (token === 'Media') return 'warning';
    if (token === 'Baja') return 'success';
    return 'info';
  }
  if (token === 'Abierto') return 'success';
  if (token === 'Cerrado') return 'info';
  if (token === 'Anulado') return 'danger';
  return 'neutral';
}

export function highlightText(text, query) {
  if (!text) return [{ type: 'text', value: 'Sin comentario.' }];
  if (!query) return [{ type: 'text', value: truncate(text, 180) }];
  const source = truncate(text, 180);
  const pattern = new RegExp(`(${escapeRegExp(query)})`, 'ig');
  const exactPattern = new RegExp(`^${escapeRegExp(query)}$`, 'i');
  return source.split(pattern).filter(Boolean).map((part) => ({ type: exactPattern.test(part) ? 'mark' : 'text', value: part }));
}

function compareDatesDesc(left, right) {
  const leftValue = parseDate(left)?.getTime() || 0;
  const rightValue = parseDate(right)?.getTime() || 0;
  return rightValue - leftValue;
}

function truncate(value, maxLength) {
  if (!value) return '';
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function average(values) {
  const scoped = values.filter(isFiniteNumber);
  if (!scoped.length) return null;
  return sum(scoped) / scoped.length;
}

function median(values) {
  const scoped = values.filter(isFiniteNumber).sort((left, right) => left - right);
  if (!scoped.length) return null;
  const middle = Math.floor(scoped.length / 2);
  return scoped.length % 2 ? scoped[middle] : (scoped[middle - 1] + scoped[middle]) / 2;
}

function minDate(left, right) {
  if (!left) return right || null;
  if (!right) return left;
  return parseDate(left) <= parseDate(right) ? left : right;
}

function maxDate(left, right) {
  if (!left) return right || null;
  if (!right) return left;
  return parseDate(left) >= parseDate(right) ? left : right;
}

function sum(values) {
  return values.reduce((accumulator, value) => accumulator + (isFiniteNumber(value) ? value : 0), 0);
}

function max(values) {
  const scoped = values.filter(isFiniteNumber);
  return scoped.length ? Math.max(...scoped) : null;
}

function percentage(value, total) {
  return total ? (value / total) * 100 : 0;
}

function round(value, precision = 0) {
  const factor = 10 ** precision;
  return Math.round((value || 0) * factor) / factor;
}

function hasText(value) {
  return Boolean(value && String(value).trim());
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}


function unique(values) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right, 'es', { sensitivity: 'base' }));
}

/**
 * buildMaintenanceContext — transforma los tickets con OT en registros útiles
 * para la vista de mantenimiento.
 *
 * @param {Array} allTickets - tickets YA filtrados por el contexto activo
 * @param {string} query     - búsqueda libre (ID OT, ID ticket, técnico, estado…)
 */
export function buildMaintenanceContext(allTickets, query = '') {
  const mTickets = allTickets.filter((t) => t.maintenanceId);
  const normalized = normalizeText(query);

  const filtered = normalized
    ? mTickets.filter((t) =>
        normalizeText(t.maintenanceId).includes(normalized) ||
        normalizeText(t.ticketId).includes(normalized) ||
        normalizeText(t.technician).includes(normalized) ||
        normalizeText(t.maintenanceState).includes(normalized) ||
        normalizeText(t.department).includes(normalized) ||
        normalizeText(t.municipality).includes(normalized)
      )
    : mTickets;

  const total = mTickets.length;
  const done  = mTickets.filter((t) => t.maintenanceEnd).length;
  const open  = mTickets.filter((t) => !t.maintenanceEnd).length;
  const techs = new Set(mTickets.map((t) => t.technician).filter(Boolean)).size;

  // Agrupación por estado de la OT
  const stateMap = new Map();
  mTickets.forEach((t) => {
    const s = t.maintenanceState || 'Sin estado';
    stateMap.set(s, (stateMap.get(s) || 0) + 1);
  });
  const byState = Array.from(stateMap.entries())
    .map(([label, value]) => ({ label, value, share: percentage(value, total) }))
    .sort((a, b) => b.value - a.value);

  // Agrupación por técnico
  const techMap = new Map();
  mTickets.forEach((t) => {
    const k = t.technician || 'Sin técnico';
    const cur = techMap.get(k) || { total: 0, done: 0, open: 0, durations: [] };
    cur.total += 1;
    if (t.maintenanceEnd) { cur.done += 1; } else { cur.open += 1; }
    const dur = _mntDuration(t.maintenanceStart, t.maintenanceEnd);
    if (dur != null) cur.durations.push(dur);
    techMap.set(k, cur);
  });
  const byTech = Array.from(techMap.entries())
    .map(([name, m]) => ({
      name,
      total: m.total,
      done: m.done,
      open: m.open,
      avgDays: m.durations.length
        ? round(m.durations.reduce((s, v) => s + v, 0) / m.durations.length, 1)
        : null,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  // Filas de la tabla (ya filtradas por búsqueda)
  const rows = filtered
    .map((t) => ({
      maintenanceId:  t.maintenanceId,
      ticketId:       t.ticketId,
      state:          t.maintenanceState || 'Sin estado',
      technician:     t.technician       || 'Sin técnico',
      creator:        t.maintenanceCreator || null,
      closer:         t.maintenanceCloser  || null,
      department:     t.department || 'Sin dato',
      municipality:   t.municipality || 'Sin dato',
      start:          t.maintenanceStart || null,
      end:            t.maintenanceEnd   || null,
      durationDays:   _mntDuration(t.maintenanceStart, t.maintenanceEnd),
      ticketPriority: t.priority    || 'Sin dato',
      ticketState:    t.ticketState || 'Sin dato',
      project:        t.project || null,
    }))
    .sort((a, b) => {
      const aOpen = !a.end ? 1 : 0;
      const bOpen = !b.end ? 1 : 0;
      return bOpen - aOpen || _mntDateDesc(a.start, b.start);
    });

  return {
    kpis: { total, done, open, techs, completionRate: percentage(done, total) },
    byState,
    byTech,
    rows,
    totalFiltered: filtered.length,
  };
}

function _mntDuration(start, end) {
  if (!start || !end) return null;
  const ms = new Date(end) - new Date(start);
  return ms < 0 ? null : round(ms / 86400000, 2);
}

function _mntDateDesc(a, b) {
  return new Date(b || 0).getTime() - new Date(a || 0).getTime();
}

// ─── ANS Module ───────────────────────────────────────────────────────────────
// ANS_THRESHOLD_HOURS: umbral de referencia para el módulo de tiempos de respuesta.
export const ANS_THRESHOLD_HOURS = 24;
// Alias de compatibilidad (se mantiene por si hay referencias directas)
export const DEFAULT_ANS_THRESHOLD_HOURS = 24;

export function getSlaThreshold(ticket) {
  const cat = (ticket.category || '').toLowerCase();
  
  if (cat.includes('masiva')) return 8;
  if (cat.includes('gpon') || cat.includes('troncal') || cat.includes('nodo') || cat.includes('zcp')) return 12;
  
  return 24;
}

/**
 * computeANS — calcula el tiempo neto efectivo de un ticket con Parada de Reloj.
 *
 * Tiempo Bruto  = faultEnd (o ahora si abierto) - faultStart, en horas.
 * Tiempo Parada = stopDaysTotal * 24 horas.
 * Tiempo Neto   = Bruto - Parada.
 * Estado        = netHours <= 10h → 'cumple'; > 10h → 'incumple'; sin fecha → 'sin-dato'.
 * Restante      = 10 - netHours  (negativo = excedido).
 */
export function computeANS(ticket) {
  const start = ticket.faultStart || ticket.ticketStart || ticket.referenceDate;
  const rawEnd = ticket.faultEnd || ticket.ticketEnd;
  const isOpen = ticket.ticketState === 'Abierto';
  const refEnd = rawEnd || (isOpen ? new Date().toISOString() : null);

  const stopHours = round(((ticket.currentStopDays || ticket.stopDaysTotal || 0)) * 24, 2);

  if (!start || !refEnd) {
    return { grossHours: null, stopHours, netHours: null, remainingHours: null, status: 'sin-dato', isOpen, thresholdHours: null };
  }

  const thresholdHours = getSlaThreshold(ticket);
  const grossHours = round((new Date(refEnd) - new Date(start)) / 3600000, 2);
  const netHours   = round(Math.max(0, grossHours - stopHours), 2);
  const remainingHours = round(thresholdHours - netHours, 2);
  const status = netHours <= thresholdHours ? 'cumple' : 'incumple';

  return { grossHours, stopHours, netHours, remainingHours, status, isOpen, thresholdHours };
}

/**
 * buildANSContext — agrega métricas ANS sobre los tickets ya filtrados.
 */
export function buildANSContext(allTickets, ansFilter = {}) {
  // Filtros secundarios propios de la vista ANS
  const { department = '', municipality = '', operatorCode = '' } = ansFilter;

  let base = allTickets;
  if (department)    base = base.filter((t) => t.department === department);
  if (municipality)  base = base.filter((t) => t.municipality === municipality);
  if (operatorCode)  base = base.filter((t) => t.operatorCode === operatorCode);

  // Enriquece cada ticket con su cálculo ANS
  const enriched = base.map((t) => ({ ...t, _ans: computeANS(t) }));

  const withData    = enriched.filter((t) => t._ans.status !== 'sin-dato');
  const cumple      = withData.filter((t) => t._ans.status === 'cumple');
  const incumple    = withData.filter((t) => t._ans.status === 'incumple');
  const sinDato     = enriched.filter((t) => t._ans.status === 'sin-dato');

  const avgStopHours = withData.length
    ? round(withData.reduce((s, t) => s + t._ans.stopHours, 0) / withData.length, 1)
    : null;

  const avgNetHours = withData.length
    ? round(withData.reduce((s, t) => s + t._ans.netHours, 0) / withData.length, 1)
    : null;

  // Agrupación por departamento (cumplimiento %)
  const deptMap = new Map();
  withData.forEach((t) => {
    const k = t.department || 'Sin dato';
    const cur = deptMap.get(k) || { total: 0, cumple: 0, incumple: 0 };
    cur.total += 1;
    if (t._ans.status === 'cumple') cur.cumple += 1; else cur.incumple += 1;
    deptMap.set(k, cur);
  });
  const byDept = Array.from(deptMap.entries())
    .map(([label, m]) => ({ label, total: m.total, cumple: m.cumple, incumple: m.incumple, rate: percentage(m.cumple, m.total) }))
    .sort((a, b) => b.incumple - a.incumple);

  // Agrupación por operador
  const opMap = new Map();
  withData.forEach((t) => {
    const k = t.operatorCode || t.assignee || 'Sin operador';
    const cur = opMap.get(k) || { total: 0, cumple: 0, incumple: 0 };
    cur.total += 1;
    if (t._ans.status === 'cumple') cur.cumple += 1; else cur.incumple += 1;
    opMap.set(k, cur);
  });
  const byOperator = Array.from(opMap.entries())
    .map(([label, m]) => ({ label, total: m.total, cumple: m.cumple, incumple: m.incumple, rate: percentage(m.cumple, m.total) }))
    .sort((a, b) => b.incumple - a.incumple)
    .slice(0, 15);

  // Filas de la tabla — incumplidos primero, luego por netHours desc
  const rows = enriched
    .filter((t) => t._ans.status !== 'sin-dato')
    .sort((a, b) => {
      if (a._ans.status !== b._ans.status) return a._ans.status === 'incumple' ? -1 : 1;
      return b._ans.netHours - a._ans.netHours;
    })
    .map((t) => ({
      ticketId:       t.ticketId,
      operatorCode:   t.operatorCode || t.assignee || '—',
      department:     t.department || 'Sin dato',
      municipality:   t.municipality || 'Sin dato',
      locality:       t.locality || null,
      project:        t.project || null,
      ticketState:    t.ticketState || 'Sin dato',
      priority:       t.priority || 'Sin dato',
      faultStart:     t.faultStart || t.ticketStart,
      faultEnd:       t.faultEnd || t.ticketEnd,
      grossHours:     t._ans.grossHours,
      stopHours:      t._ans.stopHours,
      netHours:       t._ans.netHours,
      remainingHours: t._ans.remainingHours,
      status:         t._ans.status,
      isOpen:         t._ans.isOpen,
    }));

  // Opciones de filtro propias de ANS
  const filterOptions = {
    department:   [...new Set(allTickets.map((t) => t.department).filter(Boolean))].sort(),
    municipality: [...new Set(allTickets.map((t) => t.municipality).filter(Boolean))].sort(),
    operatorCode: [...new Set(allTickets.map((t) => t.operatorCode || t.assignee).filter(Boolean))].sort(),
  };

  return {
    kpis: {
      total:       enriched.length,
      cumple:      cumple.length,
      incumple:    incumple.length,
      sinDato:     sinDato.length,
      complianceRate: percentage(cumple.length, withData.length),
      avgStopHours,
      avgNetHours,
    },
    byDept,
    byOperator,
    rows,
    filterOptions,
  };
}

/**
 * buildAvailabilityContext — Indicador 2: Disponibilidad por Red de Acceso
 * Metodología GP-D-JDI-023 (Anexo 11).
 *
 * Solo se contabilizan como indisponibilidad los tickets que cumplan TODAS las condiciones:
 *   1. Responsable = Inred (priority 'Alta' en los datos, o category en IMPUTABLE_CATEGORIES)
 *   2. Nivel de afectación = ALTA (priority === 'Alta')
 *   3. Categoría en IMPUTABLE_CATEGORIES
 *
 * Fórmula: Disponibilidad (%) = [(TiempoTotal – TiempoIndisponibilidad) / TiempoTotal] × 100
 * Umbral mínimo exigido: ≥ 98 %
 * Período base: 720 horas (30 días)
 *
 * @param {Array}  tickets        - tickets ya filtrados por el contexto activo
 * @param {number} [periodHours]  - horas del período de evaluación (default 720)
 */
export function buildAvailabilityContext(tickets, periodHours = AVAILABILITY_PERIOD_HOURS) {
  // Normaliza un texto para comparación insensible a tildes y mayúsculas
  function normCat(s) {
    return removeAccents(String(s || '')).toLowerCase().trim();
  }

  const imputables = IMPUTABLE_CATEGORIES.map(normCat);

  function isImputable(ticket) {
    const catOk = imputables.includes(normCat(ticket.category));
    const prioOk = (ticket.priority || '').toLowerCase().includes('alta');
    return catOk && prioOk;
  }

  // Calcula horas de indisponibilidad de un ticket (creación → cierre)
  function downtimeHours(ticket) {
    const start = ticket.ticketStart || ticket.referenceDate || ticket.faultStart;
    const end   = ticket.ticketEnd   || ticket.faultEnd;
    if (!start || !end) return 0;
    const ms = new Date(end) - new Date(start);
    return ms > 0 ? round(ms / 3600000, 2) : 0;
  }

  // Agrupa por Junta (locality → fallback municipality → fallback department)
  const juntaMap = new Map();

  tickets.forEach((ticket) => {
    const junta = ticket.locality || ticket.municipality || ticket.department || 'Sin dato';
    const cur = juntaMap.get(junta) || {
      junta,
      municipality: ticket.municipality || null,
      department:   ticket.department   || null,
      totalTickets: 0,
      imputables:   [],
      excluded:     [],
    };
    cur.totalTickets += 1;
    if (isImputable(ticket)) {
      cur.imputables.push({
        ticketId:      ticket.ticketId,
        category:      ticket.category,
        priority:      ticket.priority,
        ticketStart:   ticket.ticketStart || ticket.referenceDate,
        ticketEnd:     ticket.ticketEnd,
        ticketState:   ticket.ticketState,
        downtimeHours: downtimeHours(ticket),
      });
    } else if ((ticket.priority || '').toLowerCase().includes('alta')) {
      cur.excluded.push({ ticketId: ticket.ticketId, category: ticket.category, reason: 'Categoría no imputable o responsable externo' });
    }
    juntaMap.set(junta, cur);
  });

  // Calcula disponibilidad por Junta
  const juntas = Array.from(juntaMap.values()).map((j) => {
    const totalDowntime = j.imputables.reduce((s, t) => s + t.downtimeHours, 0);
    const effectiveDowntime = Math.min(totalDowntime, periodHours); // no puede superar el período
    const availability = round(((periodHours - effectiveDowntime) / periodHours) * 100, 2);
    const cumple = availability >= AVAILABILITY_MIN_PCT;
    return {
      junta:         j.junta,
      municipality:  j.municipality,
      department:    j.department,
      totalTickets:  j.totalTickets,
      imputables:    j.imputables,
      excluded:      j.excluded,
      imputableCount: j.imputables.length,
      totalDowntimeHours: round(totalDowntime, 2),
      availability,
      cumple,
      periodHours,
    };
  }).sort((a, b) => a.availability - b.availability); // peor primero

  const juntas98    = juntas.filter((j) => j.cumple);
  const juntasFail  = juntas.filter((j) => !j.cumple);
  const avgAvail    = juntas.length ? round(juntas.reduce((s, j) => s + j.availability, 0) / juntas.length, 2) : null;
  const totalDowntime = round(juntas.reduce((s, j) => s + j.totalDowntimeHours, 0), 2);

  return {
    juntas,
    kpis: {
      total:       juntas.length,
      cumple:      juntas98.length,
      incumple:    juntasFail.length,
      avgAvailability: avgAvail,
      totalDowntimeHours: totalDowntime,
      periodHours,
      minPct: AVAILABILITY_MIN_PCT,
    },
  };
}

/**
 * buildJDIAvailabilityContext — extiende buildAvailabilityContext con:
 *   - Filtrado por junta / estado de cumplimiento
 *   - Datos listos para gráficas (distribución, top ofensores)
 *   - Opciones de filtro para el selector inteligente
 *
 * @param {Array}  tickets
 * @param {{ junta?: string, status?: 'cumple'|'incumple'|'' }} jdiFilter
 * @param {number} periodHours
 */
export function buildJDIAvailabilityContext(tickets, jdiFilter = {}, periodHours = AVAILABILITY_PERIOD_HOURS) {
  const base = buildAvailabilityContext(tickets, periodHours);

  // ── Filtered juntas (para tabla y detalle) ────────────────────────────
  let filteredJuntas = base.juntas;
  if (jdiFilter.junta) {
    filteredJuntas = filteredJuntas.filter((j) => j.junta === jdiFilter.junta);
  }
  if (jdiFilter.status === 'cumple') {
    filteredJuntas = filteredJuntas.filter((j) => j.cumple);
  } else if (jdiFilter.status === 'incumple') {
    filteredJuntas = filteredJuntas.filter((j) => !j.cumple);
  }

  // ── Distribución de disponibilidad (para gráfica de anillos/barras) ───
  const dist = {
    perfect:  base.juntas.filter((j) => j.availability >= 100).length,
    high:     base.juntas.filter((j) => j.availability >= 99  && j.availability < 100).length,
    mid:      base.juntas.filter((j) => j.availability >= 98  && j.availability < 99).length,
    below:    base.juntas.filter((j) => j.availability < 98).length,
  };

  // ── Top ofensores (más horas de caída, para bar chart) ────────────────
  const topOffenders = [...base.juntas]
    .filter((j) => j.totalDowntimeHours > 0)
    .sort((a, b) => b.totalDowntimeHours - a.totalDowntimeHours)
    .slice(0, 8);

  // ── Opciones para selector inteligente ────────────────────────────────
  const juntaOptions = base.juntas.map((j) => j.junta).sort((a, b) => a.localeCompare(b, 'es'));

  return {
    ...base,
    filteredJuntas,
    dist,
    topOffenders,
    juntaOptions,
  };
}

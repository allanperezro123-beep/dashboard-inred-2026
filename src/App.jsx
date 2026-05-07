import { AlertCircle, AlertTriangle, Bell, CheckCircle, Clock, Layers, Search, ShieldCheck, Sparkles, Timer, TrendingDown, User, Users, Zap } from './components/Icons';
import { Fragment, startTransition, useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';
import * as XLSX from 'xlsx-js-style';
import { getDownloadURL, getMetadata, ref as storageRef, uploadBytes } from 'firebase/storage';

import { BarList, GeoMap, LineChart, Pie3D, StackedRows } from './components/Charts';
import { DataTable } from './components/DataTable';
import { DrillPanel } from './components/DrillPanel';
import { DetailDrawer } from './components/DetailDrawer';
import { OperatorModal } from './components/OperatorModal';
import { Sidebar } from './components/Sidebar';
import { exportTableExcel, exportJDIReport } from './lib/exporters';
import {
  ANS_THRESHOLD_HOURS,
  AVAILABILITY_MIN_PCT,
  AVAILABILITY_PERIOD_HOURS,
  IMPUTABLE_CATEGORIES,
  VELOCITY_COMPLIANCE_THRESHOLD,
  VELOCITY_SAMPLE_PCT,
  VELOCITY_THRESHOLDS,
  DEFAULT_FILTERS,
  DEFAULT_FLAGS,
  QUICK_FLAGS,
  VIEW_OPTIONS,
  badgeTone,
  buildANSContext,
  buildAvailabilityContext,
  buildJDIAvailabilityContext,
  buildDashboardContext,
  buildMaintenanceContext,
  formatDate,
  formatDateTime,
  formatDays,
  formatInteger,
  formatPercent,
  highlightText,
  sanitizeFilters,
  computeANS,
} from './lib/analytics';
import { firebaseStorage } from './lib/firebaseClient';

// ─── KPI icon map ─────────────────────────────────────────────────────
const KPI_ICONS = [
  { icon: Layers,      bg: 'linear-gradient(135deg,#3b82f6,#60a5fa)', ring: 'rgba(59,130,246,.2)' },
  { icon: CheckCircle, bg: 'linear-gradient(135deg,#10b981,#34d399)', ring: 'rgba(16,185,129,.2)' },
  { icon: Timer,       bg: 'linear-gradient(135deg,#6366f1,#818cf8)', ring: 'rgba(99,102,241,.2)' },
  { icon: ShieldCheck, bg: 'linear-gradient(135deg,#10b981,#34d399)', ring: 'rgba(16,185,129,.2)' },
  { icon: Clock,       bg: 'linear-gradient(135deg,#ef4444,#f87171)', ring: 'rgba(239,68,68,.2)' },
  { icon: Sparkles,    bg: 'linear-gradient(135deg,#a855f7,#c084fc)', ring: 'rgba(168,85,247,.2)' },
];

// ─── KPI drill mappings (index-matched with KPI_ICONS) ─────────────────
const KPI_DRILL = [
  (ctx) => ({ tickets: ctx.tickets,                                                                  subtitle: `${ctx.tickets.length} tickets en la vista actual` }),
  (ctx) => ({ tickets: ctx.tickets.filter((t) => t.ticketState === 'Cerrado'),                      subtitle: 'Tickets ya resueltos y cerrados' }),
  (ctx) => ({ tickets: ctx.tickets.filter((t) => t.ticketState === 'Cerrado'),                      subtitle: 'Tickets ya resueltos y cerrados' }),
  (ctx) => ({ tickets: ctx.tickets.filter((t) => (t.currentStopDays || 0) > 0),                     subtitle: 'Tickets con parada registrada' }),
  (ctx) => ({ tickets: ctx.tickets.filter((t) => (t.currentStopDays || 0) > 0).sort((a, b) => (b.currentStopDays || 0) - (a.currentStopDays || 0)), subtitle: 'Ordenado por días de parada descendente' }),
  (ctx) => ({ tickets: ctx.tickets.filter((t) => t.textAnalytics?.alertLabels?.length),             subtitle: 'Tickets con alertas detectadas en el texto' }),
];

const AUTH_USERS_KEY = 'inred.auth.users.v1';
const AUTH_LOGS_KEY = 'inred.auth.logs.v1';
const AUTH_SESSION_KEY = 'inred.auth.session.v1';

const DEFAULT_AUTH_USERS = [
  { username: 'Allan_ADMIN', password: '150425', role: 'admin', createdAt: new Date().toISOString() },
  { username: 'Julio', password: '150425', role: 'operator', createdAt: new Date().toISOString() },
  { username: 'Andres_Santana', password: '150425', role: 'operator', createdAt: new Date().toISOString() },
  { username: 'Wilmer_MDA', password: '150425', role: 'operator', createdAt: new Date().toISOString() },
  { username: 'Andrea_Corp', password: '150425', role: 'operator', createdAt: new Date().toISOString() },
];

function loadUsers() {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    if (!raw) {
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(DEFAULT_AUTH_USERS));
      return DEFAULT_AUTH_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(DEFAULT_AUTH_USERS));
      return DEFAULT_AUTH_USERS;
    }
    // Merge: add any default users missing from stored list
    const stored = [...parsed];
    let changed = false;
    for (const def of DEFAULT_AUTH_USERS) {
      if (!stored.find(u => u.username === def.username)) {
        stored.push(def);
        changed = true;
      }
    }
    if (changed) localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(stored));
    return stored;
  } catch {
    return DEFAULT_AUTH_USERS;
  }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function loadLogs() {
  try {
    const raw = localStorage.getItem(AUTH_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  localStorage.setItem(AUTH_LOGS_KEY, JSON.stringify(logs.slice(0, 200)));
}

export default function App() {
  const uploadInputRef = useRef(null);
  const [authUsers, setAuthUsers] = useState(() => loadUsers());
  const [authLogs, setAuthLogs] = useState(() => loadLogs());
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem(AUTH_SESSION_KEY) || '');
  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '' });
  const [recoverForm, setRecoverForm] = useState({ username: '', next: '', confirm: '' });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataSyncNote, setDataSyncNote] = useState('');
  const [sharedFileMeta, setSharedFileMeta] = useState(null);
  const [uploadInfo, setUploadInfo] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [view, setView] = useState('general');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [textSearch, setTextSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [drillDown, setDrillDown] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [visibility, setVisibility] = useState('visible');
  const [interactionScope, setInteractionScope] = useState(null);
  const [interactionFeedback, setInteractionFeedback] = useState('');
  const [activeGeoDepartment, setActiveGeoDepartment] = useState('');
  const [mntSearch, setMntSearch] = useState('');
  const [ansFilter, setAnsFilter] = useState({ department: '', municipality: '', operatorCode: '' });
  const [jdiFilter, setJdiFilter] = useState({ junta: '', status: '' });
  const deferredTextSearch = useDeferredValue(textSearch);

  useEffect(() => {
  document.title = 'Dashboard Tickets INRED';
  }, []);

  useEffect(() => {
    window.__preloaderReady?.();
  }, []);

  const loadSharedExcel = useCallback(async ({ background = false } = {}) => {
    if (!background) {
      setLoading(true);
      setError('');
    }
    try {
      const fileRef = storageRef(firebaseStorage, 'dashboard/latest.xlsx');
      const [meta, downloadURL] = await Promise.all([
        getMetadata(fileRef),
        getDownloadURL(fileRef),
      ]);
      const bustURL = `${downloadURL}${downloadURL.includes('?') ? '&' : '?'}t=${Date.now()}`;
      const response = await fetch(bustURL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('No se pudo descargar el Excel compartido.');
      }
      const arrayBuffer = await response.arrayBuffer();
      const payload = parseExcelToDashboardPayload(meta.name || 'latest.xlsx', arrayBuffer);
      setData(payload);
      setSharedFileMeta({
        name: meta.name || 'latest.xlsx',
        updated: meta.updated || '',
      });
      setDataSyncNote(`Fuente global activa: ${meta.name || 'latest.xlsx'} (${formatDateTime(meta.updated)})`);
      setUploadError('');
    } catch (loadErr) {
      const code = loadErr && typeof loadErr === 'object' ? loadErr.code : '';
      if (code === 'storage/object-not-found') {
        setData(null);
        setSharedFileMeta(null);
        setDataSyncNote('Aún no hay archivo global cargado.');
        setUploadInfo('Aún no hay Excel global. Adjunta el primero para iniciar el dashboard compartido.');
        setUploadError('');
      } else {
        setError(loadErr instanceof Error ? loadErr.message : 'No se pudo cargar la fuente global.');
      }
    } finally {
      if (!background) {
        setLoading(false);
        window.__preloaderReady?.();
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    loadSharedExcel();
  }, [currentUser, loadSharedExcel]);

  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(async () => {
      try {
        const fileRef = storageRef(firebaseStorage, 'dashboard/latest.xlsx');
        const meta = await getMetadata(fileRef);
        if (!meta.updated) return;
        if (!sharedFileMeta?.updated || meta.updated !== sharedFileMeta.updated) {
          await loadSharedExcel({ background: true });
        }
      } catch {
        // Silently ignore transient polling errors
      }
    }, 45000);
    return () => clearInterval(timer);
  }, [currentUser, loadSharedExcel, sharedFileMeta?.updated]);

  const context = useMemo(
    () => (data ? buildDashboardContext(data, {
      filters,
      flags,
      textSearch: deferredTextSearch,
      visibility,
      interactionTicketIds: interactionScope?.ticketIds || null,
    }) : null),
    [data, filters, flags, deferredTextSearch, visibility, interactionScope],
  );

  const openDrill = useCallback((title, subtitle, tickets) => {
    setDrillDown({ title, subtitle, tickets });
    const ids = Array.from(new Set((tickets || []).map((ticket) => String(ticket.ticketId || '')).filter(Boolean)));
    if (ids.length > 0) {
      setInteractionScope({ label: title, source: 'drill', ticketIds: ids });
    }
  }, []);

  function applyInteractiveScope(title, tickets) {
    try {
      const list = Array.isArray(tickets) ? tickets : [];
      const ids = Array.from(new Set(list.map((ticket) => String(ticket?.ticketId || '')).filter(Boolean)));
      if (!ids.length) {
        setInteractionFeedback(`Sin resultados para "${title}".`);
        setDrillDown({ title, subtitle: 'Sin tickets para esta interacción.', tickets: [] });
        return;
      }
      setInteractionScope({ label: title, source: 'interactive', ticketIds: ids });
      setInteractionFeedback(`Filtro aplicado: ${title} (${formatInteger(ids.length)} tickets).`);
    } catch {
      setInteractionFeedback('La interacción no pudo completarse, intenta de nuevo.');
    }
  }

  function clearInteractiveScope() {
    setInteractionScope(null);
  }

  function handleDrillTicket(id) {
    setSelectedTicketId(id);
    setDrillDown(null);
  }

  const baseTicketCount = data?.meta?.recordCounts?.tickets || data?.tickets?.length || 0;
  const baseStopEventCount = data?.meta?.recordCounts?.stopEvents || data?.stopEvents?.length || 0;
  const exactGeoTickets = data?.meta?.geoCoverage?.['municipality-exact'] || 0;
  const geoExactCoverage = baseTicketCount ? (exactGeoTickets / baseTicketCount) * 100 : 0;
  useEffect(() => {
    if (!context) return;
    const next = sanitizeFilters(filters, context.availableOptions);
    if (!sameFilters(filters, next)) {
      startTransition(() => setFilters(next));
    }
  }, [context, filters]);

  useEffect(() => {
    if (!context || !selectedTicketId) return;
    if (!context.tickets.some((ticket) => ticket.ticketId === selectedTicketId)) {
      setSelectedTicketId('');
    }
  }, [context, selectedTicketId]);

  const selectedTicket = context?.tickets.find((ticket) => ticket.ticketId === selectedTicketId) || null;

  const searchSuggestions = useMemo(() => {
    if (!textSearch || textSearch.length < 2 || !context) return [];
    const query = textSearch.toLowerCase();
    
    // Si contiene caracteres especiales de búsqueda como - o |, no sugerimos
    if (query.includes('-') || query.includes('|')) return [];
    
    const suggestions = new Set();
    const isIdSearch = query.startsWith('#') || !isNaN(query.replace('#', ''));
    const numQuery = query.replace('#', '');
    
    if (isIdSearch) {
      // Búsqueda rápida por ID en la muestra
      let count = 0;
      for (const t of context.tickets) {
        if (count >= 8) break;
        const ticketId = String(t.ticketId || '');
        if (ticketId.includes(numQuery)) {
          suggestions.add(`#${ticketId}`);
          count++;
        }
      }
    } else {
      // Búsqueda ultrarrápida usando las opciones precalculadas del contexto
      const checkOptions = (options) => {
        if (!options) return;
        for (const opt of options) {
          if (suggestions.size >= 8) return;
          if (opt && opt.toLowerCase().includes(query)) suggestions.add(opt);
        }
      };
      checkOptions(context.availableOptions.department);
      checkOptions(context.availableOptions.municipality);
      checkOptions(context.availableOptions.category);
      checkOptions(['Abierto', 'Cerrado', 'Cancelado']);
    }
    return Array.from(suggestions);
  }, [textSearch, context?.availableOptions, context?.tickets]);

  useEffect(() => {
    if (!showSuggestions) {
      setActiveSuggestion(-1);
      return;
    }
    setActiveSuggestion((current) => {
      if (!searchSuggestions.length) return -1;
      return current >= 0 && current < searchSuggestions.length ? current : 0;
    });
  }, [showSuggestions, searchSuggestions]);

  const applySearchSuggestion = useCallback((value) => {
    setTextSearch(value);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  }, []);

  const clearSearch = useCallback(() => {
    setTextSearch('');
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  }, []);

  const handleSearchKeyDown = useCallback((event) => {
    if (event.key === 'ArrowDown') {
      if (!searchSuggestions.length) return;
      event.preventDefault();
      setShowSuggestions(true);
      setActiveSuggestion((current) => {
        if (current < 0) return 0;
        return (current + 1) % searchSuggestions.length;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      if (!searchSuggestions.length) return;
      event.preventDefault();
      setShowSuggestions(true);
      setActiveSuggestion((current) => {
        if (current < 0) return searchSuggestions.length - 1;
        return (current - 1 + searchSuggestions.length) % searchSuggestions.length;
      });
      return;
    }

    if (event.key === 'Enter' && showSuggestions && activeSuggestion >= 0 && searchSuggestions[activeSuggestion]) {
      event.preventDefault();
      applySearchSuggestion(searchSuggestions[activeSuggestion]);
      return;
    }

    if (event.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  }, [activeSuggestion, applySearchSuggestion, searchSuggestions, showSuggestions]);

  function pushAuthLog(action, username) {
    const nextLogs = [{ action, username, at: new Date().toISOString() }, ...authLogs].slice(0, 200);
    setAuthLogs(nextLogs);
    saveLogs(nextLogs);
  }

  function handleLoginSubmit(event) {
    event.preventDefault();
    const username = loginForm.username.trim();
    const password = loginForm.password;
    const match = authUsers.find((user) => user.username === username && user.password === password);
    if (!match) {
      setAuthError('Usuario o contraseña inválidos.');
      setAuthInfo('');
      return;
    }
    setAuthError('');
    setAuthInfo('');
    setCurrentUser(match.username);
    localStorage.setItem(AUTH_SESSION_KEY, match.username);
    pushAuthLog('login', match.username);
    setLoginForm({ username: '', password: '' });
  }

  function handleLogout() {
    if (currentUser) {
      pushAuthLog('logout', currentUser);
    }
    localStorage.removeItem(AUTH_SESSION_KEY);
    setCurrentUser('');
    setShowUser(false);
  }

  function handleCreateUser(event) {
    event.preventDefault();
    const username = newUserForm.username.trim();
    const password = newUserForm.password.trim();
    if (!username || !password) {
      setAuthError('Debes ingresar usuario y contraseña para crear un usuario nuevo.');
      setAuthInfo('');
      return;
    }
    if (authUsers.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      setAuthError('Ese usuario ya existe.');
      setAuthInfo('');
      return;
    }
    const nextUsers = [{ username, password, role: 'operator', createdAt: new Date().toISOString() }, ...authUsers];
    setAuthUsers(nextUsers);
    saveUsers(nextUsers);
    pushAuthLog('create-user', `${currentUser || 'system'} -> ${username}`);
    setAuthError('');
    setAuthInfo(`Usuario ${username} creado correctamente.`);
    setNewUserForm({ username: '', password: '' });
  }

  function handleRecoverPassword(event) {
    event.preventDefault();
    const username = recoverForm.username.trim();
    const next = recoverForm.next.trim();
    const confirm = recoverForm.confirm.trim();

    if (!username || !next || !confirm) {
      setAuthError('Completa usuario, nueva contraseña y confirmación.');
      setAuthInfo('');
      return;
    }
    if (next !== confirm) {
      setAuthError('La confirmación no coincide con la nueva contraseña.');
      setAuthInfo('');
      return;
    }

    const exists = authUsers.some((user) => user.username.toLowerCase() === username.toLowerCase());
    if (!exists) {
      setAuthError('No existe un usuario con ese nombre.');
      setAuthInfo('');
      return;
    }

    const nextUsers = authUsers.map((user) => (
      user.username.toLowerCase() === username.toLowerCase() ? { ...user, password: next } : user
    ));
    setAuthUsers(nextUsers);
    saveUsers(nextUsers);
    pushAuthLog('recover-password', username);
    setAuthError('');
    setAuthInfo(`Contraseña actualizada para ${username}.`);
    setRecoverForm({ username: '', next: '', confirm: '' });
  }

  function handlePasswordChange(event) {
    event.preventDefault();
    if (!currentUser) return;
    const current = passwordForm.current;
    const next = passwordForm.next.trim();
    if (!next) {
      setAuthError('La nueva contraseña no puede estar vacía.');
      setAuthInfo('');
      return;
    }
    const me = authUsers.find((user) => user.username === currentUser);
    if (!me || me.password !== current) {
      setAuthError('La contraseña actual no coincide.');
      setAuthInfo('');
      return;
    }
    const nextUsers = authUsers.map((user) => user.username === currentUser ? { ...user, password: next } : user);
    setAuthUsers(nextUsers);
    saveUsers(nextUsers);
    pushAuthLog('password-change', currentUser);
    setAuthError('');
    setAuthInfo('Contraseña actualizada correctamente.');
    setPasswordForm({ current: '', next: '' });
  }

  async function handleLocalExcelUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadError('');
      setUploadInfo('Subiendo archivo global...');
      const arrayBuffer = await file.arrayBuffer();
      const fileRef = storageRef(firebaseStorage, 'dashboard/latest.xlsx');
      await uploadBytes(fileRef, new Blob([arrayBuffer], { type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), {
        contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        cacheControl: 'no-cache',
        customMetadata: {
          uploadedBy: currentUser || 'unknown',
          uploadedAt: new Date().toISOString(),
        },
      });
      const payload = parseExcelToDashboardPayload(file.name, arrayBuffer);
      setData(payload);
      setSharedFileMeta({ name: file.name, updated: new Date().toISOString() });
      setDataSyncNote(`Fuente global actualizada por ${currentUser}: ${file.name}`);
      setUploadInfo(`Excel global actualizado (${formatInteger(payload.meta?.recordCounts?.tickets || 0)} tickets).`);
    } catch (uploadErr) {
      const code = uploadErr && typeof uploadErr === 'object' ? uploadErr.code : '';
      if (code === 'storage/unauthorized') {
        setUploadError('No hay permisos para escribir en Storage. Revisa las reglas de Firebase Storage.');
      } else {
        setUploadError(uploadErr instanceof Error ? uploadErr.message : 'No se pudo cargar el archivo Excel global.');
      }
      setUploadInfo('');
    } finally {
      event.target.value = '';
    }
  }

  function changeAuthMode(mode) {
    setAuthMode(mode);
    setAuthError('');
    setAuthInfo('');
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 20% 20%, #0b1a3a 0%, #050e27 55%, #020712 100%)', padding: 20 }}>
        <form onSubmit={handleLoginSubmit} style={{ width: 'min(520px, 100%)', background: 'rgba(8,20,48,.92)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 14, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,.45)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, display: 'grid', placeItems: 'center', fontWeight: 800, color: '#dbeafe', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>IN</div>
            <div>
              <div style={{ fontSize: '.72rem', color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>INRED</div>
              <h1 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.2rem' }}>Acceso al Dashboard Operacional</h1>
            </div>
          </div>
          <p style={{ marginTop: 0, color: '#94a3b8', fontSize: '.82rem' }}>Autenticación básica local para gestión interna.</p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button type="button" onClick={() => changeAuthMode('login')} style={authMode === 'login' ? authModeButtonActive : authModeButton}>Ingresar</button>
            <button type="button" onClick={() => changeAuthMode('register')} style={authMode === 'register' ? authModeButtonActive : authModeButton}>Crear usuario</button>
            <button type="button" onClick={() => changeAuthMode('recover')} style={authMode === 'recover' ? authModeButtonActive : authModeButton}>Recuperar contraseña</button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {authMode === 'login' && (
              <Fragment>
                <input type="text" placeholder="Usuario" value={loginForm.username} onChange={(e) => setLoginForm((v) => ({ ...v, username: e.target.value }))} style={authInputStyle} />
                <input type="password" placeholder="Contraseña" value={loginForm.password} onChange={(e) => setLoginForm((v) => ({ ...v, password: e.target.value }))} style={authInputStyle} />
                <button type="submit" style={authButtonStyle}>Ingresar</button>
              </Fragment>
            )}

            {authMode === 'register' && (
              <Fragment>
                <input type="text" placeholder="Usuario nuevo" value={newUserForm.username} onChange={(e) => setNewUserForm((v) => ({ ...v, username: e.target.value }))} style={authInputStyle} />
                <input type="password" placeholder="Contraseña inicial" value={newUserForm.password} onChange={(e) => setNewUserForm((v) => ({ ...v, password: e.target.value }))} style={authInputStyle} />
                <button type="button" onClick={handleCreateUser} style={authButtonStyle}>Crear usuario</button>
              </Fragment>
            )}

            {authMode === 'recover' && (
              <Fragment>
                <input type="text" placeholder="Usuario" value={recoverForm.username} onChange={(e) => setRecoverForm((v) => ({ ...v, username: e.target.value }))} style={authInputStyle} />
                <input type="password" placeholder="Nueva contraseña" value={recoverForm.next} onChange={(e) => setRecoverForm((v) => ({ ...v, next: e.target.value }))} style={authInputStyle} />
                <input type="password" placeholder="Confirmar nueva contraseña" value={recoverForm.confirm} onChange={(e) => setRecoverForm((v) => ({ ...v, confirm: e.target.value }))} style={authInputStyle} />
                <button type="button" onClick={handleRecoverPassword} style={authButtonStyle}>Actualizar contraseña</button>
              </Fragment>
            )}

            {authError && <div style={{ color: '#fca5a5', fontSize: '.78rem' }}>{authError}</div>}
            {authInfo && <div style={{ color: '#86efac', fontSize: '.78rem' }}>{authInfo}</div>}
          </div>
          <div style={{ marginTop: 14, fontSize: '.72rem', color: '#64748b' }}>Usuarios activos guardados: {authUsers.length}</div>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-shell">
        <div className="loading-shell__card">
          <small>Dashboard INRED</small>
          <h1>Cargando modelo analítico</h1>
          <p>Se está cargando la información de tickets y métricas de operación.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-shell">
        <div className="loading-shell__card loading-shell__card--error">
          <small>Error de inicialización</small>
          <h1>No se pudo cargar la aplicación</h1>
          <p>{error || 'No hay datos disponibles para construir el dashboard.'}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(160deg,#0b2f6b 0%, #0a3e93 45%, #0e5ac4 100%)', padding: 24 }}>
        <div style={{ width: 'min(760px, 100%)', borderRadius: 16, border: '1px solid rgba(191,219,254,.35)', background: 'rgba(6,24,57,.35)', boxShadow: '0 24px 60px rgba(2,6,23,.35)', padding: '28px 30px', color: '#dbeafe' }}>
          <div style={{ fontSize: '.74rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#bfdbfe', marginBottom: 8 }}>Dashboard INRED</div>
          <h1 style={{ margin: '0 0 10px', fontSize: '1.55rem', color: '#eff6ff' }}>Adjunta un Excel para comenzar</h1>
          <p style={{ margin: 0, fontSize: '.92rem', color: '#dbeafe', lineHeight: 1.55 }}>
            Este dashboard usa una fuente global compartida.
            Usa "Adjuntar Excel" en el panel de usuario para publicar el archivo para todos los usuarios.
          </p>
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="view-tab"
              style={{ fontSize: '.8rem', padding: '8px 14px' }}
              onClick={() => {
                uploadInputRef.current?.click();
              }}
            >
              Adjuntar Excel
            </button>
          </div>
          {uploadInfo && <div style={{ marginTop: 10, fontSize: '.75rem', color: '#86efac' }}>{uploadInfo}</div>}
          {uploadError && <div style={{ marginTop: 10, fontSize: '.75rem', color: '#fca5a5' }}>{uploadError}</div>}
          <input
            ref={uploadInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleLocalExcelUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    );
  }

  const hasNoData =
    !Array.isArray(data?.tickets) ||
    data.tickets.length === 0 ||
    data?.meta?.sourceFile === '(sin-archivo-drive)';

  if (hasNoData) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(160deg,#0b2f6b 0%, #0a3e93 45%, #0e5ac4 100%)', padding: 24 }}>
        <div style={{ width: 'min(760px, 100%)', borderRadius: 16, border: '1px solid rgba(191,219,254,.35)', background: 'rgba(6,24,57,.35)', boxShadow: '0 24px 60px rgba(2,6,23,.35)', padding: '28px 30px', color: '#dbeafe' }}>
          <div style={{ fontSize: '.74rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#bfdbfe', marginBottom: 8 }}>Dashboard INRED</div>
          <h1 style={{ margin: '0 0 10px', fontSize: '1.55rem', color: '#eff6ff' }}>Sin datos para cargar</h1>
          <p style={{ margin: 0, fontSize: '.92rem', color: '#dbeafe', lineHeight: 1.55 }}>
            No hay registros disponibles en el Excel cargado.
            Adjunta otro archivo para volver a alimentar el dashboard.
          </p>
          <div style={{ marginTop: 14, fontSize: '.78rem', color: '#bfdbfe' }}>
            Última generación: {formatDateTime(data?.meta?.generatedAt)}
          </div>
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="view-tab"
              style={{ fontSize: '.8rem', padding: '8px 14px' }}
              onClick={() => {
                uploadInputRef.current?.click();
              }}
            >
              Adjuntar Excel
            </button>
          </div>
          {uploadInfo && <div style={{ marginTop: 10, fontSize: '.75rem', color: '#86efac' }}>{uploadInfo}</div>}
          {uploadError && <div style={{ marginTop: 10, fontSize: '.75rem', color: '#fca5a5' }}>{uploadError}</div>}
          <input
            ref={uploadInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleLocalExcelUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ─────────────────────────────── */}
      <Sidebar
        view={view}
        onViewChange={setView}
        filters={filters}
        flags={flags}
        context={context}
        onFilterChange={updateFilter}
        onFlagChange={toggleFlag}
        onReset={resetAll}
      />

      {/* ── Main area ───────────────────────────── */}
      <div className="main-area">

        {/* ── Top header ──────────────────────────── */}
        <header className="top-header">
          <div className="top-header__left">
            <p className="top-header__meta">
              Generado {formatDateTime(data.meta?.generatedAt)} ·{' '}
              {formatInteger(baseTicketCount)} tickets base ·{' '}
              {formatInteger(baseStopEventCount)} eventos de parada ·{' '}
              Fuente: Excel global compartido
            </p>
          </div>
          <div className="top-header__right">
            <button
              type="button"
              className="view-tab"
              style={{ fontSize: '.72rem', padding: '6px 10px', marginRight: 6 }}
              onClick={() => uploadInputRef.current?.click()}
            >
              Adjuntar Excel
            </button>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,.05)', borderRadius: 6, padding: 2 }}>
              <button
                type="button"
                onClick={() => setVisibility('visible')}
                style={{ padding: '4px 12px', background: visibility === 'visible' ? 'rgba(59,130,246,.2)' : 'transparent', color: visibility === 'visible' ? '#93c5fd' : '#94a3b8', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', transition: 'all .2s' }}
              >Interventoría</button>
              <button
                type="button"
                onClick={() => setVisibility('internal')}
                style={{ padding: '4px 12px', background: visibility === 'internal' ? 'rgba(59,130,246,.2)' : 'transparent', color: visibility === 'internal' ? '#93c5fd' : '#94a3b8', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', transition: 'all .2s' }}
              >Interno (todo)</button>
            </div>
            <div className="header-search search-field__row" style={{ position: 'relative', width: 'min(480px, 100%)', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color .2s, box-shadow .2s' }}
              onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,.5)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,.12)'; }}
              onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; e.currentTarget.style.boxShadow = 'none'; setTimeout(() => { setShowSuggestions(false); setActiveSuggestion(-1); }, 120); }}
            >
              <Search size={14} color="#93c5fd" style={{ flexShrink: 0 }} />
              <input
                type="search"
                placeholder="Buscar… ej: Nariño abierto, #12345, -cerrado, energía|conectividad"
                value={textSearch}
                onChange={(e) => {
                  setTextSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleSearchKeyDown}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '.82rem' }}
                title="Soporta: múltiples palabras (AND), -palabra (excluir), palabra1|palabra2 (OR), #12345 (ID)"
              />
              {textSearch && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '.8rem', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#0f172a', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, boxShadow: '0 10px 25px rgba(0,0,0,.5)', zIndex: 100, overflow: 'hidden' }}>
                  {searchSuggestions.map((sug, idx) => (
                    <div 
                      key={idx} 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applySearchSuggestion(sug);
                      }}
                      onMouseEnter={() => setActiveSuggestion(idx)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '.82rem',
                        cursor: 'pointer',
                        borderBottom: idx < searchSuggestions.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none',
                        color: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        background: idx === activeSuggestion ? 'rgba(59,130,246,.18)' : 'transparent',
                      }}
                    >
                      <Search size={12} color="#64748b" style={{ flexShrink: 0, marginRight: 8 }} />
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`header-icon-btn${showNotifs ? ' is-active' : ''}`}
                onClick={() => { setShowNotifs((v) => !v); setShowUser(false); }}
                title="Alertas operativas"
              >
                <Bell size={16} />
              </button>
              {showNotifs && (() => {
                const recentOpen = context.tickets
                  .filter((t) => t.ticketState === 'Abierto')
                  .sort((a, b) => {
                    const da = new Date(b.ticketStart || b.referenceDate || 0).getTime();
                    const db = new Date(a.ticketStart || a.referenceDate || 0).getTime();
                    return da - db;
                  });
                const highPri = recentOpen.filter((t) => t.priority === 'Alta');
                const overAns = recentOpen.filter((t) => {
                  const { computeANS: _c } = { computeANS };
                  const ans = computeANS(t);
                  return ans.status === 'incumple';
                });
                return (
                  <div className="notif-panel">
                    <div className="notif-panel__head">
                      <strong>Alertas operativas</strong>
                      <span>{recentOpen.length} tickets abiertos</span>
                    </div>
                    {overAns.length > 0 && (
                      <div style={{ padding: '6px 12px 4px', fontSize: '.65rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        ⏱ Excedidos en tiempo ({overAns.length})
                      </div>
                    )}
                    {overAns.slice(0, 3).map((t) => (
                      <button
                        key={`over-${t.ticketId}`}
                        type="button"
                        className="notif-item"
                        onClick={() => { setSelectedTicketId(t.ticketId); setShowNotifs(false); }}
                      >
                        <AlertCircle size={11} color="#ef4444" />
                        <span>#{t.ticketId} · {t.department || 'Sin dato'}</span>
                        <strong style={{ color: '#ef4444' }}>ANS</strong>
                      </button>
                    ))}
                    {highPri.length > 0 && (
                      <div style={{ padding: '6px 12px 4px', fontSize: '.65rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        🔴 Alta prioridad abiertos ({highPri.length})
                      </div>
                    )}
                    {highPri.slice(0, 4).map((t) => (
                      <button
                        key={`hp-${t.ticketId}`}
                        type="button"
                        className="notif-item"
                        onClick={() => { setSelectedTicketId(t.ticketId); setShowNotifs(false); }}
                      >
                        <AlertTriangle size={11} color="#f59e0b" />
                        <span>#{t.ticketId} · {t.assignee || 'Sin asignar'}</span>
                        <strong style={{ color: '#f59e0b' }}>Alta</strong>
                      </button>
                    ))}
                    {recentOpen.length > 0 && (
                      <div style={{ padding: '6px 12px 4px', fontSize: '.65rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        🔓 Más recientes abiertos
                      </div>
                    )}
                    {recentOpen.slice(0, 3).map((t) => (
                      <button
                        key={`rec-${t.ticketId}`}
                        type="button"
                        className="notif-item"
                        onClick={() => { setSelectedTicketId(t.ticketId); setShowNotifs(false); }}
                      >
                        <Clock size={11} color="#3b82f6" />
                        <span>#{t.ticketId} · {t.municipality || t.department || 'Sin dato'}</span>
                        <strong style={{ color: '#64748b' }}>{t.priority || '—'}</strong>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="notif-panel__footer"
                      onClick={() => { openDrill('Todos los tickets abiertos', `${recentOpen.length} tickets`, recentOpen); setShowNotifs(false); }}
                    >
                      Ver todos los abiertos ({recentOpen.length})
                    </button>
                  </div>
                );
              })()}
            </div>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`header-avatar${showUser ? ' is-active' : ''}`}
                onClick={() => { setShowUser((v) => !v); setShowNotifs(false); }}
                title="Información del sistema"
              >
                <User size={16} />
              </button>
              {showUser && (
                <div className="user-panel">
                  <div className="user-panel__head">
                    <div className="user-panel__avatar"><User size={20} /></div>
                    <div>
                      <strong>{currentUser}</strong>
                      <span>INRED · sesión activa</span>
                    </div>
                  </div>
                  <div className="user-panel__stats">
                    <div><em>Tickets en vista</em><strong>{context.tickets.length}</strong></div>
                    <div><em>Con parada</em><strong>{context.tickets.filter((t) => (t.currentStopDays || 0) > 0).length}</strong></div>
                    <div><em>Alta prioridad</em><strong>{context.tickets.filter((t) => t.priority === 'Alta').length}</strong></div>
                  </div>
                  <div className="user-panel__meta">Generado {formatDateTime(data.meta?.generatedAt)}</div>
                  {dataSyncNote && (
                    <div style={{ marginTop: 8, fontSize: '.68rem', color: '#86efac' }}>{dataSyncNote}</div>
                  )}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', marginTop: 10, paddingTop: 10, display: 'grid', gap: 6 }}>
                    <div style={{ fontSize: '.68rem', color: '#93c5fd', fontWeight: 700 }}>Fuente de datos</div>
                    <div style={{ fontSize: '.68rem', color: '#cbd5e1' }}>
                      Modo actual: Excel global compartido
                      {sharedFileMeta?.updated ? ` · actualizado ${formatDateTime(sharedFileMeta.updated)}` : ''}
                    </div>
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleLocalExcelUpload}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="view-tab"
                        style={{ fontSize: '.7rem', flex: 1 }}
                        onClick={() => uploadInputRef.current?.click()}
                      >
                        Adjuntar Excel
                      </button>
                    </div>
                    {uploadInfo && <div style={{ fontSize: '.66rem', color: '#86efac' }}>{uploadInfo}</div>}
                    {uploadError && <div style={{ fontSize: '.66rem', color: '#fca5a5' }}>{uploadError}</div>}
                  </div>
                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                    <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: 6 }}>
                      <div style={{ fontSize: '.68rem', color: '#93c5fd', fontWeight: 700 }}>Cambiar contraseña</div>
                      <input type="password" placeholder="Actual" value={passwordForm.current} onChange={(e) => setPasswordForm((v) => ({ ...v, current: e.target.value }))} style={miniInputStyle} />
                      <input type="password" placeholder="Nueva" value={passwordForm.next} onChange={(e) => setPasswordForm((v) => ({ ...v, next: e.target.value }))} style={miniInputStyle} />
                      <button type="submit" className="view-tab" style={{ fontSize: '.7rem' }}>Actualizar contraseña</button>
                    </form>
                    <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: 6 }}>
                      <div style={{ fontSize: '.68rem', color: '#93c5fd', fontWeight: 700 }}>Crear usuario</div>
                      <input type="text" placeholder="Usuario nuevo" value={newUserForm.username} onChange={(e) => setNewUserForm((v) => ({ ...v, username: e.target.value }))} style={miniInputStyle} />
                      <input type="password" placeholder="Contraseña inicial" value={newUserForm.password} onChange={(e) => setNewUserForm((v) => ({ ...v, password: e.target.value }))} style={miniInputStyle} />
                      <button type="submit" className="view-tab" style={{ fontSize: '.7rem' }}>Crear usuario</button>
                    </form>
                    <div style={{ maxHeight: 96, overflow: 'auto', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: '.64rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Registro reciente</div>
                      {authLogs.slice(0, 8).map((log, idx) => (
                        <div key={`${log.at}-${idx}`} style={{ fontSize: '.68rem', color: '#94a3b8', marginBottom: 3 }}>
                          {formatDateTime(log.at)} · {log.action} · {log.username}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={handleLogout} style={{ background: 'rgba(239,68,68,.14)', border: '1px solid rgba(239,68,68,.36)', color: '#fca5a5', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '.72rem' }}>
                      Cerrar sesión
                    </button>
                    {authError && <div style={{ fontSize: '.7rem', color: '#fca5a5' }}>{authError}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ─────────────────────── */}
        <div key={view} className="content-wrapper">

          {/* Active filter chips */}
          {(context.activeFilterLabels.length > 0 || interactionScope) && (
            <div className="active-pills" style={{ marginBottom: 20 }}>
              {context.activeFilterLabels.map((lbl) => (
                <span key={lbl} className="active-pill">{lbl}</span>
              ))}
              {interactionScope && (
                <span className="active-pill" style={{ borderColor: 'rgba(56,189,248,.45)', color: '#7dd3fc' }}>
                  Selección interactiva: {interactionScope.label} ({interactionScope.ticketIds.length})
                </span>
              )}
              {interactionFeedback && (
                <span className="active-pill" style={{ borderColor: 'rgba(16,185,129,.45)', color: '#86efac' }}>
                  {interactionFeedback}
                </span>
              )}
              {interactionScope && (
                <button type="button" className="view-tab" style={{ marginLeft: 6 }} onClick={clearInteractiveScope}>Limpiar selección</button>
              )}
            </div>
          )}

          {/* View tabs */}
          <div className="view-tabs">
            {VIEW_OPTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`view-tab${view === item.key ? ' is-active' : ''}`}
                onClick={() => setView(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* KPI cards */}
          <div className="kpi-strip">
            {/* Primary KPIs — Tickets & Backlog */}
            <div className="kpi-main-row">
              {context.kpis.slice(0, 2).map((kpi, i) => {
                const def = KPI_ICONS[i];
                const Icon = def.icon;
                const drillFn = KPI_DRILL[i];
                return (
                  <article
                    key={kpi.label}
                    className="kpi-card kpi-card--clickable"
                    style={{ '--kpi-accent': i === 1 ? 'var(--warning)' : 'var(--brand)', '--card-i': i }}
                    onClick={() => { const { tickets: ts, subtitle } = drillFn(context); openDrill(kpi.label, subtitle, ts); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') { const { tickets: ts, subtitle } = drillFn(context); openDrill(kpi.label, subtitle, ts); } }}
                  >
                    <div className="kpi-card__top">
                      <div className="kpi-card__icon-ring" style={{ background: def.ring, '--ring-glow': def.ring }}>
                        <div className="kpi-card__icon" style={{ background: def.bg }}>
                          <Icon size={22} color="#fff" />
                        </div>
                      </div>
                      <div className="kpi-card__content">
                        <small>{kpi.label}</small>
                        <strong>{kpi.value}</strong>
                      </div>
                    </div>
                    <p>{kpi.meta}</p>
                    {i === 0 ? (
                      /* Departamento % breakdown — pequeño y simple */
                      (() => {
                        const total = context.tickets.length || 1;
                        const byDept = Object.entries(
                          context.tickets.reduce((acc, t) => {
                            const d = t.department || 'Sin dato';
                            acc[d] = (acc[d] || 0) + 1;
                            return acc;
                          }, {})
                        )
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 4);
                        return (
                          <div className="kpi-card__footer" style={{ flexWrap: 'wrap', gap: '6px 12px' }}>
                            {byDept.map(([dept, count]) => (
                              <span key={dept} style={{ minWidth: 0 }}>
                                <em style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={dept}>
                                  {dept.length > 12 ? dept.slice(0, 11) + '…' : dept}
                                </em>
                                <strong>{formatPercent(count / total)}</strong>
                              </span>
                            ))}
                          </div>
                        );
                      })()
                    ) : (() => {
                      /* Tickets Cerrados card: footer existente + abiertos por prioridad */
                      const PRIO_COLOR = { Alta: '#ef4444', Media: '#f59e0b', Baja: '#10b981' };
                      const openByPrio = context.tickets
                        .filter(t => t.ticketState === 'Abierto')
                        .reduce((acc, t) => {
                          const p = t.priority || 'Sin dato';
                          acc[p] = (acc[p] || 0) + 1;
                          return acc;
                        }, {});
                      const prioEntries = Object.entries(openByPrio).sort((a, b) => b[1] - a[1]);
                      return (
                        <>
                          {kpi.footer?.length > 0 && (
                            <div className="kpi-card__footer">
                              {kpi.footer.map((item) => (
                                <span key={item.label}>
                                  <em>{item.label}</em>
                                  <strong>{item.value}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                          {prioEntries.length > 0 && (
                            <div className="kpi-card__footer" style={{ marginTop: 6, borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 6 }}>
                              <em style={{ width: '100%', marginBottom: 2, fontSize: '.62rem', color: '#475569' }}>Abiertos por prioridad</em>
                              {prioEntries.map(([prio, count]) => (
                                <span key={prio}>
                                  <em style={{ color: PRIO_COLOR[prio] || '#94a3b8' }}>{prio}</em>
                                  <strong>{formatInteger(count)}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </article>
                );
              })}
            </div>
          </div>



          {view === 'general'     ? renderGeneral()     : null}
          {view === 'operators'   ? renderOperators()   : null}
          {view === 'maintenance' ? renderMaintenance() : null}
          {view === 'ans'         ? renderANS()         : null}
        </div>
      </div>

      <DetailDrawer ticket={selectedTicket} onClose={() => setSelectedTicketId('')} />
      <DrillPanel drill={drillDown} onTicketClick={handleDrillTicket} onClose={() => setDrillDown(null)} />
      <OperatorModal
        operator={selectedOperator}
        tickets={context.tickets}
        onClose={() => setSelectedOperator(null)}
      />
    </div>
  );

  function renderGeneral() {
    // ── Resumen rápido de tiempos de respuesta ─────────────────────────
    const ansSummary = buildANSContext(context.tickets, {});
    const { kpis: aKpis } = ansSummary;
    const aColor = aKpis.complianceRate >= 80 ? '#10b981' : aKpis.complianceRate >= 50 ? '#f59e0b' : '#ef4444';

    return (
      <Fragment>

        {/* ── Panel: ¿cómo vamos con los tiempos? ────────────── */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel__head">
            <div>
              <div className="panel__head-title">¿Cómo vamos con los tiempos de respuesta?</div>
              <div className="panel__head-sub">
                Cada ticket tiene un límite de <strong style={{ color: '#93c5fd' }}>{ANS_THRESHOLD_HOURS} horas netas</strong> para resolverse.
                "Netas" significa que si hubo una parada autorizada (clima, energía, orden público…), ese tiempo se descuenta.
              </div>
            </div>
            <button
              className="view-tab"
              style={{ fontSize: '.72rem', padding: '5px 14px', borderRadius: 6 }}
              onClick={() => setView('ans')}
            >
              Ver detalle completo →
            </button>
          </div>
          <div className="panel__body">
            {/* Fórmula explicada */}
            <div style={{
              background: 'rgba(59,130,246,.07)', border: '1px solid rgba(59,130,246,.18)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 14,
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
              fontSize: '.75rem', color: '#94a3b8',
            }}>
              <span>📐 <strong style={{ color: '#e2e8f0' }}>Fórmula:</strong></span>
              <span style={{ background: 'rgba(255,255,255,.06)', borderRadius: 5, padding: '3px 8px' }}>
                🕐 Tiempo bruto <span style={{ color: '#475569' }}>(inicio falla → cierre)</span>
              </span>
              <span style={{ color: '#475569' }}>−</span>
              <span style={{ background: 'rgba(245,158,11,.1)', borderRadius: 5, padding: '3px 8px', color: '#f59e0b' }}>
                ⏸ Paradas autorizadas
              </span>
              <span style={{ color: '#475569' }}>=</span>
              <span style={{ background: 'rgba(99,102,241,.12)', borderRadius: 5, padding: '3px 8px', color: '#818cf8' }}>
                ⚡ Tiempo real de trabajo
              </span>
              <span style={{ color: '#475569', marginLeft: 4 }}>
                · Si supera <strong style={{ color: '#ef4444' }}>{ANS_THRESHOLD_HOURS} h</strong> → fuera de límite
              </span>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10 }}>
              {[
                { label: 'Tickets revisados', value: formatInteger(aKpis.total), color: '#3b82f6', desc: 'Con datos suficientes para calcular' },
                { label: 'Dentro del límite', value: formatInteger(aKpis.cumple), color: '#10b981', desc: `Respondidos en ≤ ${ANS_THRESHOLD_HOURS} h netas` },
                { label: 'Fuera del límite', value: formatInteger(aKpis.incumple), color: '#ef4444', desc: `Superaron las ${ANS_THRESHOLD_HOURS} h netas` },
                { label: '% en tiempo', value: formatPercent(aKpis.complianceRate), color: aColor, desc: 'Meta ideal: ≥ 80%' },
                { label: 'Parada promedio', value: fmtHours(aKpis.avgStopHours), color: '#f59e0b', desc: 'Tiempo pausado autorizado por ticket' },
              ].map((k) => (
                <div key={k.label} style={{
                  background: 'rgba(15,23,42,.7)', border: `1px solid ${k.color}33`,
                  borderLeft: `3px solid ${k.color}`, borderRadius: 8, padding: '8px 12px',
                }}>
                  <div style={{ fontSize: '.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{k.label}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: k.color, lineHeight: 1.2 }}>{k.value}</div>
                  <div style={{ fontSize: '.6rem', color: '#475569', marginTop: 2 }}>{k.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="content-grid">
          <Panel title="Flujo mensual" subtitle="Tickets iniciados y cerrados sobre la ventana visible.">
            <div className="chart-card">
              <LineChart chart={context.general.trend} />
            </div>
          </Panel>

          <Panel title="Estado × prioridad" subtitle="Composición del portafolio visible por semáforo de prioridad.">
            <div className="chart-card">
              <StackedRows
                rows={context.general.statePriorityRows}
                onSegmentClick={({ rowLabel, segmentLabel }) => {
                  const ts = context.tickets.filter(
                    (t) => (t.ticketState || 'Sin dato') === rowLabel && (t.priority || 'Sin dato') === segmentLabel,
                  );
                  openDrill(`${rowLabel} · ${segmentLabel}`, `${ts.length} tickets`, ts);
                }}
              />
            </div>
          </Panel>

          <Panel title="Mantenimientos Activos" subtitle="Órdenes de trabajo de mantenimiento actualmente en curso.">
            <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
              <div style={{ fontSize: '.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Mantenimientos en progreso</div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#a855f7', lineHeight: 1 }}>{formatInteger(context.totals.maintenanceOpen)}</div>
              <button
                className="view-tab"
                style={{ marginTop: 20, fontSize: '.72rem', padding: '6px 16px', borderRadius: 6 }}
                onClick={() => setView('maintenance')}
              >
                Ver módulo de mantenimiento →
              </button>
            </div>
          </Panel>

          <Panel title="Carga por asignado" subtitle="Tickets abiertos por responsable en la selección.">
            <div className="chart-card">
              <BarList
                items={context.general.assigneeLoad}
                onItemClick={(item) =>
                  openDrill(
                    item.label,
                    `${item.value} tickets asignados`,
                    context.tickets.filter((t) => (t.assignee || 'Sin dato') === item.label),
                  )
                }
              />
            </div>
          </Panel>
        </section>

        <div style={{ marginTop: 14, marginBottom: 16 }}>
          <Panel
            title="Mapa territorial"
            subtitle="Distribución por departamento y municipio. Haz clic para aplicar filtro interactivo."
            footerNote="Clic en un departamento para ver municipios. Clic en volver para regresar al mapa general."
          >
            <GeoMap
              mode={activeGeoDepartment ? 'municipality' : 'department'}
              departments={context.general.departmentMapData || []}
              municipalities={context.general.municipalityMapData || []}
              activeDepartment={activeGeoDepartment}
              onDepartmentToggle={(label) => {
                const dept = label || '';
                setActiveGeoDepartment(dept);
                if (!dept) {
                  setInteractionFeedback('Vista geográfica restablecida a departamentos.');
                  return;
                }
                const scoped = context.tickets.filter((t) => (t.department || 'Sin dato') === dept);
                applyInteractiveScope(`Departamento ${dept}`, scoped);
              }}
            />
          </Panel>
        </div>

        {/* ── Temas identificados ─────────────────────────── */}
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <Panel
            title="Temas identificados"
            footerNote="Clasificación de tickets por tema · Haz clic en un segmento para ver los tickets correspondientes."
          >
            <Pie3D
              items={context.text.topics}
              onSliceClick={(s) => {
                const ts = context.tickets.filter(
                  (t) => (t.textAnalytics?.primaryTopic || 'Sin clasificar') === s.label,
                );
                openDrill(`Tema: ${s.label}`, `${ts.length} tickets con este tema`, ts);
              }}
            />
          </Panel>
        </div>

        <DataTable
          title="Tickets priorizados"
          subtitle="Se priorizan abiertos, luego mayor impacto de parada y más reciente inicio del ticket."
          filePrefix="tickets_general"
          rows={context.general.rows}
          onRowClick={(row) => setSelectedTicketId(row.ticketId)}
          columns={ticketColumns({ includeComments: false })}
        />

        <div className="panel" style={{ marginTop: 20 }}>
          <div className="panel__head">
            <div>
              <div className="panel__head-title">{context.filterHeadline}</div>
              <div className="panel__head-sub">{context.filterSummary}</div>
            </div>
          </div>
          <div className="panel__body">
            <div className="summary-facts">
              {context.quickFacts.map((item) => (
                <article key={item.label} className="fact-card">
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                  <span>{item.meta}</span>
                </article>
              ))}
            </div>
            {context.notes.length > 0 && (
              <ul className="notes-list" style={{ marginTop: 16 }}>
                {context.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            )}
          </div>
        </div>
      </Fragment>
    );
  }

  function renderOperators() {
    const ops = context.operators;
    const formatHour = (hour) => `${String(hour).padStart(2, '0')}:00`;
    const formatDelta = (value) => {
      if (Math.abs(value) < 0.5) return 'en línea con el promedio';
      return value > 0
        ? `${formatInteger(Math.round(value))} por encima del promedio`
        : `${formatInteger(Math.abs(Math.round(value)))} por debajo del promedio`;
    };

    const maxTotal = Math.max(...ops.map((o) => o.totalTouched), 1);
    const avgActivity = ops.length ? Math.round(ops.reduce((s, o) => s + o.totalTouched, 0) / ops.length) : 0;

    return (
      <Fragment>
        {/* ── Resumen General de Operadores ──────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 16 }}>
          <div style={{ background: 'rgba(15,23,42,.9)', border: '1px solid rgba(59,130,246,.2)', borderLeft: '3px solid #3b82f6', borderRadius: 8, padding: '12px' }}>
            <div style={{ fontSize: '.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Promedio de Actividad</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#93c5fd' }}>{formatInteger(avgActivity)} <span style={{ fontSize: '.7rem', color: '#475569', fontWeight: 400 }}>tickets/operador</span></div>
          </div>
          <div style={{ background: 'rgba(15,23,42,.9)', border: '1px solid rgba(16,185,129,.2)', borderLeft: '3px solid #10b981', borderRadius: 8, padding: '12px' }}>
            <div style={{ fontSize: '.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Operadores Activos</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6ee7b7' }}>{ops.length}</div>
          </div>
        </div>

        <div className="operator-grid">
          {ops.map((op) => {
            const barWidth  = Math.round((op.totalTouched / maxTotal) * 100);
            const idSet = new Set(op.touchedIds);
            const drillTickets = () => context.tickets.filter((t) => idSet.has(t.ticketId));

            const handleCardClick = () => {
              setSelectedOperator(op);
            };

            const recentHours = Array.isArray(op.recentHours) && op.recentHours.length === 24 ? op.recentHours : op.hourly;
            const recentPeak = Math.max(...recentHours, 1);
            const hourlyPeak = Math.max(...op.hourly, 1);
            const peakHourLabel = op.peakHour ? `${String(op.peakHour.hour).padStart(2, '0')}:00` : 'Sin dato';

            return (
              <article
                key={op.name}
                className="op-card"
                onClick={handleCardClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
                aria-label={`Ver tickets de ${op.name}`}
              >
                {/* ── Header ───────────────────────────────────── */}
                <div className="op-card__header">
                  <div className="op-card__avatar">
                    <User size={18} color="#fff" />
                  </div>
                  <div className="op-card__title">
                    <strong>{op.name}</strong>
                    {op.lastActivity && <span className="op-card__last">último movimiento {op.lastActivity}</span>}
                  </div>
                  <button
                    type="button"
                    className="op-card__filter-btn"
                    title="Filtrar todo el dashboard por este operador"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateFilter('assignee', filters.assignee === op.name ? '' : op.name);
                    }}
                    style={filters.assignee === op.name ? { background: 'rgba(59,130,246,.28)', borderColor: '#3b82f6', color: '#93c5fd' } : {}}
                  >
                    {filters.assignee === op.name ? '✓ Filtrado' : 'Filtrar'}
                  </button>
                </div>

                {/* ── Volume bar ───────────────────────────────── */}
                <div className="op-card__bar-track">
                  <div className="op-card__bar-fill" style={{ width: `${barWidth}%` }} />
                </div>

                {/* ── Main metric + role breakdown ─────────────── */}
                <div className="op-card__participation">
                  <div className="op-card__participation-total">
                    <span>{op.totalTouched}</span>
                    <small>tickets participados</small>
                  </div>
                  <div className="op-card__roles">
                    <div className="op-card__role op-card__role--assigned" title="Tickets asignados al operador">
                      <span>{op.assigned}</span><small>asignados</small>
                    </div>
                    <div className="op-card__role op-card__role--created" title="Tickets creados por el operador">
                      <span>{op.created}</span><small>creados</small>
                    </div>
                    <div className="op-card__role op-card__role--closed" title="Tickets cerrados por el operador">
                      <span>{op.closed}</span><small>cerrados</small>
                    </div>
                  </div>
                </div>

                {/* ── Secondary stats ──────────────────────────── */}
                <div className="op-card__kpis">
                  <div className="op-card__kpi op-card__kpi--open" title="Tickets abiertos asignados">
                    <span>{op.open}</span><small><AlertCircle size={11} />Abiertos</small>
                  </div>
                  <div className="op-card__kpi op-card__kpi--high" title="Tickets de alta prioridad asignados">
                    <span>{op.highPri}</span><small><AlertTriangle size={11} />Alta prioridad</small>
                  </div>
                  <div className="op-card__kpi op-card__kpi--followup" title="Comentarios de seguimiento en sus tickets">
                    <span>{op.followUpCount}</span><small><Bell size={11} />Seguimientos</small>
                  </div>
                  <div className="op-card__kpi" title="Total comentarios en sus tickets">
                    <span>{op.commentCount}</span><small><Zap size={11} />Comentarios</small>
                  </div>
                </div>

                {/* ── Actividad últimas 24 h ─────────────────────── */}
                <div className="op-card__spark-label">Actividad · últimas 24 h</div>
                <div className="op-card__spark">
                  {recentHours.map((count, hr) => (
                    <span
                      key={hr}
                      className="op-card__spark-bar"
                      title={`${String(hr).padStart(2, '0')}:00 · ${count} interacciones`}
                      style={{ height: `${count ? Math.max(Math.round((count / recentPeak) * 100), 8) : 3}%` }}
                    />
                  ))}
                </div>

                {/* ── Pico de interacción ────────────────────────── */}
                <div className="op-card__spark-label" style={{ marginTop: 8 }}>
                  Pico de interacción: {peakHourLabel}
                </div>
                <div className="op-card__spark" style={{ height: 24 }}>
                  {op.hourly.map((count, hr) => (
                    <span
                      key={hr}
                      className="op-card__spark-bar"
                      title={`${hr}:00 - ${count} actividades`}
                      style={{ 
                        height: `${count ? Math.max(Math.round((count / hourlyPeak) * 100), 8) : 3}%`,
                        background: count > 0 ? '#10b981' : 'rgba(255,255,255,.05)' 
                      }}
                    />
                  ))}
                </div>
                <div className="op-card__spark-foot">
                  {formatInteger(op.peakHour?.count || 0)} interacciones en la hora pico
                </div>

                {/* ── Bottom pills ────────────────────────────────── */}
                <div className="op-card__detail">
                  {op.avgMttr > 0 && (
                    <span className="op-card__pill" title="Tiempo promedio de resolución">Resuelve en {formatDays(op.avgMttr)}</span>
                  )}
                  {op.avgStopDays > 0 && (
                    <span className="op-card__pill op-card__pill--warn" title="Parada promedio en sus tickets">Parada {formatDays(op.avgStopDays)}</span>
                  )}
                  {op.topProject && (
                    <span className="op-card__pill op-card__pill--proj" title={op.topProject}>
                      {op.topProject.length > 24 ? op.topProject.slice(0, 24) + '…' : op.topProject}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <DataTable
          title="Detalle de actividad por operador"
          subtitle="Participación total por rol: asignado, creó, cerró, responsable. Clic en una fila para ver sus tickets."
          filePrefix="operadores"
          rows={context.operators}
          columns={operatorColumns}
          exportMeta={{ type: 'operators', tickets: context.tickets }}
          onRowClick={(row) => {
            setSelectedOperator(row);
          }}
        />

        <DataTable
          title="Ranking operativo por asignado"
          subtitle="Controla volumen, pendientes, tiempos y el proyecto más frecuente por responsable."
          filePrefix="ranking_operativo"
          rows={context.operations.rows}
          columns={operationsColumns}
        />
      </Fragment>
    );
  }

  function renderMaintenance() {
    const mnt = buildMaintenanceContext(context.tickets, mntSearch);
    const { kpis } = mnt;
    const scopeMaintenance = (label, predicate) => {
      const ts = context.tickets.filter((ticket) => ticket.maintenanceId).filter(predicate);
      applyInteractiveScope(`Mantenimiento · ${label}`, ts);
    };

    return (
      <Fragment>
        {/* ── Cabecera / buscador ─────────────────────────────── */}
        <div className="text-toolbar panel">
          <div>
            <small>Órdenes de trabajo</small>
            <h2>Seguimiento de mantenimiento</h2>
            <p>
              {kpis.total} actividades de mantenimiento en la vista actual ·{' '}
              {kpis.techs} técnico{kpis.techs !== 1 ? 's' : ''} involucrado{kpis.techs !== 1 ? 's' : ''}
            </p>
          </div>
          <label className="search-field">
            <span>Buscar por OT, ticket, técnico, zona o estado</span>
            <div className="search-field__row">
              <Search size={16} color="#93c5fd" />
              <input
                type="search"
                value={mntSearch}
                onChange={(e) => setMntSearch(e.target.value)}
                placeholder="Ej. 12345, Juan García, Nariño…"
              />
            </div>
          </label>
        </div>

        {/* ── KPI strip ───────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, margin: '14px 0' }}>
          {[
            { label: 'Total OTs', value: formatInteger(kpis.total), color: '#3b82f6' },
            { label: 'Completadas', value: formatInteger(kpis.done), color: '#10b981' },
            { label: 'Pendientes', value: formatInteger(kpis.open), color: '#f59e0b' },
            { label: '% completado', value: formatPercent(kpis.completionRate), color: '#a855f7' },
            { label: 'Técnicos', value: formatInteger(kpis.techs), color: '#6366f1' },
          ].map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => {
                if (k.label === 'Completadas') scopeMaintenance(k.label, (t) => !!t.maintenanceEnd);
                else if (k.label === 'Pendientes') scopeMaintenance(k.label, (t) => !t.maintenanceEnd);
                else if (k.label === 'Técnicos') scopeMaintenance(k.label, (t) => !!t.technician);
                else scopeMaintenance(k.label, () => true);
              }}
              style={{ background: 'rgba(15,23,42,.9)', border: `1px solid ${k.color}33`, borderLeft: `3px solid ${k.color}`, borderRadius: 8, padding: '10px 14px', textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '.62rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{k.label}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: k.color, lineHeight: 1.1 }}>{k.value}</div>
            </button>
          ))}
        </div>

        {/* ── Estado + técnicos ───────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="panel">
            <div className="panel__head"><div className="panel__head-title">Estado de las órdenes</div></div>
            <div className="panel__body" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {mnt.byState.map((s) => {
                const color = MNT_STATE_COLOR[s.label] || '#64748b';
                return (
                  <button key={s.label} type="button" onClick={() => scopeMaintenance(`Estado ${s.label}`, (t) => (t.maintenanceState || 'Sin estado') === s.label)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 20, padding: '4px 10px', fontSize: '.75rem', cursor: 'pointer' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ color: '#cbd5e1' }}>{s.label}</span>
                    <strong style={{ color }}>{formatInteger(s.value)}</strong>
                    <span style={{ color: '#475569' }}>({formatPercent(s.share)})</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="panel">
            <div className="panel__head"><div className="panel__head-title">Carga por técnico</div></div>
            <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mnt.byTech.slice(0, 6).map((t) => {
                const pct = kpis.total ? (t.total / kpis.total) * 100 : 0;
                return (
                  <button key={t.name} type="button" onClick={() => scopeMaintenance(`Técnico ${t.name}`, (x) => (x.technician || 'Sin técnico') === t.name)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', padding: 0, width: '100%', cursor: 'pointer' }}>
                    <span style={{ minWidth: 110, fontSize: '.72rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.name}>{t.name}</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#6366f1', borderRadius: 3, transition: 'width .3s' }} />
                    </div>
                    <span style={{ minWidth: 28, fontSize: '.7rem', color: '#93c5fd', fontWeight: 700, textAlign: 'right' }}>{t.total}</span>
                    {t.avgDays != null && <span style={{ minWidth: 44, fontSize: '.65rem', color: '#64748b' }}>{formatDays(t.avgDays)} prom.</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tabla de OTs ────────────────────────────────────── */}
        <div className="panel">
          <div className="panel__head">
            <div>
              <div className="panel__head-title">
                {mntSearch ? `${formatInteger(mnt.totalFiltered)} resultados para "${mntSearch}"` : `${formatInteger(kpis.total)} órdenes de trabajo`}
              </div>
              <div className="panel__head-sub">Pendientes primero · Haz clic en una fila para ver el ticket completo</div>
            </div>
            <div className="table-card__actions">
              <button
                type="button"
                className="table-card__action-btn"
                onClick={() => {
                  const mntCols = [
                    { label: 'OT #', get: r => r.maintenanceId, t: 'txt' },
                    { label: 'Ticket #', get: r => r.ticketId, t: 'txt' },
                    { label: 'Estado', get: r => r.state, t: 'txt' },
                    { label: 'Técnico', get: r => r.technician, t: 'txt' },
                    { label: 'Departamento', get: r => r.department || '', t: 'txt' },
                    { label: 'Municipio', get: r => r.municipality || '', t: 'txt' },
                    { label: 'Inicio', get: r => formatDate(r.start), t: 'txt' },
                    { label: 'Fin', get: r => formatDate(r.end), t: 'txt' },
                    { label: 'Duración (Días)', get: r => r.durationDays, t: 'n' },
                    { label: 'Prioridad', get: r => r.ticketPriority, t: 'txt' }
                  ];
                  exportTableExcel('mantenimientos', mntCols, mnt.rows, { title: 'Mantenimientos', subtitle: mntSearch ? `Filtro: ${mntSearch}` : 'Todos los mantenimientos' });
                }}
              >
                Excel
              </button>
            </div>
          </div>
          <div className="panel__body" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  {['OT #', 'Ticket #', 'Estado', 'Técnico', 'Zona', 'Inicio', 'Duración', 'Prioridad'].map((h) => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '.67rem', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mnt.rows.slice(0, 100).map((r) => {
                  const stateColor = MNT_STATE_COLOR[r.state] || '#64748b';
                  const prioDot = PRIO_DOT[r.ticketPriority] || '#64748b';
                  return (
                    <tr
                      key={`${r.maintenanceId}-${r.ticketId}`}
                      style={{ borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer' }}
                      onClick={() => setSelectedTicketId(r.ticketId)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '7px 10px', color: '#93c5fd', fontWeight: 700, whiteSpace: 'nowrap' }}>{r.maintenanceId}</td>
                      <td style={{ padding: '7px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>#{r.ticketId}</td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${stateColor}18`, border: `1px solid ${stateColor}44`, borderRadius: 12, padding: '2px 8px', color: stateColor, fontSize: '.68rem', fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: stateColor }} />
                          {r.state}
                        </span>
                      </td>
                      <td style={{ padding: '7px 10px', color: '#e2e8f0', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.technician}>{r.technician}</td>
                      <td style={{ padding: '7px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.department}{r.municipality && r.municipality !== r.department ? ` · ${r.municipality}` : ''}</td>
                      <td style={{ padding: '7px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.start ? formatDate(r.start) : '—'}</td>
                      <td style={{ padding: '7px 10px', color: r.end ? '#94a3b8' : '#f59e0b', whiteSpace: 'nowrap' }}>
                        {r.durationDays != null ? formatDays(r.durationDays) : (r.end ? '—' : 'En curso')}
                      </td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: prioDot, fontSize: '.68rem', fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: prioDot }} />
                          {r.ticketPriority}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {mnt.rows.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '24px 10px', textAlign: 'center', color: '#475569' }}>Sin resultados para la búsqueda actual.</td></tr>
                )}
              </tbody>
            </table>
            {mnt.rows.length > 100 && (
              <p style={{ padding: '8px 10px', fontSize: '.7rem', color: '#475569', margin: 0 }}>
                Mostrando 100 de {formatInteger(mnt.rows.length)} · Refina la búsqueda para ver más.
              </p>
            )}
          </div>
        </div>
      </Fragment>
    );
  }

  function renderANS() {
    const ans = buildANSContext(context.tickets, ansFilter);
    const { kpis, byDept, byOperator, rows, filterOptions } = ans;
    const complianceColor = kpis.complianceRate >= 80 ? '#10b981' : kpis.complianceRate >= 50 ? '#f59e0b' : '#ef4444';

    // Indicador 2: Disponibilidad por Red de Acceso — contexto extendido JDI
    let dynamicPeriod = 720;
    if (filters.dateFrom && filters.dateTo) {
      const d1 = new Date(`${filters.dateFrom}T00:00:00`);
      const d2 = new Date(`${filters.dateTo}T00:00:00`);
      if (!isNaN(d1) && !isNaN(d2) && d2 >= d1) {
        dynamicPeriod = Math.max(24, Math.round((d2 - d1) / 3600000) + 24);
      }
    } else {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      dynamicPeriod = daysInMonth * 24;
    }
    const availCtx = buildJDIAvailabilityContext(context.tickets, jdiFilter, dynamicPeriod);
    const { filteredJuntas, juntas, kpis: avKpis, dist, topOffenders, juntaOptions } = availCtx;
    const avgAvailColor = avKpis.avgAvailability >= AVAILABILITY_MIN_PCT ? '#10b981' : avKpis.avgAvailability >= 90 ? '#f59e0b' : '#ef4444';

    // ── Donut chart helpers ───────────────────────────────────────────────
    const donutR = 46;
    const donutCirc = 2 * Math.PI * donutR;
    const donutPct = avKpis.total > 0 ? (avKpis.cumple / avKpis.total) * 100 : 0;
    const donutDash = (donutPct / 100) * donutCirc;
    const donutColor = donutPct >= 90 ? '#10b981' : donutPct >= 70 ? '#f59e0b' : '#ef4444';

    // ── Bar chart max ─────────────────────────────────────────────────────
    const maxDowntime = topOffenders.length > 0 ? topOffenders[0].totalDowntimeHours : 1;
    const applyAnsScope = (label, predicate) => {
      const scoped = rows.filter(predicate).map((row) => ({ ticketId: row.ticketId }));
      applyInteractiveScope(`ANS · ${label}`, scoped);
    };
    const applyJdiScope = (label, juntasSelection) => {
      const safeSelection = Array.isArray(juntasSelection) ? juntasSelection : [];
      const ids = safeSelection.flatMap((junta) => (junta.imputables || []).map((item) => ({ ticketId: item.ticketId })));
      applyInteractiveScope(`JDI · ${label}`, ids);
    };
    const stopIntervalsByTicket = context.stopEvents.reduce((acc, event) => {
      const key = String(event.ticketId || '');
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});
    Object.keys(stopIntervalsByTicket).forEach((key) => {
      stopIntervalsByTicket[key].sort((a, b) => new Date(a.stopStart || 0).getTime() - new Date(b.stopStart || 0).getTime());
    });

    return (
      <Fragment>
        {/* ── Cabecera ────────────────────────────────────────── */}
        <div className="text-toolbar panel">
          <div>
            <small>Metodología GP-D-JDI-023 · Anexo 11 — Indicadores de Calidad de Servicio</small>
            <h2>ANS – Indicadores de Calidad de Servicio</h2>
            <p>
              Seguimiento de los dos indicadores técnicos contractuales: disponibilidad por red de acceso (≥ 98 %)
              y velocidad efectiva mínima de navegación. Se incluye además el detalle de tiempos de respuesta por ticket.
            </p>
          </div>
        </div>

        {/* ── Banner de alcance metodológico ──────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 18,
        }}>
          {/* JDI — metodología oficial */}
          <div style={{
            background: 'rgba(16,185,129,.07)',
            border: '1px solid rgba(16,185,129,.35)',
            borderLeft: '4px solid #10b981',
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>✅</span>
              <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Juntas de Internet (JDI)
              </span>
              <span style={{ background: 'rgba(16,185,129,.18)', border: '1px solid rgba(16,185,129,.35)', borderRadius: 10, padding: '1px 8px', fontSize: '.62rem', color: '#6ee7b7', fontWeight: 700 }}>
                Metodología oficial
              </span>
            </div>
            <div style={{ fontSize: '.72rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Los indicadores <strong style={{ color: '#e2e8f0' }}>Disponibilidad ≥ 98 %</strong> y{' '}
              <strong style={{ color: '#e2e8f0' }}>Velocidad Efectiva Mínima</strong> se calculan
              conforme al documento <strong style={{ color: '#34d399' }}>GP-D-JDI-023 · Anexo 11</strong>{' '}
              (Contrato 001/2025 · Red de Ingeniería S.A.S). Las fórmulas, umbrales, categorías de
              tickets imputables y exclusiones que se muestran en esta vista corresponden exactamente
              a esa metodología.
            </div>
          </div>

          {/* Otros proyectos — metodología similar */}
          <div style={{
            background: 'rgba(245,158,11,.07)',
            border: '1px solid rgba(245,158,11,.35)',
            borderLeft: '4px solid #f59e0b',
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Otros proyectos
              </span>
              <span style={{ background: 'rgba(245,158,11,.18)', border: '1px solid rgba(245,158,11,.35)', borderRadius: 10, padding: '1px 8px', fontSize: '.62rem', color: '#fde68a', fontWeight: 700 }}>
                Metodología similar
              </span>
            </div>
            <div style={{ fontSize: '.72rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Para los demás proyectos gestionados por INRED, la lógica de cálculo es{' '}
              <strong style={{ color: '#e2e8f0' }}>similar en estructura</strong> (fórmula de
              disponibilidad, muestra de velocidad, categorización de tickets), pero los{' '}
              <strong style={{ color: '#fbbf24' }}>umbrales contractuales, categorías imputables
              y períodos de medición pueden diferir</strong> según el contrato específico de cada
              proyecto. Consulte el documento metodológico de cada proyecto antes de interpretar
              estos valores para proyectos distintos a JDI.
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            INDICADOR 2 · Disponibilidad por Red de Acceso
            Fórmula: [(720h − T.Indisponibilidad) / 720h] × 100 ≥ 98 %
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 16 }}>
          {/* Encabezado del indicador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.35)', borderRadius: 6, padding: '3px 10px', fontSize: '.7rem', fontWeight: 700, color: '#818cf8', letterSpacing: '.05em' }}>INDICADOR 2</span>
            <span style={{ fontSize: '.92rem', fontWeight: 700, color: '#e2e8f0' }}>Disponibilidad por Red de Acceso</span>
            <span style={{ fontSize: '.7rem', color: '#64748b' }}>Meta: ≥ {AVAILABILITY_MIN_PCT} %</span>
          </div>

          {/* Fórmula */}
          <div style={{ background: 'rgba(15,23,42,.85)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 10, fontSize: '.75rem', color: '#94a3b8' }}>
            <strong style={{ color: '#93c5fd' }}>Fórmula: </strong>
            Disponibilidad (%) = [ ({AVAILABILITY_PERIOD_HOURS} h − Tiempo de indisponibilidad) / {AVAILABILITY_PERIOD_HOURS} h ] × 100
            <span style={{ marginLeft: 16, color: '#64748b' }}>
              · Solo tickets: Responsable = Inred · Prioridad = Alta · Categoría imputable
            </span>
          </div>

          {/* Categorías imputables */}
          <div style={{ background: 'rgba(15,23,42,.85)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 10 }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#fca5a5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Categorías imputables (Alta + Inred)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {IMPUTABLE_CATEGORIES.filter((c) => !c.startsWith('Fallla')).map((cat) => (
                <span key={cat} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 12, padding: '2px 10px', fontSize: '.68rem', color: '#fca5a5' }}>{cat}</span>
              ))}
            </div>
          </div>

          {/* ── Gráficas JDI: Donut + Top Ofensores + Distribución ─────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 200px', gap: 12, marginBottom: 12 }}>

            {/* Donut gauge — % juntas en cumplimiento */}
            <div
              style={{ background: 'rgba(15,23,42,.9)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 10, padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onClick={() => applyJdiScope('Cumplimiento global', juntas)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  applyJdiScope('Cumplimiento global', juntas);
                }
              }}
            >
              <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'center' }}>Cumplimiento global</div>
              <svg width="112" height="112" viewBox="0 0 120 120" style={{ overflow: 'visible' }}>
                {/* Track */}
                <circle cx="60" cy="60" r={donutR} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="11"/>
                {/* Fill */}
                <circle
                  cx="60" cy="60" r={donutR}
                  fill="none" stroke={donutColor} strokeWidth="11"
                  strokeDasharray={`${donutDash} ${donutCirc}`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dasharray .5s ease' }}
                />
                <text x="60" y="55" textAnchor="middle" fill={donutColor} fontSize="17" fontWeight="800" fontFamily="inherit">{donutPct.toFixed(0)}%</text>
                <text x="60" y="68" textAnchor="middle" fill="#64748b" fontSize="7.5" fontFamily="inherit">cumplen ≥ 98 %</text>
                <text x="60" y="79" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="inherit">{avKpis.cumple} / {avKpis.total} juntas</text>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                {[
                  { label: '✓ Cumplen',   value: avKpis.cumple,   color: '#10b981' },
                  { label: '✗ No cumplen', value: avKpis.incumple, color: '#ef4444' },
                ].map((r) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem' }}>
                    <span style={{ color: r.color }}>{r.label}</span>
                    <span style={{ fontWeight: 700, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top ofensores — bar chart horizontal */}
            <div style={{ background: 'rgba(15,23,42,.9)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 10, padding: '14px' }}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                Juntas con más horas de caída
                {topOffenders.length === 0 && <span style={{ marginLeft: 8, color: '#10b981' }}>· Sin caídas registradas</span>}
              </div>
              {topOffenders.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, color: '#10b981', fontSize: '.8rem' }}>
                  🎉 Todas las juntas sin tiempo de caída imputable
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {topOffenders.map((j, i) => {
                    const pct = maxDowntime > 0 ? (j.totalDowntimeHours / maxDowntime) * 100 : 0;
                    const barColor = j.cumple ? '#f59e0b' : '#ef4444';
                    return (
                      <button key={j.junta} type="button" onClick={() => applyJdiScope(`Junta ${j.junta}`, [j])} style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', marginBottom: 3 }}>
                          <span style={{ color: '#cbd5e1', fontWeight: i === 0 ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '72%' }} title={j.junta}>
                            {i === 0 ? '⚠ ' : ''}{j.junta}
                          </span>
                          <span style={{ color: barColor, fontWeight: 700, whiteSpace: 'nowrap' }}>{j.totalDowntimeHours.toFixed(1)} h</span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,.05)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width .4s ease' }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Distribución de disponibilidad */}
            <div style={{ background: 'rgba(15,23,42,.9)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 10, padding: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>Distribución</div>
              {[
                { label: '100 %',        count: dist.perfect, color: '#10b981', bg: 'rgba(16,185,129,.12)' },
                { label: '99 – 99.9 %',  count: dist.high,    color: '#6ee7b7', bg: 'rgba(110,231,183,.08)' },
                { label: '98 – 98.9 %',  count: dist.mid,     color: '#f59e0b', bg: 'rgba(245,158,11,.1)'  },
                { label: '< 98 % ✗',    count: dist.below,   color: '#ef4444', bg: 'rgba(239,68,68,.1)'   },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => {
                    if (b.label === '100 %') applyJdiScope(b.label, juntas.filter((j) => j.availability >= 100));
                    else if (b.label === '99 – 99.9 %') applyJdiScope(b.label, juntas.filter((j) => j.availability >= 99 && j.availability < 100));
                    else if (b.label === '98 – 98.9 %') applyJdiScope(b.label, juntas.filter((j) => j.availability >= 98 && j.availability < 99));
                    else applyJdiScope(b.label, juntas.filter((j) => j.availability < 98));
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: b.bg, borderRadius: 6, padding: '6px 10px', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: b.color, minWidth: 24, textAlign: 'center' }}>{b.count}</span>
                  <span style={{ fontSize: '.67rem', color: '#94a3b8' }}>{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Filtro inteligente JDI ──────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 10, padding: '10px 14px', background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.2)', borderRadius: 8 }}>
            <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '.05em', alignSelf: 'center' }}>🔍 Filtrar juntas:</div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 200 }}>
              <span style={{ fontSize: '.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Junta / Centro Poblado</span>
              <select
                value={jdiFilter.junta}
                onChange={(e) => setJdiFilter((f) => ({ ...f, junta: e.target.value }))}
                style={{ background: 'rgba(15,23,42,.95)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '5px 8px', color: '#e2e8f0', fontSize: '.78rem' }}
              >
                <option value="">Todas las juntas</option>
                {juntaOptions.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: '.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Estado ANS</span>
              <div style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)' }}>
                {[['', 'Todas'], ['cumple', '✓ Cumplen'], ['incumple', '✗ No cumplen']].map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => setJdiFilter((f) => ({ ...f, status: val }))}
                    style={{
                      padding: '5px 11px',
                      fontSize: '.72rem',
                      fontWeight: jdiFilter.status === val ? 700 : 400,
                      background: jdiFilter.status === val
                        ? (val === 'cumple' ? 'rgba(16,185,129,.22)' : val === 'incumple' ? 'rgba(239,68,68,.22)' : 'rgba(99,102,241,.22)')
                        : 'rgba(15,23,42,.8)',
                      color: jdiFilter.status === val
                        ? (val === 'cumple' ? '#34d399' : val === 'incumple' ? '#f87171' : '#93c5fd')
                        : '#475569',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background .2s',
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            {(jdiFilter.junta || jdiFilter.status) && (
              <button
                onClick={() => setJdiFilter({ junta: '', status: '' })}
                style={{ alignSelf: 'flex-end', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.35)', borderRadius: 6, padding: '5px 12px', color: '#f87171', fontSize: '.72rem', cursor: 'pointer' }}
              >
                Limpiar
              </button>
            )}
            {filteredJuntas.length !== juntas.length && (
              <span style={{ alignSelf: 'flex-end', fontSize: '.68rem', color: '#64748b', marginLeft: 'auto' }}>
                Mostrando {filteredJuntas.length} de {juntas.length} juntas
              </span>
            )}
          </div>

          {/* KPI resumen disponibilidad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 10 }}>
            {[
              { label: 'Juntas evaluadas',     value: avKpis.total,           color: '#3b82f6', fmt: (v) => String(v ?? '—') },
              { label: `Cumplen ≥ ${AVAILABILITY_MIN_PCT} %`, value: avKpis.cumple, color: '#10b981', fmt: (v) => String(v ?? '—') },
              { label: 'No cumplen',           value: avKpis.incumple,        color: '#ef4444', fmt: (v) => String(v ?? '—') },
              { label: 'Disponibilidad prom.', value: avKpis.avgAvailability, color: avgAvailColor, fmt: (v) => v != null ? `${v.toFixed(2)} %` : '—' },
              { label: 'Total horas caída',    value: avKpis.totalDowntimeHours, color: '#f59e0b', fmt: (v) => v != null ? `${v.toFixed(1)} h` : '—' },
            ].map((k) => (
              <button key={k.label} type="button" onClick={() => {
                if (k.label.includes('Cumplen')) applyJdiScope(k.label, filteredJuntas.filter((j) => j.cumple));
                else if (k.label === 'No cumplen') applyJdiScope(k.label, filteredJuntas.filter((j) => !j.cumple));
                else applyJdiScope(k.label, filteredJuntas);
              }} style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,.95), rgba(30,41,59,.85))',
                border: `1px solid ${k.color}33`,
                borderLeft: `3px solid ${k.color}`,
                borderRadius: 8,
                padding: '12px 14px',
                boxShadow: `0 0 18px ${k.color}0d`,
                cursor: 'pointer',
                textAlign: 'left',
              }}>
                <div style={{ fontSize: '.58rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: k.color, lineHeight: 1.1 }}>{k.fmt(k.value)}</div>
              </button>
            ))}
          </div>

          {/* Tabla por Junta */}
          {juntas.length > 0 && (
            <div className="panel">
              <div className="panel__head">
                <div className="panel__head-title">Disponibilidad por Junta de Internet (Red de Acceso)</div>
                <div className="panel__head-sub">Período: {AVAILABILITY_PERIOD_HOURS} h · Incumplimientos primero · {filteredJuntas.length !== juntas.length ? `${filteredJuntas.length} de ${juntas.length} juntas` : `${juntas.length} juntas`}</div>
              </div>
              <div className="panel__body" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                      {['', 'Junta / Centro Poblado', 'Departamento', 'Municipio', 'Tickets imputables', 'Intervalos de parada (fecha/hora)', 'Horas caída', 'Disponibilidad', 'Estado'].map((h) => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '.64rem', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJuntas.slice(0, 80).map((j) => {
                      const ok = j.cumple;
                      const statusColor = ok ? '#10b981' : '#ef4444';
                      const availColor = j.availability >= AVAILABILITY_MIN_PCT ? '#10b981' : j.availability >= 90 ? '#f59e0b' : '#ef4444';
                      return (
                        <tr key={j.junta} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer' }} onClick={() => applyJdiScope(`Junta ${j.junta}`, [j])}>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: statusColor }} title={ok ? 'Cumple ≥ 98 %' : 'No cumple'} />
                          </td>
                          <td style={{ padding: '6px 10px', color: '#cbd5e1', fontWeight: 600 }}>{j.junta}</td>
                          <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{j.department || '—'}</td>
                          <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{j.municipality || '—'}</td>
                          <td style={{ padding: '6px 10px', color: j.imputableCount > 0 ? '#fca5a5' : '#475569', textAlign: 'center' }}>{j.imputableCount}</td>
                          <td style={{ padding: '6px 10px', color: '#94a3b8', minWidth: 280 }}>
                            {j.imputables.length === 0 ? '—' : (
                              <div style={{ display: 'grid', gap: 3 }}>
                                {j.imputables.slice(0, 3).map((item) => (
                                  <div key={`${j.junta}-${item.ticketId}-${item.ticketStart || 'na'}`} style={{ fontSize: '.66rem' }}>
                                    #{item.ticketId} · {item.ticketStart ? formatDateTime(item.ticketStart) : 'sin inicio'} → {item.ticketEnd ? formatDateTime(item.ticketEnd) : 'abierto'}
                                  </div>
                                ))}
                                {j.imputables.length > 3 && <div style={{ fontSize: '.64rem', color: '#64748b' }}>+{j.imputables.length - 3} intervalos adicionales</div>}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '6px 10px', color: j.totalDowntimeHours > 0 ? '#f59e0b' : '#475569', textAlign: 'right' }}>{j.totalDowntimeHours.toFixed(1)} h</td>
                          <td style={{ padding: '6px 10px', color: availColor, fontWeight: 700, textAlign: 'right' }}>{j.availability.toFixed(2)} %</td>
                          <td style={{ padding: '6px 10px' }}>
                            <span style={{ background: `${statusColor}18`, border: `1px solid ${statusColor}44`, borderRadius: 12, padding: '2px 8px', color: statusColor, fontSize: '.66rem', fontWeight: 600 }}>
                              {ok ? '✓ Cumple' : '✗ No cumple'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredJuntas.length === 0 && (
                      <tr><td colSpan={9} style={{ padding: '20px 10px', textAlign: 'center', color: '#475569' }}>
                        {juntas.length === 0 ? 'Sin tickets con categoría imputable en el período.' : 'Sin juntas que coincidan con el filtro seleccionado.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
                {filteredJuntas.length > 80 && (
                  <p style={{ padding: '8px 10px', fontSize: '.7rem', color: '#475569', margin: 0 }}>Mostrando 80 de {filteredJuntas.length} juntas.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            INDICADOR 1 · Velocidad Efectiva Mínima de Navegación
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.35)', borderRadius: 6, padding: '3px 10px', fontSize: '.7rem', fontWeight: 700, color: '#818cf8', letterSpacing: '.05em' }}>INDICADOR 1</span>
            <span style={{ fontSize: '.92rem', fontWeight: 700, color: '#e2e8f0' }}>Velocidad Efectiva Mínima de Navegación</span>
          </div>

          {/* Info bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, background: 'rgba(15,23,42,.85)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 8, padding: '10px 16px', fontSize: '.74rem', color: '#64748b' }}>
              Muestra: <strong style={{ color: '#93c5fd' }}>{VELOCITY_SAMPLE_PCT} %</strong> de hogares activos por Junta ·
              Cumplimiento: <strong style={{ color: '#93c5fd' }}>≥ {VELOCITY_COMPLIANCE_THRESHOLD} %</strong> de las pruebas deben superar los umbrales mínimos de su tecnología.
            </div>
          </div>

          {/* Technology cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 10 }}>
            {Object.entries(VELOCITY_THRESHOLDS).map(([key, v], i) => {
              const colors = ['#6366f1', '#0ea5e9', '#10b981'];
              const c = colors[i % colors.length];
              return (
                <div key={key} style={{
                  background: `linear-gradient(135deg, rgba(15,23,42,.95), rgba(30,41,59,.9))`,
                  border: `1px solid ${c}33`,
                  borderTop: `3px solid ${c}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: `0 0 20px ${c}0d`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: `${c}20`, border: `1px solid ${c}44`, borderRadius: 6, padding: '2px 8px', fontSize: '.65rem', fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {key}
                    </span>
                    <span style={{ fontSize: '.72rem', color: '#cbd5e1', fontWeight: 600 }}>{v.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.15)', borderRadius: 6, padding: '8px' }}>
                      <div style={{ fontSize: '.58rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>↓ Descarga</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>≥ {v.download}</div>
                      <div style={{ fontSize: '.6rem', color: '#64748b' }}>Mbps</div>
                    </div>
                    <div style={{ background: 'rgba(96,165,250,.06)', border: '1px solid rgba(96,165,250,.15)', borderRadius: 6, padding: '8px' }}>
                      <div style={{ fontSize: '.58rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>↑ Subida</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#60a5fa' }}>≥ {v.upload}</div>
                      <div style={{ fontSize: '.6rem', color: '#64748b' }}>Mbps</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 4, padding: '8px 12px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 6, fontSize: '.71rem', color: '#fbbf24' }}>
            ℹ Los datos de pruebas de velocidad deben ser cargados por separado. Consulte el módulo de carga de datos para incluir resultados de speed test por Junta.
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SEGUIMIENTO ANS · Tiempos de respuesta por ticket
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', borderRadius: 6, padding: '3px 10px', fontSize: '.7rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '.05em' }}>SEGUIMIENTO ANS</span>
          <span style={{ fontSize: '.92rem', fontWeight: 700, color: '#e2e8f0' }}>Tiempos de respuesta por ticket</span>
          <span style={{ fontSize: '.7rem', color: '#64748b' }}>Límite: {ANS_THRESHOLD_HOURS} h reales de trabajo</span>
        </div>

        {/* ── Explicación de la fórmula ──────────────────────── */}
        <div style={{
          background: 'rgba(15,23,42,.85)', border: '1px solid rgba(99,102,241,.25)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 14,
        }}>
          <div style={{ fontSize: '.78rem', color: '#93c5fd', fontWeight: 700, marginBottom: 10 }}>📐 ¿Cómo se calcula el tiempo?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, fontSize: '.73rem' }}>
            {[
              {
                icon: '🕐',
                title: 'Tiempo bruto',
                color: '#94a3b8',
                desc: 'Desde que se registró la falla hasta que se cerró el ticket. Es el tiempo total que pasó, incluyendo interrupciones.',
              },
              {
                icon: '⏸',
                title: 'Parada de reloj',
                color: '#f59e0b',
                desc: 'Tiempo en que el encargado no podía actuar por causas externas: clima extremo, corte de energía, orden público, etc. Este tiempo se descuenta y NO cuenta contra el límite.',
              },
              {
                icon: '⚡',
                title: 'Tiempo real de trabajo',
                color: '#818cf8',
                desc: `Bruto − Parada. Es el tiempo que el encargado realmente tuvo para resolver el problema. Este es el que se compara con el límite de ${ANS_THRESHOLD_HOURS} horas.`,
              },
              {
                icon: '🎯',
                title: `Límite acordado: ${ANS_THRESHOLD_HOURS} horas`,
                color: '#10b981',
                desc: `✅ Si el tiempo real ≤ ${ANS_THRESHOLD_HOURS} h: dentro del límite. ❌ Si supera ${ANS_THRESHOLD_HOURS} h: se considera que la respuesta fue tardía. La columna "Restante / Excedido" muestra cuánto le sobró o cuánto se pasó.`,
              },
            ].map((item) => (
              <div key={item.title} style={{ background: `${item.color}0d`, border: `1px solid ${item.color}22`, borderRadius: 7, padding: '8px 12px' }}>
                <div style={{ fontSize: '1rem', marginBottom: 4 }}>{item.icon} <strong style={{ color: item.color }}>{item.title}</strong></div>
                <div style={{ color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filtros ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { key: 'department',   label: 'Departamento',     opts: filterOptions.department },
            { key: 'municipality', label: 'Municipio',        opts: filterOptions.municipality },
            { key: 'operatorCode', label: 'Código operador',  opts: filterOptions.operatorCode },
          ].map(({ key, label, opts }) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 160 }}>
              <span style={{ fontSize: '.62rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
              <select
                value={ansFilter[key]}
                onChange={(e) => setAnsFilter((f) => ({ ...f, [key]: e.target.value }))}
                style={{ background: 'rgba(15,23,42,.95)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, padding: '5px 8px', color: '#e2e8f0', fontSize: '.78rem' }}
              >
                <option value="">Todos</option>
                {opts.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          ))}
          {(ansFilter.department || ansFilter.municipality || ansFilter.operatorCode) && (
            <button
              onClick={() => setAnsFilter({ department: '', municipality: '', operatorCode: '' })}
              style={{ alignSelf: 'flex-end', background: 'rgba(239,68,68,.1)', border: '1px solid #ef444444', borderRadius: 6, padding: '5px 12px', color: '#ef4444', fontSize: '.72rem', cursor: 'pointer' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* ── KPI cards ───────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Tickets revisados',      value: formatInteger(kpis.total),           color: '#3b82f6', icon: '📋', desc: 'Con datos para calcular' },
            { label: 'Dentro del límite ✓',   value: formatInteger(kpis.cumple),          color: '#10b981', icon: '✅', desc: `≤ ${ANS_THRESHOLD_HOURS} h reales` },
            { label: 'Fuera del límite ✗',    value: formatInteger(kpis.incumple),        color: '#ef4444', icon: '🔴', desc: `Superaron las ${ANS_THRESHOLD_HOURS} h` },
            { label: '% respondidos a tiempo', value: formatPercent(kpis.complianceRate), color: complianceColor, icon: '🎯', desc: 'Meta ideal ≥ 80 %' },
            { label: 'Parada prom.',           value: fmtHours(kpis.avgStopHours),        color: '#f59e0b', icon: '⏸', desc: 'Tiempo externo descontado' },
            { label: 'Tiempo real prom.',      value: fmtHours(kpis.avgNetHours),         color: '#a855f7', icon: '⚡', desc: 'Trabajo efectivo promedio' },
            ].map((k) => (
            <button key={k.label} type="button" onClick={() => {
              if (k.label.includes('Dentro')) applyAnsScope(k.label, (row) => row.status === 'cumple');
              else if (k.label.includes('Fuera')) applyAnsScope(k.label, (row) => row.status === 'incumple');
              else if (k.label.includes('Parada')) applyAnsScope(k.label, (row) => row.stopHours > 0);
              else applyAnsScope(k.label, () => true);
            }} style={{
              background: 'linear-gradient(135deg, rgba(15,23,42,.95), rgba(30,41,59,.85))',
              border: `1px solid ${k.color}33`,
              borderLeft: `3px solid ${k.color}`,
              borderRadius: 8,
              padding: '12px 14px',
              boxShadow: `0 0 18px ${k.color}0d`,
              cursor: 'pointer',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: '.88rem' }}>{k.icon}</span>
                <span style={{ fontSize: '.57rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>{k.label}</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: k.color, lineHeight: 1.1 }}>{k.value}</div>
              {k.desc && <div style={{ fontSize: '.58rem', color: '#475569', marginTop: 3 }}>{k.desc}</div>}
            </button>
          ))}
        </div>

        {/* ── Por departamento + por operador ─────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {/* Departamentos */}
          <div className="panel">
            <div className="panel__head"><div className="panel__head-title">Cumplimiento por departamento</div></div>
            <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {byDept.slice(0, 8).map((d) => {
                const rate = d.total ? (d.cumple / d.total) * 100 : 0;
                const barColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <button key={d.label} type="button" onClick={() => applyAnsScope(`Departamento ${d.label}`, (row) => row.department === d.label)} style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.71rem', marginBottom: 3 }}>
                      <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }} title={d.label}>{d.label}</span>
                      <span style={{ color: barColor, fontWeight: 700 }}>{formatPercent(rate)} <span style={{ color: '#475569', fontWeight: 400 }}>({d.cumple}/{d.total})</span></span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${rate}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width .3s' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operadores */}
          <div className="panel">
            <div className="panel__head"><div className="panel__head-title">Cumplimiento por operador</div></div>
            <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {byOperator.slice(0, 8).map((op) => {
                const rate = op.total ? (op.cumple / op.total) * 100 : 0;
                const barColor = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <button key={op.label} type="button" onClick={() => applyAnsScope(`Operador ${op.label}`, (row) => row.operatorCode === op.label)} style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.71rem', marginBottom: 3 }}>
                      <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }} title={op.label}>{op.label}</span>
                      <span style={{ color: barColor, fontWeight: 700 }}>{formatPercent(rate)} <span style={{ color: '#475569', fontWeight: 400 }}>({op.cumple}/{op.total})</span></span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${rate}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width .3s' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tabla de detalle ─────────────────────────────────── */}
        <div className="panel">
          <div className="panel__head">
            <div>
              <div className="panel__head-title">
                Detalle por ticket · {formatInteger(kpis.incumple)} superan las {ANS_THRESHOLD_HOURS} h
              </div>
              <div className="panel__head-sub">
                Incumplidos primero · El tiempo restante en rojo indica cuánto se excedió el límite
              </div>
            </div>
            <div className="table-card__actions">
              <button
                type="button"
                className="table-card__action-btn"
                title="Exportar informe JDI completo (5 hojas: Resumen · Disponibilidad · Tickets · Velocidad · Metodología)"
                onClick={() => exportJDIReport(availCtx)}
              >
                📊 Excel JDI
              </button>
            </div>
          </div>
          <div className="panel__body" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.77rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  {['', 'Ticket #', 'Operador', 'Departamento / Municipio', 'Inicio falla', 'T. bruto', 'T. parada', 'Detalle paradas', 'T. neto', 'Restante / Excedido', 'Estado'].map((h) => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 120).map((r) => {
                  const ok = r.status === 'cumple';
                  const statusColor = ok ? '#10b981' : '#ef4444';
                  const restColor = r.remainingHours > 0 ? '#10b981' : '#ef4444';
                  const prioDot = PRIO_DOT[r.priority] || '#64748b';
                  const stopIntervals = stopIntervalsByTicket[String(r.ticketId)] || [];
                  return (
                    <tr
                      key={r.ticketId}
                      style={{ borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer' }}
                      onClick={() => setSelectedTicketId(r.ticketId)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Semáforo */}
                      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} title={ok ? 'Cumple ANS' : 'Incumple ANS'} />
                      </td>
                      <td style={{ padding: '7px 10px', color: '#93c5fd', fontWeight: 700, whiteSpace: 'nowrap' }}>#{r.ticketId}</td>
                      <td style={{ padding: '7px 10px', color: '#e2e8f0', whiteSpace: 'nowrap' }}>{r.operatorCode}</td>
                      <td style={{ padding: '7px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.department}{r.municipality && r.municipality !== r.department ? ` · ${r.municipality}` : ''}</td>
                      <td style={{ padding: '7px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.faultStart ? formatDate(r.faultStart) : '—'}</td>
                      <td style={{ padding: '7px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtHours(r.grossHours)}</td>
                      <td style={{ padding: '7px 10px', color: r.stopHours > 0 ? '#f59e0b' : '#475569', whiteSpace: 'nowrap' }}>{fmtHours(r.stopHours)}</td>
                      <td style={{ padding: '7px 10px', minWidth: 300 }}>
                        {stopIntervals.length === 0 ? (
                          <span style={{ color: '#475569' }}>Sin intervalos registrados</span>
                        ) : (
                          <div style={{ display: 'grid', gap: 3 }}>
                            {stopIntervals.slice(0, 3).map((ev, idx) => (
                              <div key={`${r.ticketId}-stop-${idx}`} style={{ display: 'grid', gap: 2, fontSize: '.66rem' }}>
                                <span style={{ color: '#f87171', fontWeight: 700 }}>
                                  inicio parada de reloj: {ev.stopStart ? formatDateTime(ev.stopStart) : 'sin fecha'}
                                </span>
                                <span style={{ color: '#34d399', fontWeight: 700 }}>
                                  fin parada de reloj: {ev.stopEnd ? formatDateTime(ev.stopEnd) : 'abierta'}
                                </span>
                              </div>
                            ))}
                            {stopIntervals.length > 3 && (
                              <span style={{ color: '#64748b', fontSize: '.64rem' }}>
                                +{stopIntervals.length - 3} intervalos adicionales
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '7px 10px', color: statusColor, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtHours(r.netHours)}</td>
                      {/* Tiempo restante o excedido */}
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                        <TiempoRestanteBadge ans={r} />
                      </td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${statusColor}18`, border: `1px solid ${statusColor}44`, borderRadius: 12, padding: '2px 8px', color: statusColor, fontSize: '.67rem', fontWeight: 600 }}>
                          {ok ? '✓ Cumple' : '✗ Incumple'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={11} style={{ padding: '24px 10px', textAlign: 'center', color: '#475569' }}>Sin datos disponibles para los filtros actuales.</td></tr>
                )}
              </tbody>
            </table>
            {rows.length > 120 && (
              <p style={{ padding: '8px 10px', fontSize: '.7rem', color: '#475569', margin: 0 }}>
                Mostrando 120 de {formatInteger(rows.length)} · Usa los filtros para acotar la vista.
              </p>
            )}
          </div>
        </div>
      </Fragment>
    );
  }

  function updateFilter(key, value) {
    startTransition(() => {
      setFilters((current) => {
        const next = { ...current, [key]: value };
        if (key === 'department') {
          next.municipality = '';
          next.locality = '';
        }
        if (key === 'municipality') {
          next.locality = '';
        }
        if (key === 'project') {
          next.subProject = '';
        }
        return next;
      });
    });
  }

  function toggleFlag(key) {
    startTransition(() => setFlags((current) => ({ ...current, [key]: !current[key] })));
  }

  function resetAll() {
    startTransition(() => {
      setFilters(DEFAULT_FILTERS);
      setFlags(DEFAULT_FLAGS);
      setTextSearch('');
      setSelectedTicketId('');
      setInteractionScope(null);
      setInteractionFeedback('');
      setActiveGeoDepartment('');
      setMntSearch('');
      setAnsFilter({ department: '', municipality: '', operatorCode: '' });
      setJdiFilter({ junta: '', status: '' });
    });
  }
}

const authInputStyle = {
  background: 'rgba(15,23,42,.9)',
  border: '1px solid rgba(148,163,184,.35)',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#e2e8f0',
  fontSize: '.86rem',
  outline: 'none',
};

const authButtonStyle = {
  background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
  border: '1px solid rgba(147,197,253,.45)',
  borderRadius: 8,
  color: '#eff6ff',
  fontWeight: 700,
  cursor: 'pointer',
  padding: '10px 12px',
};

const authModeButton = {
  background: 'rgba(15,23,42,.55)',
  border: '1px solid rgba(148,163,184,.2)',
  borderRadius: 8,
  color: '#94a3b8',
  fontWeight: 600,
  cursor: 'pointer',
  padding: '7px 10px',
  fontSize: '.75rem',
};

const authModeButtonActive = {
  ...authModeButton,
  background: 'rgba(37,99,235,.2)',
  border: '1px solid rgba(147,197,253,.45)',
  color: '#dbeafe',
};

const miniInputStyle = {
  background: 'rgba(15,23,42,.88)',
  border: '1px solid rgba(148,163,184,.24)',
  borderRadius: 7,
  padding: '6px 8px',
  color: '#e2e8f0',
  fontSize: '.72rem',
};

function Panel({ title, subtitle, footerNote, children }) {
  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <div className="panel__head-title">{title}</div>
          {subtitle && <div className="panel__head-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="panel__body">{children}</div>
      {footerNote && (
        <div className="panel__footer-note">{footerNote}</div>
      )}
    </section>
  );
}

function Badge({ tone, children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function TiempoRestanteBadge({ ans }) {
  if (!ans || ans.status === 'sin-dato') return <span style={{ color: '#64748b' }}>—</span>;
  
  const isOk = ans.remainingHours >= 0;
  const color = isOk ? '#10b981' : '#ef4444';
  const icon = isOk ? '▲' : '▼';
  
  if (!ans.isOpen) {
    return (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', gap: 4, 
        color: '#64748b', fontSize: '.7rem' 
      }}>
        {isOk ? '✓' : '✗'} Cerrado {isOk ? 'a tiempo' : 'excedido'} ({fmtHours(Math.abs(ans.remainingHours))})
      </span>
    );
  }

  const labelText = isOk ? 'restantes' : 'excedido';

  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 4, 
      color: color, 
      fontWeight: 700, 
      fontSize: '.72rem',
      background: `${color}18`,
      border: `1px solid ${color}44`,
      borderRadius: 12,
      padding: '3px 8px',
      whiteSpace: 'nowrap'
    }}>
      {icon} {fmtHours(Math.abs(ans.remainingHours))}
      <span style={{ color: color, opacity: 0.8, fontWeight: 500, fontSize: '.65rem' }}>
        {labelText}
      </span>
    </span>
  );
}

function parseExcelToDashboardPayload(fileName, arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) {
    throw new Error('El archivo no contiene hojas válidas.');
  }

  const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
  const tickets = rows
    .map((row) => mapExcelRowToTicket(row))
    .filter(Boolean);

  return {
    meta: {
      sourceFile: fileName,
      generatedAt: new Date().toISOString(),
      sheetNames: workbook.SheetNames,
      recordCounts: {
        tickets: tickets.length,
        stopEvents: 0,
        orphanStopTickets: 0,
      },
      coverage: {
        clientCreatedPct: 0,
        technicianPct: 0,
        maintenancePct: 0,
        resolutionCommentPct: 0,
      },
      geoCoverage: {},
      nlpSummary: {},
      warnings: ['Modo local: datos cargados desde Excel adjunto en la sesión actual.'],
    },
    tickets,
    stopEvents: [],
  };
}

function mapExcelRowToTicket(row) {
  const ticketId = normalizeTicketId(readAny(row, ['#Ticket', 'Ticket #']));
  if (!ticketId) return null;

  const ticketStart = toIsoDate(readAny(row, ['Fecha Inicio']));
  const ticketEnd = toIsoDate(readAny(row, ['Ticket Fecha Fin']));
  const clientCreated = toIsoDate(readAny(row, ['Fecha Creacion Cliente']));

  const closeDurationDays = ticketStart && ticketEnd
    ? Math.max(0, (new Date(ticketEnd).getTime() - new Date(ticketStart).getTime()) / 86400000)
    : null;

  return {
    ticketId,
    operatorCode: cleanAny(readAny(row, ['Código Operador', 'Codigo Operador'])),
    clientCode: normalizeTicketId(readAny(row, ['Código Cliente', 'Codigo Cliente'])),
    department: cleanAny(readAny(row, ['Departamento'])),
    municipality: cleanAny(readAny(row, ['Municipio'])),
    locality: cleanAny(readAny(row, ['Centro Poblado'])),
    ticketStart,
    ticketEnd,
    referenceDate: clientCreated || ticketStart,
    ticketState: cleanAny(readAny(row, ['Ticket Estado'])) || 'Sin dato',
    creator: cleanAny(readAny(row, ['Usuario Crea'])),
    assignee: cleanAny(readAny(row, ['Asignado A'])),
    closer: cleanAny(readAny(row, ['Usuario Cierre'])),
    maintenanceId: normalizeTicketId(readAny(row, ['Mantenimiento Id'])),
    maintenanceStart: toIsoDate(readAny(row, ['Fecha Inicio Mantenimiento'])),
    technician: cleanAny(readAny(row, ['Tecnico Asignado', 'Técnico Asignado'])),
    maintenanceCreator: cleanAny(readAny(row, ['Usuario Crea Mnt'])),
    maintenanceEnd: toIsoDate(readAny(row, ['Fecha Fin Mnt'])),
    maintenanceCloser: cleanAny(readAny(row, ['Usuario Cierre Mnt'])),
    maintenanceState: cleanAny(readAny(row, ['Estado Mnt'])),
    category: cleanAny(readAny(row, ['Categoria', 'Categoría'])),
    sourceOrigin: cleanAny(readAny(row, ['Fuente Origen'])),
    escalationGroup: cleanAny(readAny(row, ['Grupo Escalamiento'])),
    impact: cleanAny(readAny(row, ['Impacto'])),
    urgency: cleanAny(readAny(row, ['Urgencia'])),
    priority: cleanAny(readAny(row, ['Prioridad'])) || 'Sin dato',
    subProject: cleanAny(readAny(row, ['Sub Proyecto'])),
    project: cleanAny(readAny(row, ['Proyecto'])),
    type: cleanAny(readAny(row, ['Tipo'])),
    responsible: cleanAny(readAny(row, ['Responsable'])),
    clientCreated,
    infoSource: cleanAny(readAny(row, ['Fuente Información', 'Fuente Informacion'])),
    openingComment: cleanAny(readAny(row, ['Comentario Apertura'])),
    resolutionComment: cleanAny(readAny(row, ['Comentario Solución', 'Comentario Solucion'])),
    beneficiaryId: null,
    stopDaysTotal: 0,
    stopSegmentCount: 0,
    stopStart: null,
    stopEnd: null,
    faultStart: null,
    faultEnd: null,
    faultDurationDays: null,
    closeDurationDays,
    openAgeDays: null,
    geo: null,
  };
}

function readAny(row, keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
  }
  return '';
}

function cleanAny(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeTicketId(value) {
  if (value === null || value === undefined || value === '') return '';
  const raw = String(value).trim();
  if (/^\d+\.0$/.test(raw)) return raw.slice(0, -2);
  return raw;
}

function toIsoDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0));
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function TextSnippet({ text, query }) {
  const tokens = highlightText(text, query);
  return (
    <span className="snippet">
      {tokens.map((token, index) =>
        token.type === 'mark' ? (
          <mark key={`${token.value}-${index}`}>{token.value}</mark>
        ) : (
          <span key={`${token.value}-${index}`}>{token.value}</span>
        ),
      )}
    </span>
  );
}

function ticketColumns({ includeComments, query }) {
  const base = [
    {
      key: 'ticketId',
      label: 'Ticket',
      render: (row) => <strong>#{row.ticketId}</strong>,
    },
    {
      key: 'territory',
      label: 'Territorio',
      render: (row) => [row.department, row.municipality, row.locality].filter(Boolean).join(' · ') || 'Sin dato',
      exportValue: (row) => [row.department, row.municipality, row.locality].filter(Boolean).join(' | '),
    },
    {
      key: 'ticketState',
      label: 'Estado',
      render: (row) => <Badge tone={badgeTone(row.ticketState, 'state')}>{row.ticketState || 'Sin dato'}</Badge>,
    },
    {
      key: 'priority',
      label: 'Prioridad',
      render: (row) => <Badge tone={badgeTone(row.priority, 'priority')}>{row.priority || 'Sin dato'}</Badge>,
    },
    {
      key: 'currentStopDays',
      label: 'Parada',
      render: (row) => formatDays(row.currentStopDays),
      exportValue: (row) => row.currentStopDays,
    },
    {
      key: 'remainingHours',
      label: 'Tiempo restante',
      render: (row) => <TiempoRestanteBadge ans={row._ans || computeANS(row)} />,
      exportValue: (row) => {
        const ans = row._ans || computeANS(row);
        return ans.remainingHours != null ? ans.remainingHours : '';
      },
    },
    {
      key: 'assignee',
      label: 'Asignado',
      render: (row) => row.assignee || 'Sin dato',
    },
  ];

  if (!includeComments) {
    return base;
  }

  return base.concat([
    {
      key: 'openingComment',
      label: 'Apertura',
      render: (row) => <TextSnippet text={row.openingComment} query={query} />,
      exportValue: (row) => row.openingComment || '',
    },
    {
      key: 'resolutionComment',
      label: 'Solución',
      render: (row) => <TextSnippet text={row.resolutionComment} query={query} />,
      exportValue: (row) => row.resolutionComment || '',
    },
  ]);
}

const operationsColumns = [
  { key: 'label', label: 'Asignado' },
  { key: 'total', label: 'Total', render: (row) => formatInteger(row.total) },
  { key: 'open', label: 'Abiertos', render: (row) => formatInteger(row.open) },
  { key: 'closed', label: 'Cerrados', render: (row) => formatInteger(row.closed) },
  { key: 'avgMttr', label: 'T. resolución', render: (row) => formatDays(row.avgMttr), exportValue: (row) => row.avgMttr },
  { key: 'avgStopDays', label: 'Parada prom.', render: (row) => formatDays(row.avgStopDays), exportValue: (row) => row.avgStopDays },
  { key: 'topProject', label: 'Proyecto frecuente' },
];

const operatorColumns = [
  { key: 'name', label: 'Operador', description: 'Nombre del operador o sistema que participó en los tickets' },
  { key: 'totalTouched', label: 'Participados', render: (row) => formatInteger(row.totalTouched), description: 'Total de tickets únicos en que aparece en cualquier rol (asignado, creó, cerró, responsable)' },
  { key: 'assigned', label: 'Asignado', render: (row) => formatInteger(row.assigned), description: 'Tickets donde figura como operador asignado para su resolución' },
  { key: 'created', label: 'Creó', render: (row) => formatInteger(row.created), description: 'Tickets que este operador abrió o registró en el sistema' },
  { key: 'closed', label: 'Cerró', render: (row) => formatInteger(row.closed), description: 'Tickets que este operador marcó como cerrados o resueltos' },
  { key: 'open', label: 'Abiertos', render: (row) => formatInteger(row.open), description: 'Tickets que le están asignados y aún no han sido cerrados (backlog activo)' },
  { key: 'highPri', label: 'Alta prioridad', render: (row) => formatInteger(row.highPri), description: 'Tickets asignados clasificados con prioridad Alta' },
  { key: 'avgStopDays', label: 'Parada prom.', render: (row) => formatDays(row.avgStopDays), exportValue: (row) => row.avgStopDays, description: 'Promedio de días de parada de reloj acumulados en sus tickets asignados' },
  { key: 'followUpCount', label: 'Seguimientos', render: (row) => formatInteger(row.followUpCount), description: 'Cantidad de comentarios de tipo seguimiento en sus tickets asignados' },
  { key: 'commentCount', label: 'Comentarios', render: (row) => formatInteger(row.commentCount), description: 'Total de entradas de comentario registradas en sus tickets asignados' },
  { key: 'topProject', label: 'Proyecto principal', description: 'Proyecto con mayor cantidad de tickets asociados a este operador' },
  { key: 'lastActivity', label: 'Última actividad', description: 'Fecha más reciente de actividad registrada (ticket o comentario)' },
];

function sameFilters(left, right) {
  return Object.keys(left).every((key) => left[key] === right[key]);
}

// ─── Maintenance view ──────────────────────────────────────────────────
const MNT_STATE_COLOR = {
  Completado: '#10b981', Finalizado: '#10b981', Cerrado: '#10b981',
  'En progreso': '#3b82f6', Activo: '#3b82f6', Abierto: '#3b82f6',
  Pendiente: '#f59e0b', Programado: '#f59e0b',
  Anulado: '#ef4444', Cancelado: '#ef4444',
};
const PRIO_DOT = { Alta: '#ef4444', Media: '#f59e0b', Baja: '#10b981' };

// ─── ANS view helpers (module-level, stable references) ────────────────
function fmtHours(h) {
  if (h == null || !Number.isFinite(h)) return '—';
  if (Math.abs(h) < 1) return `${Math.round(h * 60)} min`;
  return `${h.toLocaleString('es-CO', { maximumFractionDigits: 1 })} h`;
}

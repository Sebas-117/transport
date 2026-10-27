// ============================================================
//  TRANSPORTE ESCOLAR · TecNM Campus León · Equipo 10
//  MVP basado en Modelo de Negocio + SRS + Reglas de Negocio
// ============================================================

const STORAGE_KEY = 'transporte_escolar_v1';

// ---------- DATOS INICIALES (seed) ----------
const SEED = {
  users: [
    { id: 1, username: 'admin',     password: '1234', role: 'admin',     name: 'Carlos Admin',      matricula: null },
    { id: 2, username: 'operador1', password: '1234', role: 'operador',  name: 'Juan Conductor',    matricula: null },
    { id: 3, username: 'alumno1',   password: '1234', role: 'alumno',    name: 'María Pérez',       matricula: '23240020' },
    { id: 4, username: 'tutor1',    password: '1234', role: 'tutor',     name: 'Luis Pérez (Tutor)',matricula: null, alumnoId: 3 },
    { id: 5, username: 'alumno2',   password: '1234', role: 'alumno',    name: 'Pedro Gómez',       matricula: '23240021' },
    { id: 6, username: 'operador2', password: '1234', role: 'operador',  name: 'Ana Operadora',     matricula: null },
  ],
  vehicles: [
    { id: 1, placas: 'LEO-123A', economico: 'U-01', capacidad: 25, activo: true },
    { id: 2, placas: 'LEO-456B', economico: 'U-02', capacidad: 30, activo: true },
    { id: 3, placas: 'LEO-789C', economico: 'U-03', capacidad: 20, activo: true },
  ],
  routes: [
    { id: 1, nombre: 'Ruta Centro',     descripcion: 'Centro → Campus',     paradas: ['Plaza Principal', 'Av. López Mateos', 'Campus León'], horarioSalida: '06:30', horarioLlegada: '07:15', activa: true },
    { id: 2, nombre: 'Ruta Norte',      descripcion: 'Col. Norte → Campus', paradas: ['Col. San Miguel', 'Blvd. Aeropuerto', 'Campus León'], horarioSalida: '06:45', horarioLlegada: '07:30', activa: true },
    { id: 3, nombre: 'Ruta Sur',        descripcion: 'Col. Sur → Campus',   paradas: ['Col. Jardines', 'Calle 5 de Mayo', 'Campus León'], horarioSalida: '06:20', horarioLlegada: '07:10', activa: true },
  ],
  assignments: [ // alumnoId → routeId
    { alumnoId: 3, routeId: 1 },
    { alumnoId: 5, routeId: 2 },
  ],
  trips: [ // viajes
    { id: 1, routeId: 1, vehicleId: 1, operadorId: 2, fecha: today(), estado: 'Programado', horaInicio: null, horaFin: null, confirmados: [3], incidencias: [] },
    { id: 2, routeId: 2, vehicleId: 2, operadorId: 6, fecha: today(), estado: 'Programado', horaInicio: null, horaFin: null, confirmados: [5], incidencias: [] },
  ],
  notifications: [
    { id: 1, userId: 3, mensaje: 'Bienvenido al sistema de Transporte Escolar. Tu ruta es Ruta Centro.', fecha: now(), leida: false, tipo: 'info' },
  ],
  nextIds: { user: 7, vehicle: 4, route: 4, trip: 3, notification: 2 }
};

function today() {
  return new Date().toISOString().slice(0, 10);
}
function now() {
  return new Date().toISOString();
}

// ---------- PERSISTENCIA ----------
function loadDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    return structuredClone(SEED);
  }
  return JSON.parse(raw);
}
function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
function resetDB() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

// ---------- ESTADO GLOBAL ----------
let DB = loadDB();
let currentUser = null;

// ---------- UTILIDADES ----------
function showToast(msg, type = 'primary') {
  const toastEl = document.getElementById('toast');
  const body = document.getElementById('toast-body');
  body.textContent = msg;
  toastEl.className = `toast align-items-center text-white border-0 bg-${type}`;
  new bootstrap.Toast(toastEl, { delay: 3500 }).show();
}

function getUser(id) { return DB.users.find(u => u.id === id); }
function getRoute(id) { return DB.routes.find(r => r.id === id); }
function getVehicle(id) { return DB.vehicles.find(v => v.id === id); }
function getTrip(id) { return DB.trips.find(t => t.id === id); }

function statusBadge(estado) {
  const map = {
    'Programado': 'status-programado',
    'En proceso': 'status-en-proceso',
    'Finalizado': 'status-finalizado',
    'Cancelado': 'status-cancelado',
    'Archivado': 'status-finalizado'
  };
  return `<span class="badge badge-status ${map[estado] || ''}">${estado}</span>`;
}

function notify(userId, mensaje, tipo = 'info') {
  DB.notifications.unshift({
    id: DB.nextIds.notification++,
    userId,
    mensaje,
    fecha: now(),
    leida: false,
    tipo
  });
  saveDB(DB);
}

// ---------- AUTENTICACIÓN (RN8) ----------
function login(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const found = DB.users.find(u => u.username === user && u.password === pass);
  if (!found) {
    showToast('Credenciales incorrectas', 'danger');
    return;
  }
  currentUser = found;
  document.getElementById('login-view').classList.add('d-none');
  document.getElementById('app-view').classList.remove('d-none');
  document.getElementById('user-badge').textContent = `${found.name} · ${found.role.toUpperCase()}`;
  buildSidebar();
  navigate('dashboard');
  showToast(`Bienvenido, ${found.name}`, 'success');
}

function logout() {
  currentUser = null;
  document.getElementById('app-view').classList.add('d-none');
  document.getElementById('login-view').classList.remove('d-none');
  document.getElementById('login-form').reset();
}

// ---------- MENÚ POR ROL ----------
const MENUS = {
  admin: [
    { id: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { id: 'users',     icon: 'bi-people',       label: 'Usuarios' },
    { id: 'vehicles',  icon: 'bi-truck',        label: 'Vehículos' },
    { id: 'routes',    icon: 'bi-signpost-2',   label: 'Rutas' },
    { id: 'trips',     icon: 'bi-calendar-check', label: 'Viajes' },
    { id: 'reports',   icon: 'bi-bar-chart',    label: 'Reportes' },
    { id: 'rules',     icon: 'bi-shield-check', label: 'Reglas de negocio' },
  ],
  operador: [
    { id: 'dashboard', icon: 'bi-speedometer2', label: 'Mi panel' },
    { id: 'mytrips',   icon: 'bi-bus-front',    label: 'Mis recorridos' },
    { id: 'boarding',  icon: 'bi-person-check', label: 'Lista de abordaje' },
    { id: 'qrscan',    icon: 'bi-qr-code-scan', label: 'Escanear QR' },
    { id: 'incidents', icon: 'bi-exclamation-triangle', label: 'Reportar incidencia' },
  ],
  alumno: [
    { id: 'dashboard', icon: 'bi-speedometer2', label: 'Mi panel' },
    { id: 'myroute',   icon: 'bi-signpost',     label: 'Mi ruta' },
    { id: 'myqr',      icon: 'bi-qr-code',      label: 'Mi código QR' },
    { id: 'confirm',   icon: 'bi-check2-circle', label: 'Confirmar viaje' },
    { id: 'notifs',    icon: 'bi-bell',         label: 'Notificaciones' },
  ],

  tutor: [
    { id: 'dashboard', icon: 'bi-speedometer2', label: 'Mi panel' },
    { id: 'location',  icon: 'bi-geo-alt',      label: 'Ubicación del transporte' },
    { id: 'myroute',   icon: 'bi-signpost',     label: 'Ruta del alumno' },
    { id: 'notifs',    icon: 'bi-bell',         label: 'Notificaciones' },
  ]
};

function buildSidebar() {
  const menu = MENUS[currentUser.role] || [];
  const ul = document.getElementById('sidebar-menu');
  ul.innerHTML = menu.map(m => `
    <li class="nav-item">
      <a class="nav-link" href="#" data-page="${m.id}" onclick="navigate('${m.id}'); return false;">
        <i class="bi ${m.icon} me-2"></i>${m.label}
      </a>
    </li>
  `).join('') + `
    <li class="nav-item mt-3">
      <a class="nav-link text-danger" href="#" onclick="resetDB(); return false;">
        <i class="bi bi-arrow-counterclockwise me-2"></i>Reset datos demo
      </a>
    </li>
  `;
}

function navigate(page) {
  document.querySelectorAll('#sidebar-menu .nav-link').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`#sidebar-menu [data-page="${page}"]`);
  if (link) link.classList.add('active');

  const area = document.getElementById('content-area');
  // Detener escáner si se cambia de página
  stopQrScanner();

  const views = {
    dashboard: renderDashboard,
    users: renderUsers,
    vehicles: renderVehicles,
    routes: renderRoutes,
    trips: renderTrips,
    reports: renderReports,
    rules: renderRules,
    mytrips: renderMyTrips,
    boarding: renderBoarding,
    qrscan: renderQrScan,
    incidents: renderIncidents,
    myroute: renderMyRoute,
    myqr: renderMyQr,
    confirm: renderConfirm,
    notifs: renderNotifs,
    location: renderLocation
  };
  (views[page] || (() => area.innerHTML = '<p>Vista no encontrada</p>'))(area);
}


// ============================================================
//  VISTAS · ADMINISTRADOR
// ============================================================
function renderDashboard(el) {
  const totalAlumnos = DB.users.filter(u => u.role === 'alumno').length;
  const totalVehiculos = DB.vehicles.filter(v => v.activo).length;
  const totalRutas = DB.routes.filter(r => r.activa).length;
  const viajesHoy = DB.trips.filter(t => t.fecha === today()).length;
  const enProceso = DB.trips.filter(t => t.estado === 'En proceso').length;

  if (currentUser.role === 'admin') {
    el.innerHTML = `
      <h2 class="h4 mb-4 fw-bold">Dashboard · Administrador</h2>
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3"><div class="card card-stat p-3"><div class="d-flex justify-content-between"><div><div class="text-muted small">Alumnos</div><div class="fs-3 fw-bold">${totalAlumnos}</div></div><i class="bi bi-people fs-2 text-primary opacity-50"></i></div></div></div>
        <div class="col-sm-6 col-xl-3"><div class="card card-stat p-3"><div class="d-flex justify-content-between"><div><div class="text-muted small">Vehículos activos</div><div class="fs-3 fw-bold">${totalVehiculos}</div></div><i class="bi bi-truck fs-2 text-success opacity-50"></i></div></div></div>
        <div class="col-sm-6 col-xl-3"><div class="card card-stat p-3"><div class="d-flex justify-content-between"><div><div class="text-muted small">Rutas activas</div><div class="fs-3 fw-bold">${totalRutas}</div></div><i class="bi bi-signpost-2 fs-2 text-warning opacity-50"></i></div></div></div>
        <div class="col-sm-6 col-xl-3"><div class="card card-stat p-3"><div class="d-flex justify-content-between"><div><div class="text-muted small">Viajes hoy / En proceso</div><div class="fs-3 fw-bold">${viajesHoy} / ${enProceso}</div></div><i class="bi bi-calendar-check fs-2 text-danger opacity-50"></i></div></div></div>
      </div>
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white fw-semibold">Viajes de hoy</div>
        <div class="card-body p-0">${tableTrips(DB.trips.filter(t => t.fecha === today()))}</div>
      </div>
    `;
  } else if (currentUser.role === 'operador') {
    const misViajes = DB.trips.filter(t => t.operadorId === currentUser.id && t.fecha === today());
    el.innerHTML = `
      <h2 class="h4 mb-4 fw-bold">Mi panel · Operador</h2>
      <div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Tienes <strong>${misViajes.length}</strong> recorrido(s) asignado(s) para hoy.</div>
      ${tableTrips(misViajes, true)}
    `;
  } else if (currentUser.role === 'alumno' || currentUser.role === 'tutor') {
    const alumnoId = currentUser.role === 'tutor' ? currentUser.alumnoId : currentUser.id;
    const asg = DB.assignments.find(a => a.alumnoId === alumnoId);
    const route = asg ? getRoute(asg.routeId) : null;
    const trip = DB.trips.find(t => t.routeId === (asg?.routeId) && t.fecha === today());
    el.innerHTML = `
      <h2 class="h4 mb-4 fw-bold">Mi panel · ${currentUser.role === 'tutor' ? 'Padre/Tutor' : 'Alumno'}</h2>
      <div class="row g-3">
        <div class="col-md-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="text-muted">Mi ruta asignada</h6>
              <h4 class="fw-bold">${route ? route.nombre : 'Sin ruta asignada'}</h4>
              ${route ? `<p class="mb-1 small text-muted">${route.descripcion}</p>
                <p class="mb-0"><i class="bi bi-clock me-1"></i>${route.horarioSalida} → ${route.horarioLlegada}</p>` : ''}
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="text-muted">Estado del viaje de hoy</h6>
              <h4 class="fw-bold">${trip ? statusBadge(trip.estado) : 'Sin viaje programado'}</h4>
              ${trip && trip.estado === 'En proceso' ? '<p class="text-warning mb-0 mt-2"><i class="bi bi-broadcast me-1"></i>El transporte está en camino</p>' : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

function tableTrips(trips, compact = false) {
  if (!trips.length) return '<div class="empty-state p-4"><i class="bi bi-inbox"></i><p class="mt-2 mb-0">No hay viajes</p></div>';
  return `
    <div class="table-responsive">
      <table class="table table-hover mb-0 align-middle">
        <thead><tr>
          <th>Ruta</th><th>Vehículo</th><th>Operador</th><th>Estado</th><th>Confirmados</th>${compact ? '' : '<th>Acciones</th>'}
        </tr></thead>
        <tbody>
          ${trips.map(t => {
            const r = getRoute(t.routeId);
            const v = getVehicle(t.vehicleId);
            const o = getUser(t.operadorId);
            return `<tr>
              <td>${r?.nombre || '-'}</td>
              <td>${v?.economico || '-'} (${v?.placas || ''})</td>
              <td>${o?.name || '-'}</td>
              <td>${statusBadge(t.estado)}</td>
              <td>${t.confirmados.length} / ${v?.capacidad || '?'}</td>
              ${compact ? '' : `<td>
                ${t.estado === 'Programado' && currentUser.role === 'admin' ? `<button class="btn btn-sm btn-outline-primary btn-action" onclick="startTrip(${t.id})">Iniciar</button>` : ''}
                ${t.estado === 'En proceso' && currentUser.role === 'admin' ? `<button class="btn btn-sm btn-outline-success btn-action" onclick="endTrip(${t.id})">Finalizar</button>` : ''}
              </td>`}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderUsers(el) {
  el.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h4 fw-bold mb-0">Usuarios</h2>
      <button class="btn btn-primary btn-sm" onclick="showUserForm()"><i class="bi bi-plus-lg me-1"></i>Nuevo</button>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead><tr><th>ID</th><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Matrícula</th></tr></thead>
          <tbody>
            ${DB.users.map(u => `<tr>
              <td>${u.id}</td><td>${u.name}</td><td>${u.username}</td>
              <td><span class="badge bg-secondary">${u.role}</span></td>
              <td>${u.matricula || '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div id="user-form-area" class="mt-3"></div>
  `;
}

function showUserForm() {
  document.getElementById('user-form-area').innerHTML = `
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <h6 class="fw-bold">Registrar usuario (RF01)</h6>
        <div class="row g-2">
          <div class="col-md-3"><input class="form-control" id="nu-name" placeholder="Nombre completo"></div>
          <div class="col-md-2"><input class="form-control" id="nu-user" placeholder="Usuario"></div>
          <div class="col-md-2"><input class="form-control" id="nu-pass" placeholder="Contraseña" value="1234"></div>
          <div class="col-md-2">
            <select class="form-select" id="nu-role">
              <option value="alumno">Alumno</option>
              <option value="operador">Operador</option>
              <option value="tutor">Tutor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="col-md-2"><input class="form-control" id="nu-mat" placeholder="Matrícula (alumno)"></div>
          <div class="col-md-1"><button class="btn btn-success w-100" onclick="addUser()">OK</button></div>
        </div>
      </div>
    </div>`;
}

function addUser() {
  const name = document.getElementById('nu-name').value.trim();
  const username = document.getElementById('nu-user').value.trim();
  const password = document.getElementById('nu-pass').value;
  const role = document.getElementById('nu-role').value;
  const matricula = document.getElementById('nu-mat').value.trim() || null;
  if (!name || !username) return showToast('Completa nombre y usuario', 'warning');
  if (DB.users.some(u => u.username === username)) return showToast('Usuario ya existe', 'danger');
  DB.users.push({ id: DB.nextIds.user++, username, password, role, name, matricula });
  saveDB(DB);
  showToast('Usuario registrado', 'success');
  navigate('users');
}

function renderVehicles(el) {
  el.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h4 fw-bold mb-0">Vehículos</h2>
      <button class="btn btn-primary btn-sm" onclick="showVehicleForm()"><i class="bi bi-plus-lg me-1"></i>Nuevo</button>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead><tr><th>Económico</th><th>Placas</th><th>Capacidad</th><th>Estado</th></tr></thead>
          <tbody>
            ${DB.vehicles.map(v => `<tr>
              <td>${v.economico}</td><td>${v.placas}</td><td>${v.capacidad} pasajeros</td>
              <td>${v.activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div id="vehicle-form-area" class="mt-3"></div>
  `;
}

function showVehicleForm() {
  document.getElementById('vehicle-form-area').innerHTML = `
    <div class="card border-0 shadow-sm"><div class="card-body">
      <h6 class="fw-bold">Registrar vehículo</h6>
      <div class="row g-2">
        <div class="col-md-3"><input class="form-control" id="nv-eco" placeholder="Núm. económico (U-04)"></div>
        <div class="col-md-3"><input class="form-control" id="nv-pla" placeholder="Placas"></div>
        <div class="col-md-2"><input class="form-control" type="number" id="nv-cap" placeholder="Capacidad" value="25"></div>
        <div class="col-md-2"><button class="btn btn-success w-100" onclick="addVehicle()">Guardar</button></div>
      </div>
    </div></div>`;
}

function addVehicle() {
  const economico = document.getElementById('nv-eco').value.trim();
  const placas = document.getElementById('nv-pla').value.trim();
  const capacidad = parseInt(document.getElementById('nv-cap').value) || 25;
  if (!economico || !placas) return showToast('Completa los campos', 'warning');
  DB.vehicles.push({ id: DB.nextIds.vehicle++, placas, economico, capacidad, activo: true });
  saveDB(DB);
  showToast('Vehículo registrado', 'success');
  navigate('vehicles');
}

function renderRoutes(el) {
  el.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h4 fw-bold mb-0">Rutas</h2>
      <button class="btn btn-primary btn-sm" onclick="showRouteForm()"><i class="bi bi-plus-lg me-1"></i>Nueva ruta</button>
    </div>
    <div class="row g-3">
      ${DB.routes.map(r => `
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <h5 class="fw-bold">${r.nombre}</h5>
                ${r.activa ? '<span class="badge bg-success">Activa</span>' : '<span class="badge bg-secondary">Inactiva</span>'}
              </div>
              <p class="text-muted small">${r.descripcion}</p>
              <p class="mb-1"><i class="bi bi-clock me-1"></i>${r.horarioSalida} → ${r.horarioLlegada}</p>
              <p class="mb-0 small"><strong>Paradas:</strong> ${r.paradas.join(' → ')}</p>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div id="route-form-area" class="mt-3"></div>
  `;
}

function showRouteForm() {
  document.getElementById('route-form-area').innerHTML = `
    <div class="card border-0 shadow-sm"><div class="card-body">
      <h6 class="fw-bold">Nueva ruta (RN1 – solo administrador)</h6>
      <div class="row g-2">
        <div class="col-md-3"><input class="form-control" id="nr-nom" placeholder="Nombre"></div>
        <div class="col-md-3"><input class="form-control" id="nr-desc" placeholder="Descripción"></div>
        <div class="col-md-2"><input class="form-control" id="nr-sal" placeholder="Salida (06:30)"></div>
        <div class="col-md-2"><input class="form-control" id="nr-lle" placeholder="Llegada (07:15)"></div>
        <div class="col-md-2"><button class="btn btn-success w-100" onclick="addRoute()">Crear</button></div>
        <div class="col-12"><input class="form-control" id="nr-par" placeholder="Paradas separadas por coma"></div>
      </div>
    </div></div>`;
}

function addRoute() {
  const nombre = document.getElementById('nr-nom').value.trim();
  const descripcion = document.getElementById('nr-desc').value.trim();
  const horarioSalida = document.getElementById('nr-sal').value.trim() || '06:30';
  const horarioLlegada = document.getElementById('nr-lle').value.trim() || '07:15';
  const paradas = (document.getElementById('nr-par').value || 'Inicio, Campus').split(',').map(s => s.trim());
  if (!nombre) return showToast('Nombre requerido', 'warning');
  DB.routes.push({ id: DB.nextIds.route++, nombre, descripcion, paradas, horarioSalida, horarioLlegada, activa: true });
  saveDB(DB);
  showToast('Ruta creada', 'success');
  navigate('routes');
}

function renderTrips(el) {
  el.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h4 fw-bold mb-0">Viajes / Asignaciones</h2>
      <button class="btn btn-primary btn-sm" onclick="showTripForm()"><i class="bi bi-plus-lg me-1"></i>Programar viaje</button>
    </div>
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body p-0">${tableTrips(DB.trips)}</div>
    </div>
    <div id="trip-form-area"></div>
  `;
}

function showTripForm() {
  const rutas = DB.routes.filter(r => r.activa).map(r => `<option value="${r.id}">${r.nombre}</option>`).join('');
  const vehiculos = DB.vehicles.filter(v => v.activo).map(v => `<option value="${v.id}">${v.economico} (${v.capacidad})</option>`).join('');
  const operadores = DB.users.filter(u => u.role === 'operador').map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  document.getElementById('trip-form-area').innerHTML = `
    <div class="card border-0 shadow-sm"><div class="card-body">
      <h6 class="fw-bold">Programar viaje (RN3, RN4, RN7)</h6>
      <div class="row g-2">
        <div class="col-md-3"><select class="form-select" id="nt-route">${rutas}</select></div>
        <div class="col-md-3"><select class="form-select" id="nt-vehicle">${vehiculos}</select></div>
        <div class="col-md-3"><select class="form-select" id="nt-op">${operadores}</select></div>
        <div class="col-md-2"><input type="date" class="form-control" id="nt-fecha" value="${today()}"></div>
        <div class="col-md-1"><button class="btn btn-success w-100" onclick="addTrip()">OK</button></div>
      </div>
      <p class="small text-muted mt-2 mb-0">Se validan: operador y vehículo asignados (RN3), capacidad (RN4), no solapamiento de vehículo (RN7).</p>
    </div></div>`;
}

function addTrip() {
  const routeId = +document.getElementById('nt-route').value;
  const vehicleId = +document.getElementById('nt-vehicle').value;
  const operadorId = +document.getElementById('nt-op').value;
  const fecha = document.getElementById('nt-fecha').value;
  // RN7: vehículo no en dos recorridos simultáneos
  const conflicto = DB.trips.some(t => t.vehicleId === vehicleId && t.fecha === fecha && t.estado !== 'Finalizado' && t.estado !== 'Cancelado');
  if (conflicto) return showToast('RN7: El vehículo ya tiene un recorrido ese día', 'danger');
  DB.trips.push({
    id: DB.nextIds.trip++,
    routeId, vehicleId, operadorId, fecha,
    estado: 'Programado',
    horaInicio: null, horaFin: null,
    confirmados: [],
    incidencias: []
  });
  saveDB(DB);
  showToast('Viaje programado', 'success');
  navigate('trips');
}

function startTrip(id) {
  const t = getTrip(id);
  if (!t) return;
  // RN3
  if (!t.operadorId || !t.vehicleId) return showToast('RN3: Falta operador o vehículo', 'danger');
  t.estado = 'En proceso';
  t.horaInicio = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  // Notificar alumnos confirmados (RN6)
  t.confirmados.forEach(uid => notify(uid, `El recorrido de tu ruta ha iniciado (${t.horaInicio}).`, 'info'));
  // También tutores
  DB.users.filter(u => u.role === 'tutor' && t.confirmados.includes(u.alumnoId)).forEach(u => {
    notify(u.id, `El transporte de tu alumno ha iniciado el recorrido.`, 'info');
  });
  saveDB(DB);
  showToast('Viaje iniciado · Notificaciones enviadas (RN6)', 'success');
  navigate(currentUser.role === 'admin' ? 'trips' : 'mytrips');
}

function endTrip(id) {
  const t = getTrip(id);
  if (!t) return;
  t.estado = 'Finalizado';
  t.horaFin = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  saveDB(DB);
  showToast('Viaje finalizado y registrado en historial', 'success');
  navigate(currentUser.role === 'admin' ? 'trips' : 'mytrips');
}

function renderReports(el) {
  const finalizados = DB.trips.filter(t => t.estado === 'Finalizado');
  el.innerHTML = `
    <h2 class="h4 fw-bold mb-4">Reportes e historial</h2>
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white fw-semibold">Viajes finalizados (auditoría)</div>
      <div class="card-body p-0">
        ${finalizados.length ? `
          <table class="table mb-0 align-middle">
            <thead><tr><th>Fecha</th><th>Ruta</th><th>Inicio</th><th>Fin</th><th>Confirmados</th><th>Incidencias</th></tr></thead>
            <tbody>
              ${finalizados.map(t => {
                const r = getRoute(t.routeId);
                return `<tr>
                  <td>${t.fecha}</td><td>${r?.nombre}</td>
                  <td>${t.horaInicio || '—'}</td><td>${t.horaFin || '—'}</td>
                  <td>${t.confirmados.length}</td>
                  <td>${t.incidencias.length}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>` : '<div class="empty-state"><i class="bi bi-clipboard-data"></i><p class="mt-2">Aún no hay viajes finalizados</p></div>'}
      </div>
    </div>
  `;
}

function renderRules(el) {
  const rules = [
    { id: 'RN1', text: 'Solo el administrador puede crear, modificar o eliminar rutas y asignar alumnos u operadores.' },
    { id: 'RN2', text: 'Un alumno solo puede consultar su propia ruta, historial y avisos.' },
    { id: 'RN3', text: 'Una ruta debe tener un operador y un vehículo asignados para poder iniciar un recorrido.' },
    { id: 'RN4', text: 'No se pueden asignar más alumnos que la capacidad del vehículo.' },
    { id: 'RN5', text: 'Un viaje sigue el ciclo: Programado → En proceso → Finalizado → Archivado (o Cancelado).' },
    { id: 'RN6', text: 'Todo retraso, suspensión, cambio de ruta o incidencia genera una notificación a los alumnos afectados.' },
    { id: 'RN7', text: 'Un vehículo no puede estar asignado a dos recorridos simultáneos.' },
    { id: 'RN8', text: 'Todo usuario debe autenticarse y acceder solo a las funciones de su rol.' },
  ];
  el.innerHTML = `
    <h2 class="h4 fw-bold mb-4">Reglas de negocio</h2>
    <div class="list-group shadow-sm">
      ${rules.map(r => `
        <div class="list-group-item d-flex gap-3">
          <span class="badge bg-primary align-self-start">${r.id}</span>
          <span>${r.text}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================================
//  VISTAS · OPERADOR
// ============================================================
function renderMyTrips(el) {
  const mis = DB.trips.filter(t => t.operadorId === currentUser.id);
  el.innerHTML = `
    <h2 class="h4 fw-bold mb-4">Mis recorridos</h2>
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        ${mis.length ? `
          <table class="table table-hover mb-0 align-middle">
            <thead><tr><th>Fecha</th><th>Ruta</th><th>Vehículo</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              ${mis.map(t => {
                const r = getRoute(t.routeId);
                const v = getVehicle(t.vehicleId);
                return `<tr>
                  <td>${t.fecha}</td>
                  <td>${r?.nombre}</td>
                  <td>${v?.economico}</td>
                  <td>${statusBadge(t.estado)}</td>
                  <td>
                    ${t.estado === 'Programado' ? `<button class="btn btn-sm btn-primary" onclick="startTrip(${t.id})">Iniciar recorrido</button>` : ''}
                    ${t.estado === 'En proceso' ? `<button class="btn btn-sm btn-success" onclick="endTrip(${t.id})">Finalizar</button>` : ''}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>` : '<div class="empty-state"><i class="bi bi-bus-front"></i><p class="mt-2">No tienes recorridos asignados</p></div>'}
      </div>
    </div>
  `;
}

function renderBoarding(el) {
  const trip = DB.trips.find(t => t.operadorId === currentUser.id && t.fecha === today() && (t.estado === 'Programado' || t.estado === 'En proceso'));
  if (!trip) {
    el.innerHTML = `<h2 class="h4 fw-bold mb-4">Lista de abordaje</h2><div class="empty-state"><i class="bi bi-person-check"></i><p class="mt-2">No hay viaje activo hoy</p></div>`;
    return;
  }
  const route = getRoute(trip.routeId);
  const alumnosAsignados = DB.assignments
    .filter(a => a.routeId === trip.routeId)
    .map(a => getUser(a.alumnoId))
    .filter(Boolean);

  el.innerHTML = `
    <h2 class="h4 fw-bold mb-1">Lista de abordaje digital</h2>
    <p class="text-muted mb-4">${route?.nombre} · ${trip.fecha} · ${statusBadge(trip.estado)}</p>
    <div class="card border-0 shadow-sm">
      <ul class="list-group list-group-flush">
        ${alumnosAsignados.map(a => {
          const conf = trip.confirmados.includes(a.id);
          return `<li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>${a.name}</strong>
              <span class="text-muted small ms-2">${a.matricula || ''}</span>
            </div>
            <span class="badge ${conf ? 'bg-success' : 'bg-secondary'}">${conf ? 'Confirmado' : 'Pendiente'}</span>
          </li>`;
        }).join('') || '<li class="list-group-item text-muted">Sin alumnos asignados a esta ruta</li>'}
      </ul>
    </div>
  `;
}

function renderIncidents(el) {
  const trip = DB.trips.find(t => t.operadorId === currentUser.id && t.estado === 'En proceso');
  el.innerHTML = `
    <h2 class="h4 fw-bold mb-4">Reportar incidencia (RN6)</h2>
    ${trip ? `
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <p>Viaje en proceso: <strong>${getRoute(trip.routeId)?.nombre}</strong></p>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-warning" onclick="reportIncident(${trip.id}, 'Tráfico pesado')"><i class="bi bi-sign-railroad me-1"></i>Tráfico pesado</button>
            <button class="btn btn-danger" onclick="reportIncident(${trip.id}, 'Falla mecánica')"><i class="bi bi-tools me-1"></i>Falla mecánica</button>
            <button class="btn btn-dark" onclick="reportIncident(${trip.id}, 'Accidente')"><i class="bi bi-exclamation-octagon me-1"></i>Accidente</button>
            <button class="btn btn-secondary" onclick="reportIncident(${trip.id}, 'Retraso general')"><i class="bi bi-clock-history me-1"></i>Retraso</button>
          </div>
        </div>
      </div>
    ` : `<div class="alert alert-secondary">No tienes un viaje <em>En proceso</em>. Inicia un recorrido primero.</div>`}
  `;
}

function reportIncident(tripId, tipo) {
  const t = getTrip(tripId);
  if (!t) return;
  t.incidencias.push({ tipo, hora: new Date().toLocaleTimeString('es-MX'), operadorId: currentUser.id });
  // RN6: notificar a alumnos confirmados y tutores
  t.confirmados.forEach(uid => {
    notify(uid, `⚠️ Incidencia en tu ruta: ${tipo}. El operador ha reportado el evento.`, 'warning');
  });
  DB.users.filter(u => u.role === 'tutor' && t.confirmados.includes(u.alumnoId)).forEach(u => {
    notify(u.id, `⚠️ Incidencia en el transporte de tu alumno: ${tipo}.`, 'warning');
  });
  saveDB(DB);
  showToast(`Incidencia "${tipo}" reportada y notificada (RN6)`, 'warning');
  navigate('incidents');
}

// ============================================================
//  VISTAS · ALUMNO / TUTOR
// ============================================================
function renderMyRoute(el) {
  const alumnoId = currentUser.role === 'tutor' ? currentUser.alumnoId : currentUser.id;
  const asg = DB.assignments.find(a => a.alumnoId === alumnoId);
  const route = asg ? getRoute(asg.routeId) : null;
  el.innerHTML = `
    <h2 class="h4 fw-bold mb-4">${currentUser.role === 'tutor' ? 'Ruta del alumno' : 'Mi ruta'}</h2>
    ${route ? `
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <h3 class="fw-bold">${route.nombre}</h3>
          <p class="text-muted">${route.descripcion}</p>
          <hr>
          <p><i class="bi bi-clock me-2"></i><strong>Horario:</strong> ${route.horarioSalida} → ${route.horarioLlegada}</p>
          <p class="mb-0"><i class="bi bi-geo-alt me-2"></i><strong>Paradas:</strong></p>
          <ol class="mt-2">
            ${route.paradas.map(p => `<li>${p}</li>`).join('')}
          </ol>
        </div>
      </div>
    ` : `<div class="empty-state"><i class="bi bi-signpost"></i><p class="mt-2">No tienes ruta asignada todavía</p></div>`}
  `;
}

function renderConfirm(el) {
  const asg = DB.assignments.find(a => a.alumnoId === currentUser.id);
  const trip = asg ? DB.trips.find(t => t.routeId === asg.routeId && t.fecha === today()) : null;
  const vehicle = trip ? getVehicle(trip.vehicleId) : null;
  const yaConfirmado = trip && trip.confirmados.includes(currentUser.id);

  el.innerHTML = `
    <h2 class="h4 fw-bold mb-4">Confirmar uso del servicio</h2>
    ${trip ? `
      <div class="card border-0 shadow-sm">
        <div class="card-body text-center py-5">
          <h5>${getRoute(trip.routeId)?.nombre}</h5>
          <p class="text-muted">Estado: ${statusBadge(trip.estado)}</p>
          <p>Confirmados: <strong>${trip.confirmados.length}</strong> / ${vehicle?.capacidad || '?'}</p>
          ${yaConfirmado
            ? `<div class="alert alert-success d-inline-block"><i class="bi bi-check-circle me-2"></i>Ya confirmaste tu lugar</div>`
            : `<button class="btn btn-primary btn-lg" onclick="confirmTrip(${trip.id})">
                 <i class="bi bi-check2-circle me-2"></i>Confirmar que usaré el servicio
               </button>`}
        </div>
      </div>
    ` : `<div class="empty-state"><i class="bi bi-calendar-x"></i><p class="mt-2">No hay viaje programado para hoy en tu ruta</p></div>`}
  `;
}

function confirmTrip(tripId) {
  const t = getTrip(tripId);
  if (!t) return;
  const v = getVehicle(t.vehicleId);
  // RN4: capacidad
  if (t.confirmados.length >= (v?.capacidad || 999)) {
    return showToast('RN4: El vehículo ya alcanzó su capacidad máxima', 'danger');
  }
  if (!t.confirmados.includes(currentUser.id)) {
    t.confirmados.push(currentUser.id);
    saveDB(DB);
    showToast('Lugar confirmado correctamente', 'success');
  }
  navigate('confirm');
}

function renderNotifs(el) {
  const notifs = DB.notifications.filter(n => n.userId === currentUser.id);
  // Marcar como leídas
  notifs.forEach(n => n.leida = true);
  saveDB(DB);

  el.innerHTML = `
    <h2 class="h4 fw-bold mb-4">Notificaciones</h2>
    ${notifs.length ? notifs.map(n => `
      <div class="notification-item ${n.leida ? '' : 'unread'}">
        <div class="d-flex justify-content-between">
          <span>${n.mensaje}</span>
          <small class="text-muted ms-3 text-nowrap">${new Date(n.fecha).toLocaleString('es-MX')}</small>
        </div>
      </div>
    `).join('') : `<div class="empty-state"><i class="bi bi-bell-slash"></i><p class="mt-2">No tienes notificaciones</p></div>`}
  `;
}

function renderLocation(el) {
  // Simulación de GPS (opcional según documentación)
  const alumnoId = currentUser.alumnoId;
  const asg = DB.assignments.find(a => a.alumnoId === alumnoId);
  const trip = asg ? DB.trips.find(t => t.routeId === asg.routeId && t.fecha === today()) : null;
  const route = asg ? getRoute(asg.routeId) : null;

  el.innerHTML = `
    <h2 class="h4 fw-bold mb-4">Ubicación del transporte (GPS opcional)</h2>
    <div class="card border-0 shadow-sm">
      <div class="card-body text-center py-5">
        ${trip && trip.estado === 'En proceso' ? `
          <div class="mb-3">
            <i class="bi bi-geo-alt-fill text-danger" style="font-size: 3rem;"></i>
          </div>
          <h5 class="fw-bold">Última ubicación conocida</h5>
          <p class="text-muted mb-1">Ruta: ${route?.nombre}</p>
          <p class="mb-1"><strong>Parada aproximada:</strong> ${route?.paradas[1] || route?.paradas[0] || 'En ruta'}</p>
          <p class="small text-muted">Actualizado: ${new Date().toLocaleTimeString('es-MX')} (simulado)</p>
          <div class="alert alert-info d-inline-block mt-3 mb-0">
            <i class="bi bi-info-circle me-1"></i>
            En producción se integraría un proveedor real de mapas/GPS.
          </div>
        ` : `
          <div class="empty-state">
            <i class="bi bi-geo"></i>
            <p class="mt-2 mb-0">El transporte no está en recorrido en este momento<br>
            <small class="text-muted">Estado actual: ${trip ? trip.estado : 'Sin viaje'}</small></p>
          </div>
        `}
      </div>
    </div>
  `;
}

// ============================================================
//  CÓDIGOS QR · Generación y Escaneo
// ============================================================

let html5QrCode = null;

/** Payload del QR del alumno: TE|alumnoId|matricula|timestamp */
function buildStudentQrPayload(user) {
  return `TE|${user.id}|${user.matricula || 'SIN-MAT'}|${Date.now()}`;
}

function parseStudentQr(text) {
  const parts = (text || '').trim().split('|');
  if (parts.length < 3 || parts[0] !== 'TE') return null;
  return { alumnoId: parseInt(parts[1], 10), matricula: parts[2] };
}

/** Vista: Mi código QR (Alumno) */
function renderMyQr(el) {
  const payload = buildStudentQrPayload(currentUser);
  el.innerHTML = `
    <h2 class="h4 fw-bold mb-2">Mi código QR de abordaje</h2>
    <p class="text-muted mb-4">Muestra este código al operador al subir al transporte. El operador lo escanea con la cámara del celular.</p>
    <div class="text-center">
      <div class="qr-display mx-auto" id="my-qr-box"></div>
      <p class="mt-3 mb-1 fw-semibold">${currentUser.name}</p>
      <p class="text-muted small">Matrícula: ${currentUser.matricula || '—'} · ID: ${currentUser.id}</p>
      <p class="small text-muted mt-2"><code class="user-select-all">${payload}</code></p>
      <div class="alert alert-info d-inline-block mt-3 text-start">
        <strong>Cómo demostrar que funciona:</strong><br>
        1. Entra como <code>alumno1</code> y abre esta pantalla.<br>
        2. En otro dispositivo (o pestaña) entra como <code>operador1</code> → <strong>Escanear QR</strong>.<br>
        3. Apunta la cámara al código (o usa “Simular escaneo” abajo).
      </div>
      <div class="mt-3">
        <button class="btn btn-outline-secondary btn-sm" onclick="downloadMyQr()">
          <i class="bi bi-download me-1"></i>Descargar QR
        </button>
      </div>
    </div>
  `;
  // Generar QR
  const box = document.getElementById('my-qr-box');
  box.innerHTML = '';
  new QRCode(box, {
    text: payload,
    width: 220,
    height: 220,
    colorDark: '#0d6efd',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
}

function downloadMyQr() {
  const canvas = document.querySelector('#my-qr-box canvas');
  const img = document.querySelector('#my-qr-box img');
  const src = canvas ? canvas.toDataURL('image/png') : (img ? img.src : null);
  if (!src) return showToast('No se pudo generar la imagen', 'warning');
  const a = document.createElement('a');
  a.href = src;
  a.download = `QR_${currentUser.matricula || currentUser.id}.png`;
  a.click();
}

/** Vista: Escanear QR (Operador) */
function renderQrScan(el) {
  const trip = DB.trips.find(t =>
    t.operadorId === currentUser.id &&
    t.fecha === today() &&
    (t.estado === 'Programado' || t.estado === 'En proceso')
  );

  el.innerHTML = `
    <h2 class="h4 fw-bold mb-2">Escanear QR de abordaje</h2>
    <p class="text-muted mb-3">Usa la cámara del dispositivo para validar el acceso del alumno (lista digital).</p>
    ${trip
      ? `<div class="alert alert-success py-2"><i class="bi bi-bus-front me-1"></i> Viaje activo: <strong>${getRoute(trip.routeId)?.nombre}</strong> · ${statusBadge(trip.estado)} · Confirmados: ${trip.confirmados.length}</div>`
      : `<div class="alert alert-warning py-2">No hay viaje Programado/En proceso asignado a ti hoy. Aun así puedes probar el escáner.</div>`
    }
    <div class="d-grid gap-2 d-sm-flex mb-3">
      <button class="btn btn-primary btn-lg" onclick="openQrScanner()">
        <i class="bi bi-camera me-2"></i>Abrir cámara y escanear
      </button>
      <button class="btn btn-outline-secondary" onclick="simulateQrScan()">
        <i class="bi bi-magic me-1"></i>Simular escaneo (alumno1)
      </button>
    </div>
    <div id="last-scan-result"></div>
    <div class="card border-0 shadow-sm mt-3">
      <div class="card-header bg-white fw-semibold small">Últimos abordajes por QR (hoy)</div>
      <ul class="list-group list-group-flush" id="qr-log-list">
        ${(trip?.confirmados || []).map(uid => {
          const u = getUser(uid);
          return `<li class="list-group-item d-flex justify-content-between">
            <span>${u?.name || uid}</span>
            <span class="badge bg-success">Confirmado</span>
          </li>`;
        }).join('') || '<li class="list-group-item text-muted">Aún no hay registros</li>'}
      </ul>
    </div>
  `;
}

function openQrScanner() {
  const modal = new bootstrap.Modal(document.getElementById('qrModal'));
  document.getElementById('qr-status').textContent = 'Iniciando cámara…';
  document.getElementById('qr-result').classList.add('d-none');
  modal.show();

  // Esperar a que el modal esté visible
  setTimeout(() => {
    if (html5QrCode) {
      stopQrScanner();
    }
    html5QrCode = new Html5Qrcode('qr-reader');
    const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      onQrSuccess,
      () => {} // ignore scan errors frame by frame
    ).then(() => {
      document.getElementById('qr-status').textContent = 'Apunta al código QR del alumno';
    }).catch(err => {
      document.getElementById('qr-status').textContent = 'No se pudo acceder a la cámara: ' + (err?.message || err);
      // Fallback: intentar cámara frontal
      html5QrCode.start(
        { facingMode: 'user' },
        config,
        onQrSuccess,
        () => {}
      ).catch(e2 => {
        document.getElementById('qr-status').innerHTML = `
          <span class="text-danger">Cámara no disponible en este dispositivo/navegador.</span><br>
          <small>En Android usa Chrome y concede permiso de cámara. Mientras tanto usa «Simular escaneo».</small>`;
      });
    });
  }, 400);
}

function onQrSuccess(decodedText) {
  // Evitar múltiples lecturas seguidas
  stopQrScanner();
  bootstrap.Modal.getInstance(document.getElementById('qrModal'))?.hide();
  processScannedQr(decodedText);
}

function stopQrScanner() {
  if (html5QrCode) {
    try {
      html5QrCode.stop().then(() => {
        html5QrCode.clear();
        html5QrCode = null;
      }).catch(() => { html5QrCode = null; });
    } catch (_) {
      html5QrCode = null;
    }
  }
  const reader = document.getElementById('qr-reader');
  if (reader) reader.innerHTML = '';
}

function simulateQrScan() {
  // Simula el QR de alumno1 (id=3, matrícula 23240020)
  const alumno = getUser(3);
  if (!alumno) return showToast('Alumno de prueba no encontrado', 'danger');
  const payload = buildStudentQrPayload(alumno);
  processScannedQr(payload);
}

function processScannedQr(text) {
  const data = parseStudentQr(text);
  const resultBox = document.getElementById('last-scan-result');

  if (!data) {
    showToast('Código QR no válido para este sistema', 'danger');
    if (resultBox) {
      resultBox.innerHTML = `<div class="alert alert-danger"><i class="bi bi-x-circle me-2"></i>QR no reconocido: <code>${escapeHtml(text)}</code></div>`;
    }
    return;
  }

  const alumno = getUser(data.alumnoId);
  if (!alumno || alumno.role !== 'alumno') {
    showToast('Alumno no registrado', 'danger');
    if (resultBox) resultBox.innerHTML = `<div class="alert alert-danger">Usuario ID ${data.alumnoId} no es un alumno válido.</div>`;
    return;
  }

  // Buscar viaje del operador hoy
  let trip = DB.trips.find(t =>
    t.operadorId === currentUser.id &&
    t.fecha === today() &&
    (t.estado === 'Programado' || t.estado === 'En proceso')
  );

  // Si no hay viaje del operador, intentar el de la ruta del alumno
  if (!trip) {
    const asg = DB.assignments.find(a => a.alumnoId === alumno.id);
    if (asg) {
      trip = DB.trips.find(t => t.routeId === asg.routeId && t.fecha === today() && t.estado !== 'Finalizado' && t.estado !== 'Cancelado');
    }
  }

  if (!trip) {
    showToast(`${alumno.name} identificado, pero no hay viaje activo`, 'warning');
    if (resultBox) {
      resultBox.innerHTML = `
        <div class="alert alert-warning">
          <strong>${alumno.name}</strong> (${alumno.matricula}) identificado.<br>
          No hay un viaje Programado/En proceso para registrar el abordaje.
        </div>`;
    }
    return;
  }

  // Validar que el alumno pertenece a la ruta del viaje
  const asg = DB.assignments.find(a => a.alumnoId === alumno.id && a.routeId === trip.routeId);
  if (!asg) {
    showToast('El alumno no está asignado a esta ruta', 'danger');
    if (resultBox) {
      resultBox.innerHTML = `<div class="alert alert-danger"><strong>${alumno.name}</strong> no está asignado a la ruta de este viaje.</div>`;
    }
    return;
  }

  // RN4 capacidad
  const vehicle = getVehicle(trip.vehicleId);
  if (!trip.confirmados.includes(alumno.id) && trip.confirmados.length >= (vehicle?.capacidad || 999)) {
    showToast('RN4: Vehículo lleno', 'danger');
    if (resultBox) resultBox.innerHTML = `<div class="alert alert-danger">Capacidad máxima alcanzada.</div>`;
    return;
  }

  const yaEstaba = trip.confirmados.includes(alumno.id);
  if (!yaEstaba) {
    trip.confirmados.push(alumno.id);
    notify(alumno.id, `Abordaje registrado por QR a las ${new Date().toLocaleTimeString('es-MX')}.`, 'success');
    // Notificar tutor
    DB.users.filter(u => u.role === 'tutor' && u.alumnoId === alumno.id).forEach(u => {
      notify(u.id, `${alumno.name} abordó el transporte (registro por QR).`, 'info');
    });
    saveDB(DB);
  }

  showToast(yaEstaba ? `${alumno.name} ya estaba confirmado` : `✓ ${alumno.name} registrado por QR`, yaEstaba ? 'info' : 'success');

  if (resultBox) {
    resultBox.innerHTML = `
      <div class="alert alert-${yaEstaba ? 'info' : 'success'}">
        <div class="d-flex align-items-center gap-3">
          <i class="bi bi-${yaEstaba ? 'info-circle' : 'check-circle'} fs-2"></i>
          <div>
            <strong>${alumno.name}</strong> · ${alumno.matricula}<br>
            <small>${yaEstaba ? 'Ya estaba en la lista de abordaje' : 'Abordaje registrado correctamente por QR'}</small><br>
            <small class="text-muted">Ruta: ${getRoute(trip.routeId)?.nombre} · Confirmados: ${trip.confirmados.length}/${vehicle?.capacidad || '?'}</small>
          </div>
        </div>
      </div>`;
  }

  // Refrescar lista si estamos en la vista
  if (document.getElementById('qr-log-list')) {
    navigate('qrscan');
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ---------- INIT ----------
document.getElementById('login-form').addEventListener('submit', login);

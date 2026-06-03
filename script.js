/* =====================
   ESTADO GLOBAL
===================== */
let usuario = null;
let visitante = false;
let servidorActivo = false;
let jugadores = 0;
let xp = 0;
let inventario = [];
let timerInterval = null;
let timerSegundos = 0;
let chatBotInterval = null;
let nombreServidor = "";
let direccionServidor = "";


/* =====================
   MODO CLARO / OSCURO
===================== */
function toggleTheme() {
  const esClaro = document.body.classList.toggle('light');
  document.getElementById('themeToggle').textContent = esClaro ? '☀️' : '🌙';
  localStorage.setItem('tema', esClaro ? 'light' : 'dark');
}

function cargarTema() {
  const tema = localStorage.getItem('tema');
  if (tema === 'light') {
    document.body.classList.add('light');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = '☀️';
  }
}
/* =====================
   PANTALLA DE CARGA
===================== */
const BLOQUES = [
  { color: '#5d8a3c', label: 'Hierba' },
  { color: '#8B6914', label: 'Madera' },
  { color: '#7a7a7a', label: 'Piedra' },
  { color: '#4ade80', label: 'Diamante' },
  { color: '#c8a400', label: 'Oro' },
  { color: '#c84b00', label: 'Netherrack' },
];

const MENSAJES_CARGA = [
  'Entrando a la web ',
  'Invocando mobs...',
  'Cosas malvadas',
  'Construyendo spawn...',
  'Cargando inventario...',
  'Conectando al servidor...',
  'Listo para el caos!',
];

function iniciarPantallaCarga(callback) {
  const screen   = document.getElementById('loadingScreen');
  const bar      = document.getElementById('loadingBar');
  const percent  = document.getElementById('loadingPercent');
  const sub      = document.querySelector('.loading-sub');
  const blocksEl = document.getElementById('loadingBlocks');

  blocksEl.innerHTML = '';
  BLOQUES.forEach((b, i) => {
    const div = document.createElement('div');
    div.className = 'loading-block';
    div.style.background = b.color;
    div.style.animationDelay = (i * 0.12) + 's';
    div.title = b.label;
    blocksEl.appendChild(div);
  });

  let progreso = 0;
  let msgIndex = 0;

  const intervalo = setInterval(() => {
    const incremento = progreso < 60
      ? (Math.random() * 6 + 2)
      : (Math.random() * 3 + 1);
    progreso = Math.min(progreso + incremento, 100);

    bar.style.width = progreso + '%';
    percent.textContent = Math.floor(progreso) + '%';

    const nuevoIdx = Math.min(Math.floor(progreso / 14), MENSAJES_CARGA.length - 1);
    if (nuevoIdx !== msgIndex) {
      msgIndex = nuevoIdx;
      sub.textContent = MENSAJES_CARGA[msgIndex];
    }

    if (progreso >= 100) {
      clearInterval(intervalo);
      percent.textContent = '100%';
      sub.textContent = MENSAJES_CARGA[MENSAJES_CARGA.length - 1];
      setTimeout(() => {
        screen.classList.add('hide');
        if (callback) callback();
      }, 600);
    }
  }, 60);
}

/* =====================
   PARTÍCULAS DECORATIVAS
===================== */
function crearParticulas() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    p.style.width = p.style.height = (3 + Math.random() * 4) + 'px';
    container.appendChild(p);
  }
}
crearParticulas();

/* =====================
   HAMBURGER MENU
===================== */
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('menu').classList.toggle('open');
});
/* =====================
   SESIÓN PERSISTENTE (localStorage)
===================== */
function cargarSesion() {
  const sesion = localStorage.getItem('sesion_activa');
  if (sesion) {
    try {
      usuario = JSON.parse(sesion);
      entrarUsuario(false); // entra sin limpiar campos
    } catch {
      localStorage.removeItem('sesion_activa');
    }
  }
}

function guardarSesion() {
  if (usuario) {
    // Guardamos sin la contraseña en la sesión activa
    localStorage.setItem('sesion_activa', JSON.stringify({
      user: usuario.user,
      email: usuario.email,
      foto: usuario.foto || ''
    }));
  }
}

function cerrarSesion() {
  localStorage.removeItem('sesion_activa');
  usuario = null;
  visitante = false;
}
/* =====================
   VALIDACIONES
===================== */
function clearErrors() {
  document.querySelectorAll('.input-error').forEach(el => el.textContent = '');
  document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('invalid'));
}

function showError(fieldId, errId, msg) {
  const field = document.getElementById(fieldId);
  const err = document.getElementById(errId);
  if (field) field.classList.add('invalid');
  if (err) err.textContent = msg;
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =====================
   PANTALLAS: REGISTRO / LOGIN
===================== */
function abrirRegistro() {
  document.getElementById('home').style.display = 'none';
  document.getElementById('registro').style.display = 'flex';
}

function abrirLogin() {
  document.getElementById('home').style.display = 'none';
  document.getElementById('login').style.display = 'flex';
}

function volver() {
  clearErrors();
  document.getElementById('registro').style.display = 'none';
  document.getElementById('login').style.display = 'none';
  document.getElementById('home').style.display = 'flex';
}

/* =====================
   REGISTRAR (con backend)
===================== */
async function registrar() {
  clearErrors();
  const user = document.getElementById('regUser').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;

  let valid = true;

  if (!user || user.length < 3) {
    showError('regUser', 'err-regUser', 'Mínimo 3 caracteres');
    valid = false;
  }
  if (!validarEmail(email)) {
    showError('regEmail', 'err-regEmail', 'Correo no válido');
    valid = false;
  }
  if (pass.length < 6) {
    showError('regPass', 'err-regPass', 'Mínimo 6 caracteres');
    valid = false;
  }
  if (pass !== pass2) {
    showError('regPass2', 'err-regPass2', 'Las contraseñas no coinciden');
    valid = false;
  }

  if (!valid) return;

  const respuesta = await fetch("registrar.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, email, pass })
  });

  const resultado = await respuesta.json();

  if (resultado.status === "ok") {
    mostrarToast("Usuario registrado correctamente", "success");
    usuario = { user, email };
    guardarSesion();
    entrarUsuario(true);
  } else {
    mostrarToast("Error: " + resultado.msg, "warn");
  }
}

/* =====================
   LOGIN
===================== */
async function loginFn() {
  clearErrors();
  const email = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;

  let valid = true;
  if (!email) { showError('loginUser', 'err-loginUser', 'Introduce tu correo'); valid = false; }
  if (!pass) { showError('loginPass', 'err-loginPass', 'Introduce tu contraseña'); valid = false; }
  if (!valid) return;

  const respuesta = await fetch("login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, pass })
  });

  const resultado = await respuesta.json();

  if (resultado.status === "ok") {
    usuario = { user: resultado.user, email };
    guardarSesion();
    entrarUsuario(true);
  } else {
    showError('loginPass', 'err-loginPass', resultado.msg);
  }
}

/* =====================
   ENTRAR COMO USUARIO
===================== */
function entrarUsuario(limpiar = true) {
  if (limpiar) {
    ['regUser','regEmail','regPass','regPass2','loginUser','loginPass'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    clearErrors();
  }

  document.getElementById('registro').style.display = 'none';
  document.getElementById('login').style.display = 'none';
  document.getElementById('home').style.display = 'none';

  mostrarMenu();

  document.getElementById('profileUser').innerHTML = '<span>Usuario:</span> ' + usuario.user;
  document.getElementById('profileEmail').innerHTML = '<span>Correo:</span> ' + usuario.email;

  if (usuario.foto) {
    document.getElementById('profileImg').src = usuario.foto;
  }

  showSection('intro');
}

/* =====================
   ENTRAR COMO VISITANTE
===================== */
function entrarVisitante() {
  visitante = true;
  document.getElementById('home').style.display = 'none';
  mostrarMenu();
  showSection('intro');
}

/* =====================
   MENÚ
===================== */
function mostrarMenu() {
  const menu = document.getElementById('menu');
  menu.style.display = 'flex';
  menu.classList.add('menu-visible');
}

/* =====================
   MOSTRAR SECCIÓN
===================== */
function showSection(id) {
  if (visitante && id !== 'intro') {
    mostrarToast('Debes registrarte para acceder a esta sección', 'warn');
    return;
  }

  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'block';
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (id === 'chat') iniciarChatBots();
  if (id === 'server') cargarServidoresExistentes();

  document.getElementById('menu').classList.remove('open');
}

/* =====================
   SUBIR IMAGEN PERFIL
===================== */
function subirImagen(event) {
  const reader = new FileReader();
  reader.onload = function () {
    const img = document.getElementById('profileImg');
    img.src = reader.result;

    if (usuario) {
      usuario.foto = reader.result;
      guardarSesion();
      const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
      const idx = usuarios.findIndex(u => u.user === usuario.user);
      if (idx !== -1) {
        usuarios[idx].foto = reader.result;
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
      }
    }
  };
  reader.readAsDataURL(event.target.files[0]);
}

/* =====================
   VOLVER AL INICIO
===================== */
function volverInicio() {
  cerrarSesion();
  pararServidor();
  detenerChatBots();
  jugadores = 0;
  xp = 0;
  inventario = [];

  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById('registro').style.display = 'none';
  document.getElementById('login').style.display = 'none';
  const menu = document.getElementById('menu');
  menu.style.display = 'none';
  menu.classList.remove('menu-visible', 'open');
  visitante = false;

  document.getElementById('home').style.display = 'flex';
}

/* =====================
   CARGAR SERVIDORES EXISTENTES
===================== */
function cargarServidoresExistentes() {
  fetch("http://192.168.15.152/orden.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion: "listarServidores", usuario: usuario?.user })
  })
  .then(r => r.json())
  .then(data => {
    const select = document.getElementById('servidorExistente');
    if (!select) return;

    select.innerHTML = '<option value="">-- Selecciona servidor --</option>';

    if (data.status === "ok" && Array.isArray(data.servidores) && data.servidores.length > 0) {
      data.servidores.forEach(srv => {
        const opt = document.createElement('option');
        const nombre  = typeof srv === 'string' ? srv : srv.nombre;
        const version = typeof srv === 'object' ? srv.version : '';
        const tipo    = typeof srv === 'object' ? srv.tipo    : '';

        opt.value = nombre;
        opt.textContent = version && tipo
          ? `${nombre} (${version} · ${tipo})`
          : nombre;

        if (version) opt.dataset.version = version;
        if (tipo)    opt.dataset.tipo    = tipo;

        select.appendChild(opt);
      });
    } else if (data.status !== "ok") {
      mostrarToast('No se pudieron cargar los servidores: ' + (data.msg || ''), 'warn');
    }
  })
  .catch(err => {
    console.error('Error listando servidores:', err);
    mostrarToast('Error de conexión al listar servidores', 'error');
  });
}

/* =====================
   CARGAR SERVIDOR SELECCIONADO
===================== */
function cargarServidor() {
  const select = document.getElementById('servidorExistente');
  const nombre = select?.value;

  if (!nombre) {
    mostrarToast('Selecciona un servidor de la lista', 'warn');
    return;
  }

  nombreServidor = nombre;

  cargarModsInstalados(nombre);

  mostrarToast(`Servidor "${nombre}" cargado. Pulsa ▶ Arrancar para iniciarlo.`, 'success');
}

/* =====================
   CARGAR MODS INSTALADOS
===================== */
function cargarModsInstalados(nombre) {
  fetch("http://192.168.15.152/orden.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accion: "obtenerMods",
      nombre: nombre,
      usuario: usuario?.user
    })
  })
  .then(r => r.json())
  .then(data => {
    document.querySelectorAll('.selectable-mod').forEach(card => {
      card.classList.remove('selected');
    });

    if (data.status === "ok" && Array.isArray(data.mods)) {
      data.mods.forEach(mod => {
        const card = document.querySelector(`.selectable-mod[data-mod="${mod}"]`);
        if (card) card.classList.add('selected');
      });

      const statusEl = document.getElementById('modsStatus');
      if (statusEl) {
        statusEl.textContent = data.mods.length > 0
          ? `✅ ${data.mods.length} mod(s) instalado(s): ${data.mods.join(', ')}`
          : 'Sin mods instalados';
      }
    }
  })
  .catch(err => {
    console.error('Error cargando mods:', err);
    mostrarToast('No se pudieron cargar los mods del servidor', 'warn');
  });
}
/* =====================
   CREAR SERVIDOR
===================== */
function crearServidor() {
  const nombre = document.getElementById('serverName').value.trim();
  const version = document.getElementById('serverVersion').value;
  const tipo = document.getElementById('serverType').value;

  if (!nombre) {
    mostrarToast('Escribe un nombre para el servidor', 'warn');
    return;
  }
  if (!version) {
    mostrarToast('Selecciona una versión de Minecraft', 'warn');
    return;
  }
  if (!tipo) {
    mostrarToast('Selecciona un tipo de servidor (Vanilla o Forge)', 'warn');
    return;
  }

  fetch("http://192.168.15.152/orden.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accion: "crearServidor",
      nombre: nombre,
      version: version,
      tipo: tipo,
      usuario: usuario?.user
    })
  })
  .then(r => r.json())
  .then(d => {
    console.log(d);
    if (d.status === "ok") {
      nombreServidor = nombre;
      direccionServidor = d.conexion;
	document.getElementById("nombreServidorInfo").textContent = nombre;
 	document.getElementById("direccionServidor").textContent = d.conexion;
  	document.getElementById("conexionServidor").style.display = "block";

      mostrarToast(
        `Servidor "${nombre}" (${version}, ${tipo}) creado\nConéctate con: ${d.conexion}`,
        'success'
      );
    } else {
      mostrarToast(`Error: ${d.msg}`, 'error');
    }
  })
  .catch(err => {
    console.error(err);
    mostrarToast('Error de conexión con el servidor', 'error');
  });
}

/* =====================
   PARAR SERVIDOR
===================== */
function pararServidor() {
  fetch("http://192.168.15.152/orden.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accion: "pararServidor",
      nombre: nombreServidor,
      usuario: usuario?.user
    })
  })
  .then(r => r.json())
  .then(data => {
    if (data.status === "ok") {
      servidorActivo = false;
      jugadores = 0;
      clearInterval(timerInterval);
      timerInterval = null;
      timerSegundos = 0;
      document.getElementById("conexionServidor").style.display = "none";

      const estadoEl = document.getElementById('estadoServidor');
      const dotEl = document.getElementById('statusDot');
      const timerEl = document.getElementById('timerDisplay');
      const jugadoresEl = document.getElementById('jugadoresOnline');

      if (estadoEl) estadoEl.textContent = 'Apagado';
      if (dotEl) dotEl.classList.remove('on');
      if (timerEl) timerEl.textContent = '00:00:00';
      if (jugadoresEl) jugadoresEl.textContent = '0';

      mostrarToast("Servidor parado correctamente", "success");
    } else {
      mostrarToast("Error al parar servidor: " + data.msg, "error");
    }
  })
  .catch(err => {
    console.error(err);
    mostrarToast("Error de conexión con el backend", "error");
  });
}
/* =====================
   ARRANCAR SERVIDOR
===================== */
function arrancarServidor(nombre) {
  fetch("http://192.168.15.152/orden.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accion: "arrancarServidor",
      nombre: nombre,
      usuario: usuario?.user
    })
  })
  .then(r => r.json())
  .then(data => {
    console.log("Respuesta arrancar:", data);
    if (data.status === "ok") {
      servidorActivo = true;
      document.getElementById('estadoServidor').textContent = 'Encendido';
      document.getElementById('statusDot').classList.add('on');
      document.getElementById("conexionServidor").style.display = "block";

      document.getElementById("nombreServidorInfo").textContent = nombreServidor;

document.getElementById("direccionServidor").textContent =
    direccionServidor;

	mostrarToast(
  `Servidor arrancado\n${direccionServidor}`,
  "success"
	);

      timerSegundos = 0;
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        timerSegundos++;
        document.getElementById('timerDisplay').textContent = formatTimer(timerSegundos);
      }, 1000);

    } else {
      mostrarToast("Error al arrancar servidor: " + data.msg, "error");
    }
  })
  .catch(err => {
    console.error(err);
    mostrarToast("Error de conexión con el backend", "error");
  });
}

function formatTimer(s) {
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

/* =====================
   INSTALAR MODS  
===================== */
async function instalarMods() {
  const tarjetasSeleccionadas = [...document.querySelectorAll('.selectable-mod.selected')];

  const categorias = new Set(
    tarjetasSeleccionadas.map(card => card.closest('.mods-category')?.querySelector('h2')?.textContent)
  );
  if (categorias.size > 1) {
    mostrarToast('⚠️ No mezcles mods de versiones distintas', 'warn');
    return;
  }

  const seleccionados = tarjetasSeleccionadas.map(card => card.dataset.mod);

  if (seleccionados.length === 0) {
    mostrarToast('Selecciona al menos un mod antes de instalar', 'warn');
    return;
  }
  if (!nombreServidor) {
    mostrarToast('Primero crea o carga un servidor', 'warn');
    return;
  }

  const statusEl = document.getElementById('modsStatus');
  if (statusEl) statusEl.textContent = '⏳ Instalando...';

  try {
    const respuesta = await fetch("http://192.168.15.152/orden.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "instalarMods",
        nombre: nombreServidor,
        mods: seleccionados,
        usuario: usuario?.user
      })
    });
    const data = await respuesta.json();
    if (data.status === "ok") {
      mostrarToast(`✅ Mods instalados en "${nombreServidor}": ${seleccionados.join(', ')}`, 'success');
      if (statusEl) statusEl.textContent = `✅ ${seleccionados.length} mod(s) instalado(s)`;
    } else {
      mostrarToast('Error al instalar mods: ' + data.msg, 'error');
      if (statusEl) statusEl.textContent = '❌ Error al instalar';
    }
  } catch (err) {
    console.error(err);
    mostrarToast('Error de conexión con el backend', 'error');
    if (statusEl) statusEl.textContent = '❌ Error de conexión';
  }
}

/* =====================
   TOAST NOTIFICATIONS
===================== */
function mostrarToast(msg, tipo = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed; bottom: 28px; right: 28px; z-index: 9999;
      padding: 14px 22px; border-radius: 6px;
      font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 600;
      box-shadow: 0 4px 24px rgba(0,0,0,0.5);
      transition: opacity 0.3s, transform 0.3s;
      max-width: 320px;
    `;
    document.body.appendChild(toast);
  }

  const colores = {
    success: { bg: 'rgba(22, 163, 74, 0.95)', color: '#fff', border: '1px solid #4ade80' },
    warn:    { bg: 'rgba(217, 119, 6, 0.95)', color: '#fff', border: '1px solid #fbbf24' },
    info:    { bg: 'rgba(30,30,30,0.97)',      color: '#e5e7eb', border: '1px solid rgba(74,222,128,0.3)' },
    error:   { bg: 'rgba(185, 28, 28, 0.95)', color: '#fff', border: '1px solid #f87171' },
  };
  const estilo = colores[tipo] || colores.info;
  toast.style.background = estilo.bg;
  toast.style.color = estilo.color;
  toast.style.border = estilo.border;
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 3000);
}

/* =====================
   CHAT DEL SERVIDOR
===================== */
const BOTS = ['Steve', 'Alex', 'Notch', 'Herobrine', 'CreeperFan99'];
const BOT_MENSAJES = [
  '¿Alguien quiere hacer una raid?',
  'Acabo de encontrar un diamante 💎',
  'El servidor va muy fluido hoy',
  'Cuidado con los creepers en el sur',
  'Alguien me puede dar madera?',
  'Construyendo una base en el spawn',
  'GG ese combate fue épico',
  'Mi granja de trigo ya está lista 🌾',
  'Quien quiere explorar el Nether?',
  'Acabo de morir por un Enderman...',
  'El Wither está suelto!! 💀',
  'Alguien tiene piedras de fuego?',
  'Nueva tienda en el mercado del spawn',
  'El lag me mató 😤',
  'Gg wp a todos!',
];

function horaActual() {
  const d = new Date();
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}

function agregarMensajeChat({ autor, texto, tipo = 'other' }) {
  const box = document.getElementById('chatBox');
  if (!box) return;

  const div = document.createElement('div');
  div.className = 'chat-msg ' + tipo;

  if (tipo !== 'system') {
    const authorEl = document.createElement('span');
    authorEl.className = 'chat-author';
    authorEl.textContent = autor;
    div.appendChild(authorEl);
  }

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = texto;
  div.appendChild(bubble);

  const time = document.createElement('span');
  time.className = 'chat-time';
  time.textContent = horaActual();
  div.appendChild(time);

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function enviarMensaje() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const texto = input.value.trim();
  if (!texto) return;

  const nombre = usuario ? usuario.user : 'Visitante';
  agregarMensajeChat({ autor: nombre, texto, tipo: 'mine' });
  input.value = '';
  input.focus();
}

function iniciarChatBots() {
  if (chatBotInterval) return;
  setTimeout(() => {
    agregarMensajeChat({ autor: '', texto: '— Conectado al chat del servidor —', tipo: 'system' });
    const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
    agregarMensajeChat({ autor: bot, texto: 'Bienvenido al servidor! 👋', tipo: 'other' });
  }, 600);

  chatBotInterval = setInterval(() => {
    if (Math.random() > 0.4) {
      const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
      const msg = BOT_MENSAJES[Math.floor(Math.random() * BOT_MENSAJES.length)];
      agregarMensajeChat({ autor: bot, texto: msg, tipo: 'other' });
    }
  }, 5000);
}

function detenerChatBots() {
  clearInterval(chatBotInterval);
  chatBotInterval = null;
}

/* =====================
   INIT
===================== */
window.addEventListener('DOMContentLoaded', () => {
  cargarTema();
  iniciarPantallaCarga(() => {
    cargarSesion();
  });

  document.querySelectorAll('.selectable-mod').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
    });
  });

  document.querySelectorAll('.selectable-version').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.selectable-version').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      document.getElementById('serverVersion').value = card.dataset.version;
    });
  });

  document.querySelectorAll('.version-card.selectable').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.version-card.selectable').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      document.getElementById('serverType').value = card.dataset.type;
    });
  });

});

/* =====================
   TOAST BÁSICO FALLBACK
===================== */
function showToast(msg, type = "info") {
  mostrarToast(msg, type);
}

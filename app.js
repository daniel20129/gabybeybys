/* =====================================
   SISTEMA DE BARBERÍA
   Versión 3 - LocalStorage
===================================== */


/* =====================================
   CONFIGURACIÓN
===================================== */

const preciosServicios = {
    "Corte de cabello": 150,
    "Barba": 100,
    "Combo": 220,
    "Tinte": 350
};

const CLAVE_CITAS = "barberia_citas";
const CLAVE_MOVIMIENTOS = "barberia_movimientos";
const CLAVE_CONTADOR_CITAS = "barberia_contador_citas";
const CLAVE_CONTADOR_MOVS = "barberia_contador_movs";


/* =====================================
   VARIABLES
===================================== */

let citas = [];
let movimientos = [];

let modalCita;
let modalMovimiento;


/* =====================================
   HELPERS LOCALSTORAGE
===================================== */

function leerLS(clave, defecto = []) {
    try {
        const datos = localStorage.getItem(clave);
        if (!datos) return defecto;
        const parsed = JSON.parse(datos);
        return Array.isArray(parsed) ? parsed : defecto;
    } catch (e) {
        console.error("Error leyendo localStorage:", clave, e);
        return defecto;
    }
}

function escribirLS(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
    } catch (e) {
        console.error("Error escribiendo localStorage:", clave, e);
        alert("No se pudo guardar en el almacenamiento local. ¿Está lleno?");
    }
}

function siguienteId(claveContador) {
    const actual = Number(localStorage.getItem(claveContador) || "0");
    const nuevo = actual + 1;
    localStorage.setItem(claveContador, String(nuevo));
    return nuevo;
}


/* =====================================
   INICIALIZAR SISTEMA
===================================== */

document.addEventListener("DOMContentLoaded", () => {

    modalCita = new bootstrap.Modal(
        document.getElementById("modalCita")
    );

    modalMovimiento = new bootstrap.Modal(
        document.getElementById("modalMovimiento")
    );

    establecerFechaActual();
    establecerFechasHistorial();

    cargarCitas();
    cargarMovimientos();
});


/* =====================================
   CARGAR CITAS DESDE LOCALSTORAGE
===================================== */

function cargarCitas() {
    citas = leerLS(CLAVE_CITAS).map(cita => ({
        ...cita,
        id: String(cita.id),
        precio: Number(cita.precio)
    }));

    actualizarDashboard();
    mostrarClientes();
    mostrarAgenda();

    console.log("Citas cargadas desde LocalStorage:", citas);
}


/* =====================================
   CARGAR MOVIMIENTOS DESDE LOCALSTORAGE
===================================== */

function cargarMovimientos() {
    movimientos = leerLS(CLAVE_MOVIMIENTOS).map(m => ({
        ...m,
        id: String(m.id),
        monto: Number(m.monto)
    }));

    actualizarCaja();
    actualizarDashboard();

    console.log("Movimientos cargados:", movimientos);
}


/* =====================================
   CAMBIAR SECCIÓN
===================================== */

function mostrarSeccion(nombreSeccion, boton) {

    document.querySelectorAll(".seccion").forEach(seccion => {
        seccion.classList.add("d-none");
    });

    document.getElementById(nombreSeccion).classList.remove("d-none");

    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    if (boton) boton.classList.add("active");

    if (nombreSeccion === "dashboard") actualizarDashboard();
    if (nombreSeccion === "agenda") mostrarAgenda();
    if (nombreSeccion === "clientes") mostrarClientes();
    if (nombreSeccion === "caja") actualizarCaja();
    if (nombreSeccion === "historial") mostrarHistorial();
}


/* =====================================
   FECHA ACTUAL
===================================== */

function obtenerFechaActual() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
}

function obtenerMesActual() {
    return obtenerFechaActual().substring(0, 7);
}

function establecerFechaActual() {
    const fecha = obtenerFechaActual();
    document.getElementById("fecha").value = fecha;
    document.getElementById("fechaAgenda").value = fecha;
}

function establecerFechasHistorial() {
    const hoy = obtenerFechaActual();
    const mes = obtenerMesActual();

    const inputDia = document.getElementById("historialDia");
    const inputMes = document.getElementById("historialMes");

    if (inputDia) inputDia.value = hoy;
    if (inputMes) inputMes.value = mes;
}


/* =====================================
   ABRIR MODAL CITA
===================================== */

function abrirModalCita() {
    limpiarFormulario();

    document.getElementById("tituloModal").textContent = "Nueva cita";
    document.getElementById("fecha").value = obtenerFechaActual();

    modalCita.show();
}


/* =====================================
   LIMPIAR FORMULARIO
===================================== */

function limpiarFormulario() {
    document.getElementById("formCita").reset();
    document.getElementById("citaId").value = "";
    document.getElementById("estado").value = "pendiente";
}


/* =====================================
   ACTUALIZAR PRECIO
===================================== */

function actualizarPrecio() {
    const servicio = document.getElementById("servicio").value;

    if (preciosServicios[servicio]) {
        document.getElementById("precio").value = preciosServicios[servicio];
    }
}


/* =====================================
   GUARDAR CITA
===================================== */

function guardarCita() {

    const formulario = document.getElementById("formCita");

    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }

    const id = document.getElementById("citaId").value;

    const cita = {
        id: id || null,
        nombre: document.getElementById("nombre").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        fecha: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value,
        servicio: document.getElementById("servicio").value,
        precio: Number(document.getElementById("precio").value),
        estado: document.getElementById("estado").value,
        notas: document.getElementById("notas").value.trim()
    };

    if (id) {
        const index = citas.findIndex(c => String(c.id) === String(id));
        if (index === -1) {
            alert("No se encontró la cita a editar.");
            return;
        }
        citas[index] = { ...cita, id: String(id) };
    } else {
        cita.id = String(siguienteId(CLAVE_CONTADOR_CITAS));
        citas.push(cita);
    }

    escribirLS(CLAVE_CITAS, citas);

    cargarCitas();
    modalCita.hide();

    alert(id
        ? "Cita actualizada correctamente."
        : "Cita registrada correctamente.");
}


/* =====================================
   EDITAR CITA
===================================== */

function editarCita(id) {

    const cita = citas.find(c => String(c.id) === String(id));

    if (!cita) return;

    document.getElementById("tituloModal").textContent = "Editar cita";

    document.getElementById("citaId").value = cita.id;
    document.getElementById("nombre").value = cita.nombre;
    document.getElementById("telefono").value = cita.telefono;
    document.getElementById("fecha").value = cita.fecha;
    document.getElementById("hora").value = cita.hora;
    document.getElementById("servicio").value = cita.servicio;
    document.getElementById("precio").value = cita.precio;
    document.getElementById("estado").value = cita.estado;
    document.getElementById("notas").value = cita.notas;

    modalCita.show();
}


/* =====================================
   ELIMINAR CITA
===================================== */

function eliminarCita(id) {

    const cita = citas.find(c => String(c.id) === String(id));

    if (!cita) {
        alert("No se encontró la cita.");
        return;
    }

    if (!confirm(`¿Quieres eliminar la cita de ${cita.nombre}?`)) return;

    citas = citas.filter(c => String(c.id) !== String(id));
    escribirLS(CLAVE_CITAS, citas);

    cargarCitas();
    alert("Cita eliminada correctamente.");
}


/* =====================================
   OBTENER CITAS DE HOY
===================================== */

function obtenerCitasHoy() {
    const hoy = obtenerFechaActual();
    return citas.filter(cita => cita.fecha === hoy);
}


/* =====================================
   DASHBOARD
===================================== */

function actualizarDashboard() {

    const citasHoy = obtenerCitasHoy();

    document.getElementById("totalHoy").textContent = citasHoy.length;

    const pendientes = citasHoy.filter(c => c.estado === "pendiente");
    document.getElementById("totalPendientes").textContent = pendientes.length;

    const confirmadas = citasHoy.filter(c => c.estado === "confirmado");
    document.getElementById("totalConfirmadas").textContent = confirmadas.length;

    const ingresosCitas = citasHoy
        .filter(c => c.estado === "confirmado" || c.estado === "atendido")
        .reduce((total, c) => total + c.precio, 0);

    const hoy = obtenerFechaActual();

    const entradasExtra = movimientos
        .filter(m => m.fecha === hoy && m.tipo === "entrada")
        .reduce((s, m) => s + m.monto, 0);

    const salidasHoy = movimientos
        .filter(m => m.fecha === hoy && m.tipo === "salida")
        .reduce((s, m) => s + m.monto, 0);

    const gananciaNeta = ingresosCitas + entradasExtra - salidasHoy;

    document.getElementById("ingresosHoy").textContent =
        `$${gananciaNeta.toLocaleString("es-MX")}`;

    mostrarTablaDashboard(citasHoy);
}


/* =====================================
   TABLA DASHBOARD
===================================== */

function mostrarTablaDashboard(lista) {

    const tabla = document.getElementById("tablaDashboard");

    if (lista.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-secondary py-4">
                    No hay citas para hoy.
                </td>
            </tr>
        `;
        return;
    }

    lista.sort((a, b) => a.hora.localeCompare(b.hora));

    tabla.innerHTML = lista.map(cita => `
        <tr>
            <td><strong>${cita.hora}</strong></td>
            <td>${cita.nombre}</td>
            <td>${cita.servicio}</td>
            <td>$${cita.precio}</td>
            <td>${crearBadgeEstado(cita.estado)}</td>
        </tr>
    `).join("");
}


/* =====================================
   AGENDA
===================================== */

function mostrarAgenda() {

    const fecha =
        document.getElementById("fechaAgenda").value || obtenerFechaActual();

    const citasFecha = citas.filter(cita => cita.fecha === fecha);

    citasFecha.sort((a, b) => a.hora.localeCompare(b.hora));

    const contenedor = document.getElementById("listaAgenda");

    if (citasFecha.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-calendar-x" style="font-size: 50px; color: #ffd200;"></i>
                <h4 class="mt-3">No hay citas</h4>
                <p class="text-secondary">
                    No existen citas programadas para esta fecha.
                </p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = citasFecha.map(cita => `
        <div class="cita-agenda">
            <div class="row align-items-center">
                <div class="col-md-2">
                    <div class="cita-hora">${cita.hora}</div>
                </div>
                <div class="col-md-3">
                    <div class="cita-nombre">${cita.nombre}</div>
                    <small class="text-secondary">${cita.telefono}</small>
                </div>
                <div class="col-md-2">${cita.servicio}</div>
                <div class="col-md-1"><strong>$${cita.precio}</strong></div>
                <div class="col-md-2">${crearBadgeEstado(cita.estado)}</div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-sm btn-outline-light me-1"
                        onclick="editarCita('${cita.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-success me-1"
                        onclick="enviarWhatsApp('${cita.id}')" title="Enviar WhatsApp">
                        <i class="bi bi-whatsapp"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger"
                        onclick="eliminarCita('${cita.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}


/* =====================================
   CLIENTES
===================================== */

function mostrarClientes() {

    const busqueda = document
        .getElementById("buscarCliente")
        .value.toLowerCase().trim();

    const lista = citas.filter(cita =>
        cita.nombre.toLowerCase().includes(busqueda) ||
        cita.telefono.includes(busqueda)
    );

    const tabla = document.getElementById("tablaClientes");

    if (lista.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-secondary py-4">
                    No se encontraron clientes.
                </td>
            </tr>
        `;
        return;
    }

    lista.sort((a, b) => {
        const fechaA = `${a.fecha} ${a.hora}`;
        const fechaB = `${b.fecha} ${b.hora}`;
        return fechaB.localeCompare(fechaA);
    });

    tabla.innerHTML = lista.map(cita => `
        <tr>
            <td><strong>${cita.nombre}</strong></td>
            <td>${cita.telefono}</td>
            <td>${formatearFecha(cita.fecha)}</td>
            <td>${cita.hora}</td>
            <td>${cita.servicio}</td>
            <td>${crearBadgeEstado(cita.estado)}</td>
            <td>
                <button class="btn btn-sm btn-outline-light me-1"
                    onclick="editarCita('${cita.id}')" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger"
                    onclick="eliminarCita('${cita.id}')" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}


/* =====================================
   BADGE DE ESTADO
===================================== */

function crearBadgeEstado(estado) {
    const nombres = {
        pendiente: "Pendiente",
        confirmado: "Confirmado",
        atendido: "Atendido",
        cancelado: "Cancelado"
    };

    return `<span class="estado estado-${estado}">${nombres[estado] || estado}</span>`;
}


/* =====================================
   FORMATEAR FECHA
===================================== */

function formatearFecha(fecha) {
    if (!fecha) return "";
    const partes = fecha.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


/* =====================================
   WHATSAPP
===================================== */

function enviarWhatsApp(id) {
    const cita = citas.find(c => String(c.id) === String(id));
    if (!cita) {
        alert("No se encontró la cita.");
        return;
    }

    let telefono = cita.telefono.replace(/\D/g, "");
    if (telefono.length === 10) telefono = "52" + telefono;

    const fecha = formatearFecha(cita.fecha);

    const mensaje =
        `Hola ${cita.nombre}, te recordamos que tienes una cita en Peluquería Desmelenada el ${fecha} a las ${cita.hora} para ${cita.servicio}. ¡Te esperamos!`;

    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "whatsapp");
}


/* =====================================
   MOVIMIENTOS (ENTRADAS / SALIDAS)
===================================== */

function abrirModalMovimiento(tipo = "entrada") {
    document.getElementById("formMovimiento").reset();
    document.getElementById("movTipo").value = tipo;
    document.getElementById("movFecha").value = obtenerFechaActual();
    document.getElementById("tituloModalMov").textContent =
        tipo === "entrada" ? "Nueva entrada de dinero" : "Nueva salida de dinero";

    modalMovimiento.show();
}


function guardarMovimiento() {

    const form = document.getElementById("formMovimiento");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const movimiento = {
        id: String(siguienteId(CLAVE_CONTADOR_MOVS)),
        tipo: document.getElementById("movTipo").value,
        monto: Number(document.getElementById("movMonto").value),
        descripcion: document.getElementById("movDescripcion").value.trim(),
        fecha: document.getElementById("movFecha").value
    };

    movimientos.push(movimiento);
    escribirLS(CLAVE_MOVIMIENTOS, movimientos);

    cargarMovimientos();
    modalMovimiento.hide();

    alert("Movimiento registrado correctamente.");
}


function eliminarMovimiento(id) {
    if (!confirm("¿Eliminar este movimiento?")) return;

    movimientos = movimientos.filter(m => String(m.id) !== String(id));
    escribirLS(CLAVE_MOVIMIENTOS, movimientos);

    cargarMovimientos();
}


/* =====================================
   CAJA
===================================== */

function actualizarCaja() {

    const hoy = obtenerFechaActual();
    const deHoy = movimientos.filter(m => m.fecha === hoy);

    const entradas = deHoy
        .filter(m => m.tipo === "entrada")
        .reduce((s, m) => s + m.monto, 0);

    const salidas = deHoy
        .filter(m => m.tipo === "salida")
        .reduce((s, m) => s + m.monto, 0);

    const entradasEl = document.getElementById("entradasHoy");
    const salidasEl = document.getElementById("salidasHoy");
    const netoEl = document.getElementById("netoHoy");

    if (entradasEl) entradasEl.textContent = `$${entradas.toLocaleString("es-MX")}`;
    if (salidasEl) salidasEl.textContent = `$${salidas.toLocaleString("es-MX")}`;
    if (netoEl) netoEl.textContent = `$${(entradas - salidas).toLocaleString("es-MX")}`;

    const tabla = document.getElementById("tablaMovimientosHoy");
    if (!tabla) return;

    if (deHoy.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-secondary py-4">
                    Sin movimientos hoy.
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = deHoy.map(m => `
        <tr>
            <td>${formatearFecha(m.fecha)}</td>
            <td>
                <span class="estado estado-${m.tipo === "entrada" ? "confirmado" : "cancelado"}">
                    ${m.tipo === "entrada" ? "Entrada" : "Salida"}
                </span>
            </td>
            <td>${m.descripcion}</td>
            <td>$${m.monto.toLocaleString("es-MX")}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger"
                    onclick="eliminarMovimiento('${m.id}')" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}


/* =====================================
   HISTORIAL
===================================== */

function cambiarVistaHistorial() {
    const tipo = document.getElementById("tipoHistorial").value;

    document.getElementById("grupoDia")
        .classList.toggle("d-none", tipo !== "diario");

    document.getElementById("grupoMes")
        .classList.toggle("d-none", tipo !== "mensual");

    mostrarHistorial();
}


function mostrarHistorial() {

    const tipo = document.getElementById("tipoHistorial").value;

    let prefijo;

    if (tipo === "diario") {
        prefijo = document.getElementById("historialDia").value || obtenerFechaActual();
    } else {
        prefijo = document.getElementById("historialMes").value || obtenerMesActual();
    }

    const citasPeriodo = citas.filter(c =>
        c.fecha &&
        c.fecha.startsWith(prefijo) &&
        (c.estado === "confirmado" || c.estado === "atendido")
    );

    const movsPeriodo = movimientos.filter(m =>
        m.fecha && m.fecha.startsWith(prefijo)
    );

    const ingresosCitas = citasPeriodo.reduce((s, c) => s + c.precio, 0);

    const entradasExtra = movsPeriodo
        .filter(m => m.tipo === "entrada")
        .reduce((s, m) => s + m.monto, 0);

    const salidas = movsPeriodo
        .filter(m => m.tipo === "salida")
        .reduce((s, m) => s + m.monto, 0);

    document.getElementById("histIngresos").textContent =
        `$${ingresosCitas.toLocaleString("es-MX")}`;

    document.getElementById("histEntradas").textContent =
        `$${entradasExtra.toLocaleString("es-MX")}`;

    document.getElementById("histSalidas").textContent =
        `$${salidas.toLocaleString("es-MX")}`;

    document.getElementById("histNeto").textContent =
        `$${(ingresosCitas + entradasExtra - salidas).toLocaleString("es-MX")}`;

    // Tabla citas
    const tablaCitas = document.getElementById("tablaHistorialCitas");

    if (citasPeriodo.length === 0) {
        tablaCitas.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-secondary py-4">
                    Sin citas en el periodo.
                </td>
            </tr>
        `;
    } else {
        citasPeriodo.sort((a, b) =>
            `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`)
        );

        tablaCitas.innerHTML = citasPeriodo.map(c => `
            <tr>
                <td>${formatearFecha(c.fecha)}</td>
                <td>${c.hora}</td>
                <td>${c.nombre}</td>
                <td>${c.servicio}</td>
                <td>$${c.precio.toLocaleString("es-MX")}</td>
                <td>${crearBadgeEstado(c.estado)}</td>
            </tr>
        `).join("");
    }

    // Tabla movimientos
    const tablaMovs = document.getElementById("tablaHistorialMovimientos");

    if (movsPeriodo.length === 0) {
        tablaMovs.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-secondary py-4">
                    Sin movimientos en el periodo.
                </td>
            </tr>
        `;
    } else {
        movsPeriodo.sort((a, b) => `${b.fecha}`.localeCompare(`${a.fecha}`));

        tablaMovs.innerHTML = movsPeriodo.map(m => `
            <tr>
                <td>${formatearFecha(m.fecha)}</td>
                <td>
                    <span class="estado estado-${m.tipo === "entrada" ? "confirmado" : "cancelado"}">
                        ${m.tipo === "entrada" ? "Entrada" : "Salida"}
                    </span>
                </td>
                <td>${m.descripcion}</td>
                <td>$${m.monto.toLocaleString("es-MX")}</td>
            </tr>
        `).join("");
    }
}


/* =====================================
   RESPALDO (EXPORTAR / IMPORTAR)
===================================== */

function exportarDatos() {
    const backup = {
        version: 1,
        exportado: new Date().toISOString(),
        citas: leerLS(CLAVE_CITAS),
        movimientos: leerLS(CLAVE_MOVIMIENTOS),
        contadorCitas: localStorage.getItem(CLAVE_CONTADOR_CITAS) || "0",
        contadorMovs: localStorage.getItem(CLAVE_CONTADOR_MOVS) || "0"
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `backup_barberia_${obtenerFechaActual()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);

    alert("Respaldo exportado correctamente.");
}


function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {
        try {
            const datos = JSON.parse(e.target.result);

            if (!Array.isArray(datos.citas) && !Array.isArray(datos.movimientos)) {
                throw new Error("El archivo no contiene citas ni movimientos válidos.");
            }

            if (!confirm("Esto reemplazará los datos actuales. ¿Continuar?")) {
                event.target.value = "";
                return;
            }

            if (Array.isArray(datos.citas)) escribirLS(CLAVE_CITAS, datos.citas);
            if (Array.isArray(datos.movimientos)) escribirLS(CLAVE_MOVIMIENTOS, datos.movimientos);

            if (datos.contadorCitas) {
                localStorage.setItem(CLAVE_CONTADOR_CITAS, String(datos.contadorCitas));
            }
            if (datos.contadorMovs) {
                localStorage.setItem(CLAVE_CONTADOR_MOVS, String(datos.contadorMovs));
            }

            cargarCitas();
            cargarMovimientos();

            alert("Datos importados correctamente.");
        } catch (err) {
            console.error("Error al importar:", err);
            alert("Archivo inválido: " + err.message);
        } finally {
            event.target.value = "";
        }
    };

    reader.readAsText(file);
}
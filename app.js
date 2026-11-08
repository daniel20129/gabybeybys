/* =====================================
   SISTEMA DE BARBERÍA
   Versión 2 - Con Caja e Historial
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


/* =====================================
   VARIABLES
===================================== */

let citas = [];
let movimientos = [];

let modalCita;
let modalMovimiento;


/* =====================================
   INICIALIZAR SISTEMA
===================================== */

document.addEventListener("DOMContentLoaded", async () => {

    modalCita = new bootstrap.Modal(
        document.getElementById("modalCita")
    );

    modalMovimiento = new bootstrap.Modal(
        document.getElementById("modalMovimiento")
    );

    establecerFechaActual();
    establecerFechasHistorial();

    await cargarCitas();
    await cargarMovimientos();

});


/* =====================================
   CARGAR CITAS DESDE MYSQL
===================================== */

async function cargarCitas() {
    try {
        const respuesta = await fetch("obtener_citas.php");

        if (!respuesta.ok) {
            throw new Error("Error HTTP: " + respuesta.status);
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
            throw new Error(datos.error || "La respuesta del servidor no es una lista de citas.");
        }

        citas = datos.map(cita => ({
            ...cita,
            id: String(cita.id),
            precio: Number(cita.precio)
        }));

        actualizarDashboard();
        mostrarClientes();
        mostrarAgenda();

        console.log("Citas cargadas desde MySQL:", citas);
    } catch (error) {
        console.error("Error al cargar las citas:", error);
        alert("No se pudieron cargar las citas desde MySQL. Revisa la consola del navegador (F12).");
    }
}


/* =====================================
   CARGAR MOVIMIENTOS DESDE MYSQL
===================================== */

async function cargarMovimientos() {
    try {
        const respuesta = await fetch("obtener_movimientos.php");

        if (!respuesta.ok) {
            throw new Error("Error HTTP: " + respuesta.status);
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
            throw new Error(datos.error || "La respuesta no es una lista de movimientos.");
        }

        movimientos = datos.map(m => ({
            ...m,
            id: String(m.id),
            monto: Number(m.monto)
        }));

        actualizarCaja();
        actualizarDashboard();

        console.log("Movimientos cargados:", movimientos);
    } catch (error) {
        console.error("Error al cargar movimientos:", error);
    }
}


/* =====================================
   CAMBIAR SECCIÓN
===================================== */

function mostrarSeccion(nombreSeccion, boton) {

    document.querySelectorAll(".seccion").forEach(seccion => {
        seccion.classList.add("d-none");
    });

    document
        .getElementById(nombreSeccion)
        .classList.remove("d-none");

    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    if (boton) {
        boton.classList.add("active");
    }

    if (nombreSeccion === "dashboard") {
        actualizarDashboard();
    }

    if (nombreSeccion === "agenda") {
        mostrarAgenda();
    }

    if (nombreSeccion === "clientes") {
        mostrarClientes();
    }

    if (nombreSeccion === "caja") {
        actualizarCaja();
    }

    if (nombreSeccion === "historial") {
        mostrarHistorial();
    }
}


/* =====================================
   FECHA ACTUAL
===================================== */

function obtenerFechaActual() {

    const ahora = new Date();

    const año = ahora.getFullYear();

    const mes = String(
        ahora.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        ahora.getDate()
    ).padStart(2, "0");

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

    document.getElementById("tituloModal").textContent =
        "Nueva cita";

    document.getElementById("fecha").value =
        obtenerFechaActual();

    modalCita.show();
}


/* =====================================
   LIMPIAR FORMULARIO
===================================== */

function limpiarFormulario() {

    document.getElementById("formCita").reset();

    document.getElementById("citaId").value = "";

    document.getElementById("estado").value =
        "pendiente";
}


/* =====================================
   ACTUALIZAR PRECIO
===================================== */

function actualizarPrecio() {

    const servicio =
        document.getElementById("servicio").value;

    if (preciosServicios[servicio]) {

        document.getElementById("precio").value =
            preciosServicios[servicio];
    }
}


/* =====================================
   GUARDAR CITA
===================================== */

async function guardarCita() {

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

    try {
        const respuesta = await fetch("guardar_cita.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(cita)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.mensaje || "No se pudo guardar la cita.");
        }

        await cargarCitas();
        modalCita.hide();

        alert(id
            ? "Cita actualizada correctamente."
            : "Cita registrada correctamente.");

    } catch (error) {
        console.error("Error al guardar la cita:", error);
        alert("No se pudo guardar la cita. " + error.message);
    }
}


/* =====================================
   EDITAR CITA
===================================== */

function editarCita(id) {

    const cita =
        citas.find(cita => String(cita.id) === String(id));

    if (!cita) {
        return;
    }

    document.getElementById("tituloModal").textContent =
        "Editar cita";

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

async function eliminarCita(id) {

    const cita = citas.find(cita => String(cita.id) === String(id));

    if (!cita) {
        alert("No se encontró la cita.");
        return;
    }

    const confirmar = confirm(
        `¿Quieres eliminar la cita de ${cita.nombre}?`
    );

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch("eliminar_cita.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id: cita.id })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.mensaje || "No se pudo eliminar la cita.");
        }

        await cargarCitas();
        alert("Cita eliminada correctamente.");

    } catch (error) {
        console.error("Error al eliminar la cita:", error);
        alert("No se pudo eliminar la cita. " + error.message);
    }
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

    document.getElementById("totalHoy").textContent =
        citasHoy.length;

    const pendientes =
        citasHoy.filter(cita => cita.estado === "pendiente");

    document.getElementById("totalPendientes").textContent =
        pendientes.length;

    const confirmadas =
        citasHoy.filter(cita => cita.estado === "confirmado");

    document.getElementById("totalConfirmadas").textContent =
        confirmadas.length;

    // Ingresos por citas confirmadas o atendidas
    const ingresosCitas = citasHoy
        .filter(cita =>
            cita.estado === "confirmado" ||
            cita.estado === "atendido"
        )
        .reduce((total, cita) => total + cita.precio, 0);

    // Entradas y salidas de caja del día
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

    const tabla =
        document.getElementById("tablaDashboard");

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

    tabla.innerHTML =
        lista.map(cita => `

            <tr>

                <td>
                    <strong>${cita.hora}</strong>
                </td>

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
        document.getElementById("fechaAgenda").value ||
        obtenerFechaActual();

    const citasFecha =
        citas.filter(cita => cita.fecha === fecha);

    citasFecha.sort((a, b) => a.hora.localeCompare(b.hora));

    const contenedor =
        document.getElementById("listaAgenda");

    if (citasFecha.length === 0) {

        contenedor.innerHTML = `
            <div class="text-center py-5">

                <i
                    class="bi bi-calendar-x"
                    style="font-size: 50px; color: #ffd200;"
                ></i>

                <h4 class="mt-3">No hay citas</h4>

                <p class="text-secondary">
                    No existen citas programadas para esta fecha.
                </p>

            </div>
        `;

        return;
    }

    contenedor.innerHTML =
        citasFecha.map(cita => `

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

                    <div class="col-md-1">
                        <strong>$${cita.precio}</strong>
                    </div>

                    <div class="col-md-2">
                        ${crearBadgeEstado(cita.estado)}
                    </div>

                    <div class="col-md-2 text-end">

                        <button
                            class="btn btn-sm btn-outline-light me-1"
                            onclick="editarCita('${cita.id}')"
                            title="Editar"
                        >
                            <i class="bi bi-pencil"></i>
                        </button>

                        <button
                            class="btn btn-sm btn-success me-1"
                            onclick="enviarWhatsApp('${cita.id}')"
                            title="Enviar WhatsApp"
                        >
                            <i class="bi bi-whatsapp"></i>
                        </button>

                        <button
                            class="btn btn-sm btn-outline-danger"
                            onclick="eliminarCita('${cita.id}')"
                            title="Eliminar"
                        >
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

    const busqueda =
        document
            .getElementById("buscarCliente")
            .value
            .toLowerCase()
            .trim();

    const lista =
        citas.filter(cita =>
            cita.nombre.toLowerCase().includes(busqueda) ||
            cita.telefono.includes(busqueda)
        );

    const tabla =
        document.getElementById("tablaClientes");

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

    tabla.innerHTML =
        lista.map(cita => `

            <tr>

                <td><strong>${cita.nombre}</strong></td>

                <td>${cita.telefono}</td>

                <td>${formatearFecha(cita.fecha)}</td>

                <td>${cita.hora}</td>

                <td>${cita.servicio}</td>

                <td>${crearBadgeEstado(cita.estado)}</td>

                <td>
                    <button
                        class="btn btn-sm btn-outline-light me-1"
                        onclick="editarCita('${cita.id}')"
                        title="Editar"
                    >
                        <i class="bi bi-pencil"></i>
                    </button>

                    <button
                        class="btn btn-sm btn-outline-danger"
                        onclick="eliminarCita('${cita.id}')"
                        title="Eliminar"
                    >
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

    return `
        <span class="estado estado-${estado}">
            ${nombres[estado] || estado}
        </span>
    `;
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

    const cita = citas.find(cita => String(cita.id) === String(id));

    if (!cita) {
        alert("No se encontró la cita.");
        return;
    }

    let telefono = cita.telefono.replace(/\D/g, "");

    if (telefono.length === 10) {
        telefono = "52" + telefono;
    }

    const fecha = formatearFecha(cita.fecha);

    const mensaje =
        `Hola ${cita.nombre}, te recordamos que tienes una cita en Peluquería Desmelenada el ${fecha} a las ${cita.hora} para ${cita.servicio}. ¡Te esperamos!`;

    const url =
        `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "whatsapp");
}


/* =====================================
   MOVIMIENTOS (ENTRADAS / SALIDAS)
===================================== */

function abrirModalMovimiento(tipo = "entrada") {

    document.getElementById("formMovimiento").reset();

    document.getElementById("movTipo").value = tipo;

    document.getElementById("movFecha").value =
        obtenerFechaActual();

    document.getElementById("tituloModalMov").textContent =
        tipo === "entrada" ? "Nueva entrada de dinero" : "Nueva salida de dinero";

    modalMovimiento.show();
}


async function guardarMovimiento() {

    const form = document.getElementById("formMovimiento");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const movimiento = {
        tipo: document.getElementById("movTipo").value,
        monto: Number(document.getElementById("movMonto").value),
        descripcion: document.getElementById("movDescripcion").value.trim(),
        fecha: document.getElementById("movFecha").value
    };

    try {
        const respuesta = await fetch("guardar_movimiento.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(movimiento)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.mensaje || "No se pudo guardar el movimiento.");
        }

        await cargarMovimientos();
        modalMovimiento.hide();

        alert("Movimiento registrado correctamente.");

    } catch (error) {
        console.error("Error al guardar movimiento:", error);
        alert("No se pudo guardar el movimiento. " + error.message);
    }
}


async function eliminarMovimiento(id) {

    if (!confirm("¿Eliminar este movimiento?")) {
        return;
    }

    try {
        const respuesta = await fetch("eliminar_movimiento.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.mensaje || "No se pudo eliminar.");
        }

        await cargarMovimientos();

    } catch (error) {
        console.error("Error al eliminar movimiento:", error);
        alert("No se pudo eliminar el movimiento. " + error.message);
    }
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
                <button
                    class="btn btn-sm btn-outline-danger"
                    onclick="eliminarMovimiento('${m.id}')"
                    title="Eliminar"
                >
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

    // Citas del periodo (solo confirmadas o atendidas)
    const citasPeriodo = citas.filter(c =>
        c.fecha &&
        c.fecha.startsWith(prefijo) &&
        (c.estado === "confirmado" || c.estado === "atendido")
    );

    // Movimientos de caja del periodo
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

    // Tabla de citas
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

    // Tabla de movimientos
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
        movsPeriodo.sort((a, b) =>
            `${b.fecha}`.localeCompare(`${a.fecha}`)
        );

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
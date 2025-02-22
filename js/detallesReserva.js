import { db } from './firebaseConfig.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';

// Verificar si el usuario está autenticado
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  console.log('Estado de autenticación:', user);
  if (!user) {
    window.location.href = 'admin.html';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM completamente cargado');
  const urlParams = new URLSearchParams(window.location.search);
  const reservaId = urlParams.get('id');
  console.log('ID de reserva obtenido:', reservaId);

  if (reservaId) {
    obtenerDetallesReserva(reservaId);
  } else {
    alert("ID de reserva no válido.");
  }
});

async function obtenerDetallesReserva(id) {
  console.log('Obteniendo detalles de la reserva con ID:', id);
  const reservaRef = doc(db, 'reservas', id);
  const reservaDoc = await getDoc(reservaRef);

  if (reservaDoc.exists()) {
    const reservaData = reservaDoc.data();
    console.log('Reserva encontrada:', reservaData);
    const reservaDetalles = document.getElementById('reserva-detalles');

    reservaDetalles.innerHTML = `
      <h2><strong>Cliente:</strong> ${reservaData.nombre}</h2>
      <p><strong>Teléfono:</strong> ${reservaData.telefono}</p>
      <p><strong>Fecha:</strong> ${reservaData.fecha}</p>
      <p><strong>Hora:</strong> ${reservaData.hora}</p>
      ${reservaData.municipio
        ? `<p><strong>Municipio:</strong> ${reservaData.municipio}
               ${reservaData.municipio !== "Santa Catarina"
          ? `<p><strong>Costo Flete $ </strong><input type="number" id="fleteInput"  style="width:100px;" />`
          : `<span style="color: green; font-weight: bold;"> Flete Gratis</span>`
        }
             </p>`
        : ''
      }
      <p><strong>Dirección:</strong> ${reservaData.direccion}</p>
      <h5>Paquetes Seleccionados:</h5>
      <ul>
        ${reservaData.adicionales.map(adicional => `<li>${adicional.nombre} - $${adicional.precio}</li>`).join('')}
      </ul>
      <p>
        <strong>Descuento (%):</strong> <input type="number" id="descuentoInput" placeholder="Descuento (%)" style="width:100px;" value="0"/>
      </p>
    <p style="font-size: 1.5em; font-weight: bold;">
  <strong>Total:</strong> $<span id="totalValue">${reservaData.total}</span>
</p>
<p id="estadoReserva" style="font-size: 1em; font-weight: bold;">
  <strong>Estado:</strong> ${reservaData.estado}
</p>

    `;

    // Lógica para actualizar el total en tiempo real
    const descuentoInput = document.getElementById("descuentoInput");
    const fleteInput = document.getElementById("fleteInput");
    const totalSpan = document.getElementById("totalValue");
    // Se utiliza el total base que ya viene en la reserva
    let baseTotal = parseFloat(reservaData.total);

    function actualizarTotal() {
      let flete = fleteInput ? parseFloat(fleteInput.value) || 0 : 0;
      let descuento = parseFloat(descuentoInput.value) || 0;
      let subtotal = baseTotal + flete;
      let discountAmount = subtotal * (descuento / 100);
      let newTotal = subtotal - discountAmount;
      totalSpan.textContent = newTotal.toFixed(2);
    }

    if (descuentoInput) {
      descuentoInput.addEventListener("input", actualizarTotal);
    }
    if (fleteInput) {
      fleteInput.addEventListener("input", actualizarTotal);
    }

    actualizarUI(id, reservaData, baseTotal);

  } else {
    console.error("No se encontró la reserva con ID:", id);
    alert("No se encontró la reserva.");
  }
}

async function actualizarUI(reservaId, reservaData, baseTotal) {
  console.log('Actualizando UI para reservaId:', reservaId, 'con estado:', reservaData.estado);
  const aceptarBtn = document.getElementById("aceptarBtn");
  const rechazarBtn = document.getElementById("rechazarBtn");
  const buttonsContainer = document.getElementById("buttons-container");
  const estadoReservaP = document.getElementById("estadoReserva");

  if (!estadoReservaP) {
    console.error("Elemento 'estadoReserva' no encontrado en el DOM.");
    return;
  }

  // Actualiza el texto del estado
  estadoReservaP.textContent = `Estado de la reserva: ${reservaData.estado}`;

  // Limpieza opcional: clonar botones para remover listeners previos
  if (aceptarBtn && rechazarBtn) {
    const newAceptarBtn = aceptarBtn.cloneNode(true);
    const newRechazarBtn = rechazarBtn.cloneNode(true);
    aceptarBtn.parentNode.replaceChild(newAceptarBtn, aceptarBtn);
    rechazarBtn.parentNode.replaceChild(newRechazarBtn, rechazarBtn);
  }

  // Vuelve a obtener los botones clonados
  const nuevoAceptarBtn = document.getElementById("aceptarBtn");
  const nuevoRechazarBtn = document.getElementById("rechazarBtn");

  if (reservaData.estado === 'Confirmado') {
    console.log('Estado Confirmado: asignando eventos para Regresar');
    nuevoAceptarBtn.textContent = "Regresar";
    nuevoAceptarBtn.addEventListener("click", () => {
      console.log('Botón Regresar clickeado');
      window.location.href = 'reservas.html';
    });
    nuevoRechazarBtn.style.display = "none";

    // Agregar etiqueta "Esperando autorización del cliente"
    if (!document.getElementById("labelAutorizacion")) {
      const label = document.createElement("span");
      label.id = "labelAutorizacion";
      label.textContent = " Esperando autorización del cliente";
      label.style.color = "orange";
      label.style.marginLeft = "10px";
      estadoReservaP.appendChild(label);
      console.log('Etiqueta "Esperando autorización del cliente" agregada');
    }

    // Agregar botón "Reenviar Contrato" si no existe
    if (buttonsContainer && !document.getElementById("reenviarContrato")) {
      const reenviarBtn = document.createElement("button");
      reenviarBtn.id = "reenviarContrato";
      reenviarBtn.textContent = "Reenviar Contrato";
      reenviarBtn.style.marginLeft = "10px";
      buttonsContainer.appendChild(reenviarBtn);
      console.log('Botón "Reenviar Contrato" agregado');
      reenviarBtn.addEventListener("click", () => {
        console.log('Botón Reenviar Contrato clickeado');
        reenviarContrato(reservaId, reservaData);
      });
    }

  } else if (reservaData.estado === 'Autorizado') {
    console.log('Estado Autorizado: asignando eventos para Guardar Reserva');
    nuevoAceptarBtn.textContent = "Guardar Reserva";
    nuevoAceptarBtn.addEventListener("click", async () => {
      console.log('Botón Guardar Reserva (Autorizado) clickeado');
      await concluirReserva(reservaId, reservaData);
      window.location.href = 'reservas.html';
    });
    nuevoRechazarBtn.style.display = "none";

    // Eliminar botón "Reenviar Contrato" si existe
    const reenviarBtn = document.getElementById("reenviarContrato");
    if (reenviarBtn) {
      reenviarBtn.remove();
      console.log('Botón "Reenviar Contrato" removido');
    }

  } else if (reservaData.estado === 'Concluido') {
    console.log('Estado Concluido: asignando eventos para Guardar Reserva');
    nuevoAceptarBtn.textContent = "Guardar Reserva";
    nuevoAceptarBtn.addEventListener("click", () => {
      console.log('Botón Guardar Reserva (Concluido) clickeado');
      window.location.href = 'reservas.html';
    });
    nuevoRechazarBtn.style.display = "none";

    const reenviarBtn = document.getElementById("reenviarContrato");
    if (reenviarBtn) {
      reenviarBtn.remove();
      console.log('Botón "Reenviar Contrato" removido (Concluido)');
    }

  } else if (reservaData.estado === 'Pendiente') {
    console.log('Estado Pendiente: asignando eventos para Aceptar, Rechazar y Actualizar Cambios');

    // Botón Aceptar cambia el estado a "Confirmado" y envía el mensaje de WhatsApp
    nuevoAceptarBtn.textContent = "Aceptar Reserva";
    nuevoAceptarBtn.style.display = "inline-block";
    nuevoAceptarBtn.addEventListener("click", async () => {
      console.log('Botón Aceptar Reserva (Pendiente) clickeado');
      await cambiarEstadoReserva(reservaId, 'Confirmado', 'aceptado');
      
    });

    // Botón Rechazar cambia el estado a "Cancelado" y envía el mensaje de WhatsApp
    nuevoRechazarBtn.textContent = "Rechazar Reserva";
    nuevoRechazarBtn.style.display = "inline-block";
    nuevoRechazarBtn.addEventListener("click", async () => {
      console.log('Botón Rechazar Reserva (Pendiente) clickeado');
      await cambiarEstadoReserva(reservaId, 'Cancelado', 'rechazado');
      window.location.href = 'reservas.html';
    });

    // Agregar botón "Actualizar cambios" para actualizar flete, descuento y total en Firebase
    let actualizarBtn = document.createElement("button");
    actualizarBtn.id = "actualizarCambiosBtn";
    actualizarBtn.textContent = "Actualizar cambios";
    actualizarBtn.style.display = "inline-block";
    actualizarBtn.style.marginTop = "10px";
    buttonsContainer.appendChild(actualizarBtn);

    actualizarBtn.addEventListener("click", async () => {
      let flete = document.getElementById("fleteInput") ? parseFloat(document.getElementById("fleteInput").value) || 0 : 0;
      let descuento = parseFloat(document.getElementById("descuentoInput").value) || 0;
      let subtotal = baseTotal + flete;
      let discountAmount = subtotal * (descuento / 100);
      let newTotal = subtotal - discountAmount;
      const reservaRef = doc(db, 'reservas', reservaId);
      await updateDoc(reservaRef, {
        flete: flete,
        descuento: descuento, // descuento en porcentaje
        total: newTotal
      });
      alert("Cambios actualizados Correctamente.");
    });
  } else {
    console.warn('Estado de reserva no reconocido:', reservaData.estado);
  }
}

function abrirGoogleCalendar(reservaData) {
  const titulo = encodeURIComponent(`Reserva con ${reservaData.nombre}`);
  const descripcion = encodeURIComponent(
    `Teléfono: ${reservaData.telefono}\nDirección: ${reservaData.direccion}\nMunicipio: ${reservaData.municipio}\nTotal: $${reservaData.total}`
  );
  const fecha = reservaData.fecha.replace(/-/g, '');
  const horaInicio = reservaData.hora.replace(':', '') + '00'; // Formato HHmmss
  const horaFin = (parseInt(reservaData.hora.substring(0, 2)) + 1).toString().padStart(2, '0') + reservaData.hora.substring(2) + '00';
  
  const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${titulo}&details=${descripcion}&dates=${fecha}T${horaInicio}/${fecha}T${horaFin}`;

  window.open(calendarUrl, '_blank');
}



function reenviarContrato(reservaId, reservaData) {
  console.log("Ejecutando reenviarContrato para reservaId:", reservaId);
  const mensaje = `¡Hola ${reservaData.nombre}! Su reserva ha sido confirmada. Revise el contrato en: https://csrtech-studio.github.io/Hiram-Inflables/contrato.html?id=${reservaId}`;
  const urlWhatsApp = `https://wa.me/${reservaData.telefono}?text=${encodeURIComponent(mensaje)}`;
  console.log('URL WhatsApp para reenviar contrato:', urlWhatsApp);
  window.open(urlWhatsApp, '_blank');
  alert("Contrato reenviado.");
}

async function concluirReserva(reservaId, reservaData) {
  console.log('Ejecutando concluirReserva para reservaId:', reservaId);
  const reservaRef = doc(db, 'reservas', reservaId);
  await updateDoc(reservaRef, { estado: 'Concluido' });
  console.log('Reserva actualizada a Concluido');
  alert("Reserva guardada con éxito.");
}

async function cambiarEstadoReserva(reservaId, nuevoEstado, tipoMensaje) {
  console.log(`Ejecutando cambiarEstadoReserva para reservaId: ${reservaId}, nuevoEstado: ${nuevoEstado}, tipoMensaje: ${tipoMensaje}`);
  const reservaRef = doc(db, 'reservas', reservaId);
  await updateDoc(reservaRef, { estado: nuevoEstado });

  const reservaDoc = await getDoc(reservaRef);
  const reservaData = reservaDoc.data();
  let mensaje = '';

  if (tipoMensaje === 'aceptado') {
    mensaje = `¡Hola ${reservaData.nombre}! Inflables Hiram le informa que su reserva ha sido confirmada. Por favor, revisa y acepta el contrato en el siguiente enlace: https://csrtech-studio.github.io/Hiram-Inflables/contrato.html?id=${reservaId}`;
  } else if (tipoMensaje === 'rechazado') {
    mensaje = `Estimado/a ${reservaData.nombre},

Inflables Hiram lamenta informarle que por el momento no podemos ofrecerle el servicio de renta solicitado. Las razones pueden ser las siguientes:
- La fecha solicitada ya se encuentra reservada para otro cliente.
- No contamos con el inflable o la máquina solicitada en inventario.

Le pedimos una disculpa por los inconvenientes causados. Si desea más información o tiene alguna consulta adicional, no dude en contactarnos a este mismo número.

Atentamente,
Inflables Hiram`;
  }

  const urlWhatsApp = `https://wa.me/${reservaData.telefono}?text=${encodeURIComponent(mensaje)}`;
  console.log('URL WhatsApp (cambiarEstadoReserva):', urlWhatsApp);
  window.open(urlWhatsApp, '_blank');
  alert(`Estado de la reserva actualizado a: ${nuevoEstado} Abriendo Google Calendario`);
  abrirGoogleCalendar(reservaData);
}

// Agrega las importaciones necesarias (asegúrate de que estas líneas estén al inicio de tu archivo)
import { doc, getDoc, updateDoc, deleteDoc, addDoc, collection } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';
import { db } from './firebaseConfig.js';

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

  // Clonar botones para remover listeners previos
  if (aceptarBtn && rechazarBtn) {
    const newAceptarBtn = aceptarBtn.cloneNode(true);
    const newRechazarBtn = rechazarBtn.cloneNode(true);
    aceptarBtn.parentNode.replaceChild(newAceptarBtn, aceptarBtn);
    rechazarBtn.parentNode.replaceChild(newRechazarBtn, rechazarBtn);
  }

  const nuevoAceptarBtn = document.getElementById("aceptarBtn");
  const nuevoRechazarBtn = document.getElementById("rechazarBtn");

  if (reservaData.estado === 'Confirmado') {
    nuevoAceptarBtn.textContent = "Regresar";
    nuevoAceptarBtn.addEventListener("click", () => {
      window.location.href = 'reservas.html';
    });
    nuevoRechazarBtn.style.display = "none";

    // Agrega etiqueta "Esperando autorización del cliente"
    if (!document.getElementById("labelAutorizacion")) {
      const label = document.createElement("span");
      label.id = "labelAutorizacion";
      label.textContent = " Esperando autorización del cliente";
      label.style.color = "orange";
      label.style.marginLeft = "10px";
      estadoReservaP.appendChild(label);
    }

    // Agrega botón "Reenviar Contrato" si no existe
    if (buttonsContainer && !document.getElementById("reenviarContrato")) {
      const reenviarBtn = document.createElement("button");
      reenviarBtn.id = "reenviarContrato";
      reenviarBtn.textContent = "Reenviar Contrato";
      reenviarBtn.style.marginLeft = "10px";
      buttonsContainer.appendChild(reenviarBtn);
      reenviarBtn.addEventListener("click", () => {
        reenviarContrato(reservaId, reservaData);
      });
    }

    // Agrega botón "Cancelar Reserva" con la nueva lógica de cancelación
    if (!document.getElementById("cancelarReservaBtn")) {
      const cancelarBtn = document.createElement("button");
      cancelarBtn.id = "cancelarReservaBtn";
      cancelarBtn.textContent = "Cancelar Reserva";
      cancelarBtn.style.marginLeft = "10px";
      cancelarBtn.style.backgroundColor = "red";
      cancelarBtn.style.color = "white";
      buttonsContainer.appendChild(cancelarBtn);

      cancelarBtn.addEventListener("click", () => {
        showCancellationModal(reservaId);
      });
    }
  } else if (reservaData.estado === 'Autorizado') {
    nuevoAceptarBtn.textContent = "Reseva pagada y Concluida";
    nuevoAceptarBtn.addEventListener("click", async () => {
      await concluirReserva(reservaId, reservaData);
      window.location.href = 'reservas.html';
    });
    nuevoRechazarBtn.style.display = "none";

    // Remueve botón "Reenviar Contrato" si existe
    const reenviarBtn = document.getElementById("reenviarContrato");
    if (reenviarBtn) {
      reenviarBtn.remove();
    }
  } else if (reservaData.estado === 'Concluido') {
    nuevoAceptarBtn.textContent = "Regresar";
    nuevoAceptarBtn.addEventListener("click", () => {
      window.location.href = 'reservas.html';
    });
    nuevoRechazarBtn.style.display = "none";
    const reenviarBtn = document.getElementById("reenviarContrato");
    if (reenviarBtn) {
      reenviarBtn.remove();
    }
    // Agrega el nuevo botón "Guardar Reserva" junto al botón "Regresar"
    if (buttonsContainer) {
      const guardarBtn = document.createElement("button");
      guardarBtn.textContent = "Guardar Reserva";
      guardarBtn.classList.add("guardar-btn");
      guardarBtn.style.marginLeft = "10px";
      buttonsContainer.appendChild(guardarBtn);


      guardarBtn.addEventListener("click", async () => {
        await guardarReservaTerminada(reservaId);
      });
    }

  } else if (reservaData.estado === 'Pendiente') {
    nuevoAceptarBtn.textContent = "Aceptar Reserva";
    nuevoAceptarBtn.style.display = "inline-block";
    nuevoAceptarBtn.addEventListener("click", async () => {
      await cambiarEstadoReserva(reservaId, 'Confirmado', 'aceptado');
    });

    nuevoRechazarBtn.textContent = "Rechazar Reserva";
    nuevoRechazarBtn.style.display = "inline-block";
    nuevoRechazarBtn.addEventListener("click", async () => {
      await cambiarEstadoReserva(reservaId, 'Cancelado', 'rechazado');
      window.location.href = 'reservas.html';
    });

    // Agrega botón "Actualizar cambios" para modificar flete, descuento y total en Firebase
    let actualizarBtn = document.createElement("button");
    actualizarBtn.id = "actualizarCambiosBtn";
    actualizarBtn.textContent = "Actualizar cambios";
    actualizarBtn.style.display = "inline-block";
    actualizarBtn.style.marginTop = "10px";
    actualizarBtn.classList.add("actualizarBtn");
    buttonsContainer.appendChild(actualizarBtn);
    const aceptarBtn = document.getElementById("aceptarBtn");

    if (aceptarBtn) {
      // Inserta el botón "Actualizar cambios" antes del botón "Confirmar"
      buttonsContainer.insertBefore(actualizarBtn, aceptarBtn);
    } else {
      // Si no se encuentra el botón Confirmar, lo agrega al final
      buttonsContainer.appendChild(actualizarBtn);
    }


    actualizarBtn.addEventListener("click", async () => {
      let flete = document.getElementById("fleteInput") ? parseFloat(document.getElementById("fleteInput").value) || 0 : 0;
      let descuento = parseFloat(document.getElementById("descuentoInput").value) || 0;
      let subtotal = baseTotal + flete;
      let discountAmount = subtotal * (descuento / 100);
      let newTotal = subtotal - discountAmount;
      const reservaRef = doc(db, 'reservas', reservaId);
      await updateDoc(reservaRef, {
        flete: flete,
        descuento: descuento,
        total: newTotal
      });
      alert("Cambios actualizados Correctamente.");
    });
  } else {
    console.warn('Estado de reserva no reconocido:', reservaData.estado);
  }
}

// Modal para cancelar reserva de forma profesional
function showCancellationModal(reservaId) {
  // Crea el overlay del modal
  const modalOverlay = document.createElement('div');
  modalOverlay.style.position = 'fixed';
  modalOverlay.style.top = '0';
  modalOverlay.style.left = '0';
  modalOverlay.style.width = '100%';
  modalOverlay.style.height = '100%';
  modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modalOverlay.style.display = 'flex';
  modalOverlay.style.alignItems = 'center';
  modalOverlay.style.justifyContent = 'center';
  modalOverlay.style.zIndex = '1000';

  // Crea el contenido del modal
  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = '#fff';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
  modalContent.style.maxWidth = '400px';
  modalContent.style.width = '100%';

  modalContent.innerHTML = `
    <h3>Cancelar Reserva</h3>
    <p>Seleccione el motivo de cancelación:</p>
    <select id="motivoSelect" style="width:100%; padding:8px; margin-bottom:10px;">
      <option value="Cliente canceló">Cliente canceló</option>
      <option value="Error en la reserva">Error en la reserva</option>
      <option value="Otro motivo">Otro motivo</option>
    </select>
    <input type="text" id="otroMotivo" placeholder="Especifique otro motivo" style="width:100%; padding:8px; margin-bottom:10px; display:none;">
    <div style="text-align:right;">
      <button id="cancelarModalBtn" style="margin-right:10px;">Cancelar</button>
      <button id="confirmarCancelacionBtn">Confirmar</button>
    </div>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  const motivoSelect = modalContent.querySelector('#motivoSelect');
  const otroMotivoInput = modalContent.querySelector('#otroMotivo');

  // Mostrar campo adicional si se selecciona "Otro motivo"
  motivoSelect.addEventListener('change', () => {
    if (motivoSelect.value === 'Otro motivo') {
      otroMotivoInput.style.display = 'block';
    } else {
      otroMotivoInput.style.display = 'none';
    }
  });

  // Botón para cancelar el modal
  modalContent.querySelector('#cancelarModalBtn').addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });

  // Botón para confirmar la cancelación
  modalContent.querySelector('#confirmarCancelacionBtn').addEventListener('click', async () => {
    let motivo = motivoSelect.value;
    if (motivo === 'Otro motivo') {
      motivo = otroMotivoInput.value.trim();
      if (!motivo) {
        alert('Por favor, especifique el motivo de cancelación.');
        return;
      }
    }
    await procesarCancelacion(reservaId, motivo);
    document.body.removeChild(modalOverlay);
  });
}

// Función para mover la reserva a la colección "reservasTerminadas"
async function guardarReservaTerminada(reservaId) {
  try {
    // Obtén la reserva desde la colección "reservas"
    const reservaRef = doc(db, 'reservas', reservaId);
    const reservaDoc = await getDoc(reservaRef);
    
    if (reservaDoc.exists()) {
      const reservaData = reservaDoc.data();
      
      // Prepara la data para guardar en "reservasTerminadas"
      const terminadoData = {
        ...reservaData,
        fechaGuardado: new Date().toISOString(), // Marca de tiempo
        estado: 'Terminada'
      };
      
      // Guarda en la colección "reservasTerminadas"
      await addDoc(collection(db, 'reservasTerminadas'), terminadoData);
      
      // Elimina la reserva original de la colección "reservas"
      await deleteDoc(reservaRef);
      
      alert("Reserva guardada en Reservas Terminadas.");
      window.location.href = 'reservas.html';
    } else {
      alert("No se encontró la reserva.");
    }
  } catch (error) {
    console.error("Error al guardar la reserva terminada:", error);
    alert("Hubo un error al guardar la reserva terminada.");
  }
}


// Función para procesar la cancelación: guarda en 'eventosCancelados' y elimina la reserva original
async function procesarCancelacion(reservaId, motivo) {
  try {
    const reservaRef = doc(db, 'reservas', reservaId);
    const reservaDoc = await getDoc(reservaRef);
    if (reservaDoc.exists()) {
      const reservaData = reservaDoc.data();
      const cancelData = {
        ...reservaData,
        motivoCancelacion: motivo,
        fechaCancelacion: new Date().toISOString(),
        estado: 'Cancelado'
      };
      // Guarda en la colección 'eventosCancelados'
      await addDoc(collection(db, 'eventosCancelados'), cancelData);
      // Elimina la reserva original
      await deleteDoc(reservaRef);
      alert("Reserva cancelada y guardada en eventos cancelados.");
      window.location.href = 'reservas.html';
    } else {
      alert("No se encontró la reserva.");
    }
  } catch (error) {
    console.error("Error al cancelar la reserva:", error);
    alert("Hubo un error al cancelar la reserva.");
  }
}

function reenviarContrato(reservaId, reservaData) {
  const mensaje = `¡Hola ${reservaData.nombre}! Su reserva ha sido confirmada. Revise el contrato en: https://csrtech-studio.github.io/Hiram-Inflables/contrato.html?id=${reservaId}`;
  const urlWhatsApp = `https://wa.me/${reservaData.telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(urlWhatsApp, '_blank');
  alert("Contrato reenviado.");
}

async function concluirReserva(reservaId, reservaData) {
  const reservaRef = doc(db, 'reservas', reservaId);
  await updateDoc(reservaRef, { estado: 'Concluido' });
  alert("Reserva Concluida y Pagada con Exito.");
}

async function cambiarEstadoReserva(reservaId, nuevoEstado, tipoMensaje) {
  const reservaRef = doc(db, 'reservas', reservaId);
  await updateDoc(reservaRef, { estado: nuevoEstado });

  const reservaDoc = await getDoc(reservaRef);
  const reservaData = reservaDoc.data();
  let mensaje = '';

  if (tipoMensaje === 'aceptado') {
    mensaje = `¡Hola ${reservaData.nombre}! Inflables Hiram le informa que su reserva ha sido confirmada. Por favor, revisa y acepta el contrato en el siguiente enlace: https://csrtech-studio.github.io/Hiram-Inflables/contrato.html?id=${reservaId}`;
  } else if (tipoMensaje === 'rechazado') {
    mensaje = `Estimado/a ${reservaData.nombre},\n\nInflables Hiram lamenta informarle que por el momento no podemos ofrecerle el servicio solicitado.\n\nAtentamente,\nInflables Hiram`;
  }

  const urlWhatsApp = `https://wa.me/${reservaData.telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(urlWhatsApp, '_blank');
  alert(`Estado de la reserva actualizado a: ${nuevoEstado}. Abriendo Google Calendario`);
  // Puedes invocar la función para abrir Google Calendar si lo deseas
}

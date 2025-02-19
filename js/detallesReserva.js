import { db } from './firebaseConfig.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';

// Verificar si el usuario está autenticado
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'admin.html';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const reservaId = urlParams.get('id');

  if (reservaId) {
    obtenerDetallesReserva(reservaId);
  } else {
    alert("ID de reserva no válido.");
  }
});

async function obtenerDetallesReserva(id) {
  const reservaRef = doc(db, 'reservas', id);
  const reservaDoc = await getDoc(reservaRef);

  if (reservaDoc.exists()) {
    const reservaData = reservaDoc.data();
    
    // Mostrar los detalles de la reserva en el HTML
    const reservaDetalles = document.getElementById('reserva-detalles');
    
    reservaDetalles.innerHTML = `
      <h2><strong>Cliente:</strong> ${reservaData.nombre}</h2>
      <p><strong>Teléfono:</strong> ${reservaData.telefono}</p>
      <p><strong>Fecha:</strong> ${reservaData.fecha}</p>
      <p><strong>Hora:</strong> ${reservaData.hora}</p>
      <p><strong>Dirección:</strong> ${reservaData.direccion}</p>
      <h5>Paquetes Seleccionados:</h5>
      <ul>
        ${reservaData.adicionales.map(adicional => `
          <li>${adicional.nombre} - $${adicional.precio}</li>
        `).join('')}
      </ul>
      <p><strong>Total:</strong> $${reservaData.total}</p>
      <p><strong>Estado:</strong> ${reservaData.estado}</p>
    `;

    // Actualizar el estado y los botones
    actualizarUI(reservaDoc.id, reservaData);
  } else {
    alert("No se encontró la reserva.");
  }
}

async function actualizarUI(reservaId) {
  const reservaRef = doc(db, 'reservas', reservaId);
  const reservaDoc = await getDoc(reservaRef);

  if (!reservaDoc.exists()) {
    console.error("No se encontró la reserva.");
    return;
  }

  const reservaData = reservaDoc.data();
  console.log("Datos de la reserva:", reservaData);

  const aceptarBtn = document.getElementById("aceptarBtn");
  const rechazarBtn = document.getElementById("rechazarBtn");
  const buttonsContainer = document.getElementById("buttons-container");
  const estadoReservaP = document.getElementById("estadoReserva");

  if (!estadoReservaP) {
    console.error("Elemento 'estadoReserva' no encontrado en el DOM.");
    return;
  }

  estadoReservaP.textContent = `Estado de la reserva: ${reservaData.estado}`;

  if (reservaData.estado === 'Confirmado') {
    aceptarBtn.textContent = "Regresar";
    rechazarBtn.style.display = "none";

    // Agregar etiqueta "Esperando autorización del cliente"
    if (!document.getElementById("labelAutorizacion")) {
      const label = document.createElement("span");
      label.id = "labelAutorizacion";
      label.textContent = " Esperando autorización del cliente";
      label.style.color = "orange";
      label.style.marginLeft = "10px";
      estadoReservaP.appendChild(label);
    }

    // Agregar botón "Reenviar Contrato"
    let reenviarBtn = document.getElementById("reenviarContrato");
    if (!reenviarBtn) {
      reenviarBtn = document.createElement("button");
      reenviarBtn.id = "reenviarContrato";
      reenviarBtn.textContent = "Reenviar Contrato";
      reenviarBtn.style.marginLeft = "10px";
      buttonsContainer.appendChild(reenviarBtn);

      reenviarBtn.addEventListener("click", () => {
        reenviarContrato(reservaId, reservaData);
      });
    }

    aceptarBtn.addEventListener("click", () => {
      window.location.href = 'reservas.html';
    });

  } else if (reservaData.estado === 'Autorizado') {
    aceptarBtn.textContent = "Guardar Reserva";
    rechazarBtn.style.display = "none";

    // Remover el botón "Reenviar Contrato" si existe
    const reenviarBtn = document.getElementById("reenviarContrato");
    if (reenviarBtn) {
      reenviarBtn.remove();
    }

    aceptarBtn.addEventListener("click", async () => {
      await concluirReserva(reservaId, reservaData);
      window.location.href = 'reservas.html';
    });
  }
}

// Función para reenviar el contrato
function reenviarContrato(reservaId, reservaData) {
  console.log("Reenviando contrato a:", reservaData.telefono);
  const mensaje = `¡Hola ${reservaData.nombre}! Su reserva ha sido confirmada. Revise el contrato en: https://csrtech-studio.github.io/Hiram-Inflables/contrato.html?id=${reservaId}`;
  const urlWhatsApp = `https://wa.me/${reservaData.telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(urlWhatsApp, '_blank');
  alert("Contrato reenviado.");
}

// Función para concluir la reserva
async function concluirReserva(reservaId, reservaData) {
  const reservaRef = doc(db, 'reservas', reservaId);
  await updateDoc(reservaRef, { estado: 'Concluido' });
  alert("Reserva guardada con éxito.");
}

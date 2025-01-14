import { db } from './firebaseConfig.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

const urlParams = new URLSearchParams(window.location.search);
const reservaId = urlParams.get('id'); // Asumiendo que pasas el ID de la reserva en la URL

if (reservaId) {
  obtenerDetallesReserva(reservaId);
} else {
  alert("ID de reserva no válido.");
}

// Recuperar los detalles de la reserva
async function obtenerDetallesReserva(id) {
  const reservaRef = doc(db, 'reservas', id);
  const reservaDoc = await getDoc(reservaRef);

  if (reservaDoc.exists()) {
    const reservaData = reservaDoc.data();

    // Mostrar los detalles de la reserva
    const reservaDetalles = document.getElementById('reserva-detalles');
    reservaDetalles.innerHTML = `
      <h2><strong>Cliente:</strong>${reservaData.nombre}</h2>
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
  } else {
    alert("No se encontraron detalles de la reserva.");
  }
}

// Función para cambiar el estado de la reserva
async function cambiarEstadoReserva(nuevoEstado) {
  const reservaRef = doc(db, 'reservas', reservaId);
  await updateDoc(reservaRef, {
    estado: nuevoEstado
  });

  alert(`Estado de la reserva actualizado a: ${nuevoEstado}`);
  window.location.href = 'index.html'; // Redirigir al listado de reservas o página principal
}

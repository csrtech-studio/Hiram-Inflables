import { db } from './firebaseConfig.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

const urlParams = new URLSearchParams(window.location.search);
const reservaId = urlParams.get('id');

async function cargarContrato() {
  const reservaRef = doc(db, 'reservas', reservaId);
  const reservaDoc = await getDoc(reservaRef);

  if (reservaDoc.exists()) {
    const { nombre, telefono, fecha, hora } = reservaDoc.data();
    document.getElementById('cliente-info').innerText = `
      Cliente: ${nombre}\n
      Teléfono: ${telefono}\n
      Fecha del evento: ${fecha}\n
      Hora del evento: ${hora}
    `;
  } else {
    alert('No se encontraron detalles de la reserva.');
  }
}

async function actualizarEstadoContrato(estado) {
  const reservaRef = doc(db, 'reservas', reservaId);
  await updateDoc(reservaRef, { estado });
  alert(`Contrato ${estado === 'Confirmado' ? 'aceptado' : 'rechazado'}.`);
  window.location.href = 'index.html';
}

document.getElementById('aceptar').addEventListener('click', () => actualizarEstadoContrato('Confirmado'));
document.getElementById('rechazar').addEventListener('click', () => actualizarEstadoContrato('Rechazado'));

cargarContrato();

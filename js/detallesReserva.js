import { db } from './firebaseConfig.js';
import { doc, getDoc, updateDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
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

  async function obtenerDetallesReserva(id) {
    const reservaRef = doc(db, 'reservas', id);
    const reservaDoc = await getDoc(reservaRef);

    if (reservaDoc.exists()) {
      const reservaData = reservaDoc.data();
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
            <p id="estadoReserva"><strong>Estado:</strong> ${reservaData.estado}</p>
        `;

      const aceptarBtn = document.getElementById('aceptar-reserva');
      const rechazarBtn = document.getElementById('rechazar');
      
      if (reservaData.estado === 'Confirmado') {
        aceptarBtn.textContent = "Regresar";
        rechazarBtn.style.display = "none";
        aceptarBtn.addEventListener('click', () => {
          window.location.href = 'reservas.html';
        });
      } else {
        aceptarBtn.addEventListener('click', async () => {
          await cambiarEstadoReserva(reservaDoc.id, 'Confirmado', 'aceptado');
          abrirGoogleCalendarManual(reservaData);
          window.location.href = 'reservas.html';
        });

        rechazarBtn.addEventListener('click', async () => {
          await cambiarEstadoReserva(reservaDoc.id, 'Cancelado', 'rechazado');
          window.location.href = 'reservas.html';
        });
      }
    }
  }

  async function cambiarEstadoReserva(reservaId, nuevoEstado, tipoMensaje) {
    const reservaRef = doc(db, 'reservas', reservaId);
    await updateDoc(reservaRef, { estado: nuevoEstado });
    const reservaDoc = await getDoc(reservaRef);
    const reservaData = reservaDoc.data();

    let mensaje = '';
    if (tipoMensaje === 'aceptado') {
      mensaje = `¡Hola ${reservaData.nombre}! Su reserva ha sido confirmada. Revise el contrato en: https://csrtech-studio.github.io/Hiram-Inflables/contrato.html?id=${reservaId}`;
    } else if (tipoMensaje === 'rechazado') {
      mensaje = `Estimado/a ${reservaData.nombre}, lamentamos informarle que no podemos procesar su reserva en este momento.`;
    }

    const urlWhatsApp = `https://wa.me/${reservaData.telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
    alert(`Estado de la reserva actualizado a: ${nuevoEstado}`);
  }

  function abrirGoogleCalendarManual(reservaData) {
    const baseUrl = "https://calendar.google.com/calendar/render";
    
    function formatearFecha(fecha, hora) {
        return new Date(`${fecha}T${hora}:00`).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    }

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: `Reserva - ${reservaData.nombre}`,
        details: `Reserva confirmada.\nTeléfono: ${reservaData.telefono}\nDirección: ${reservaData.direccion}`,
        location: reservaData.direccion,
        dates: `${formatearFecha(reservaData.fecha, reservaData.hora)}/${formatearFecha(reservaData.fecha, (parseInt(reservaData.hora) + 1) + ":00")}`,
    });

    window.open(`${baseUrl}?${params.toString()}`, "_blank");
  }
});

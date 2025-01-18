import { db } from './firebaseConfig.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';

// Verificar si el usuario está autenticado
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Si no está autenticado, redirigir al admin.html
    window.location.href = 'admin.html';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const reservaId = urlParams.get('id'); // Obtenemos el ID de la reserva de la URL

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
        <p><strong>Estado:</strong> ${reservaData.estado}</p>
      `;

      // Asegurarse de que el botón "Aceptar" esté bien asignado
      const aceptarBtn = document.getElementById('aceptar-reserva');
      console.log('Botón Aceptar:', aceptarBtn);  // Verificar que el botón exista
      if (aceptarBtn) {
        aceptarBtn.addEventListener('click', (event) => {
          event.preventDefault();  // Evitar comportamiento por defecto (redirección inmediata)
          console.log('Botón Aceptar presionado');
          cambiarEstadoReserva(reservaId, 'Confirmado', 'aceptado').then(() => {
            window.location.href = 'reservas.html';  // Redirigir después de ejecutar la lógica
          });
        });
      }

      // Asignar evento al botón "Rechazar"
      const rechazarBtn = document.getElementById('rechazar');
      if (rechazarBtn) {
        rechazarBtn.addEventListener('click', async () => {
          await cambiarEstadoReserva(reservaId, 'Cancelado', 'rechazado');
          window.location.href = 'reservas.html';  // Redirigir después de ejecutar la lógica
        });
      }
    } else {
      alert("No se encontraron detalles de la reserva.");
    }
  }

  // Función para cambiar el estado de la reserva y enviar el mensaje de WhatsApp
  async function cambiarEstadoReserva(reservaId, nuevoEstado, tipoMensaje) {
    const reservaRef = doc(db, 'reservas', reservaId);
    await updateDoc(reservaRef, { estado: nuevoEstado });

    const reservaDoc = await getDoc(reservaRef);
    const reservaData = reservaDoc.data();

    let mensaje = '';

    if (tipoMensaje === 'aceptado') {
      mensaje = `¡Hola ${reservaData.nombre}! Inflables Hiram le informa que su reserva ha sido confirmada. Por favor, revisa y acepta el contrato en el siguiente enlace: https://csrtech-studio.github.io/Hiram-Inflables/contrato.html?id=${reservaId}`;
    } else if (tipoMensaje === 'rechazado') {
      mensaje = `
        Estimado/a ${reservaData.nombre},

        Inflables Hiram lamenta informarle que por el momento no podemos ofrecerle el servicio de renta solicitado. Las razones pueden ser las siguientes:
        - La fecha solicitada ya se encuentra reservada para otro cliente.
        - No contamos con el inflable o la máquina solicitada en inventario.

        Le pedimos una disculpa por los inconvenientes causados. Si desea más información o tiene alguna consulta adicional, no dude en contactarnos a este mismo número.

        Atentamente,
        Inflables Hiram
      `;
    }

    const urlWhatsApp = `https://wa.me/${reservaData.telefono}?text=${encodeURIComponent(mensaje)}`;
    console.log('URL WhatsApp:', urlWhatsApp);  // Verificar el enlace de WhatsApp generado

    window.open(urlWhatsApp, '_blank');

    alert(`Estado de la reserva actualizado a: ${nuevoEstado}`);
  }
});

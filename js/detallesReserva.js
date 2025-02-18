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
  // Cargar el cliente de Google API para Calendar
  gapi.load('client:auth2', initClient);

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
            <p><strong>Estado:</strong> ${reservaData.estado}</p>
        `;

        const aceptarBtn = document.getElementById('aceptar-reserva');
        const rechazarBtn = document.getElementById('rechazar');

        if (reservaData.estado === 'Confirmado') {
            // Si la reserva está confirmada, cambiar el botón a "Concluir Reserva"
            aceptarBtn.textContent = "Concluir Reserva";
            rechazarBtn.style.display = "none"; // Ocultar botón de cancelar

            aceptarBtn.addEventListener('click', async () => {
                await concluirReserva(reservaDoc.id, reservaData);
                window.location.href = 'reservas.html';
            });
        } else {
            // Asignar el evento para aceptar la reserva y crear el evento en Google Calendar
            aceptarBtn.addEventListener('click', async () => {
              // Cambia el estado de la reserva a 'Confirmado'
              await cambiarEstadoReserva(reservaDoc.id, 'Confirmado', 'aceptado');
              // Crea el evento en Google Calendar usando los datos de la reserva
              createGoogleCalendarEvent(reservaData);
              window.location.href = 'reservas.html';
      
            
            });

            rechazarBtn.addEventListener('click', async () => {
                await cambiarEstadoReserva(reservaDoc.id, 'Cancelado', 'rechazado');
                window.location.href = 'reservas.html';
            });
        }
    } else {
        alert("No se encontraron detalles de la reserva.");
    }
  }

  // 📌 Concluir reserva (Mover a 'reservasTerminadas' y eliminar de 'reservas')
  async function concluirReserva(reservaId, reservaData) {
    const reservaTerminadaRef = doc(db, 'reservasTerminadas', reservaId);
    await setDoc(reservaTerminadaRef, reservaData);
    await deleteDoc(doc(db, 'reservas', reservaId));

    alert("Reserva concluida y archivada.");
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

  // Función para inicializar el cliente de Google API
  function initClient() {
    gapi.client.init({
      apiKey: 'AIzaSyA8qmHB5tR3EhU4fL1bz7hvpDiz_yCFiHg',
      clientId: '511457956407-jrl7c2adt3nvctuv77k0mocu9o7i961n.apps.googleusercontent.com',
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
      scope: "https://www.googleapis.com/auth/calendar.events"
    }).then(() => {
      // Si el usuario aún no ha iniciado sesión, se le solicita hacerlo.
      if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        gapi.auth2.getAuthInstance().signIn();
      }
    }).catch(error => {
      console.error("Error al inicializar gapi client", error);
    });
  }
  
  

  // Función para crear un evento en Google Calendar
  function createGoogleCalendarEvent(reservaData) {
    // Combina la fecha y hora de la reserva para crear el objeto Date de inicio
    const startDateTime = new Date(`${reservaData.fecha}T${reservaData.hora}:00`);
    // Suponemos una duración de 1 hora para el evento (ajusta según necesites)
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
    
    // Configuramos el objeto del evento
    const event = {
      summary: 'Reserva - ' + reservaData.nombre, // Aquí se guarda el nombre del cliente
      description: `Reserva confirmada.
  Teléfono: ${reservaData.telefono}
  Dirección: ${reservaData.direccion}`, // Puedes agregar más detalles si lo deseas
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  
    // Inserta el evento en el calendario principal del usuario
    gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event
    }).then((response) => {
      console.log('Evento creado en Google Calendar:', response);
    }).catch((error) => {
      console.error("Error al crear el evento en Google Calendar", error);
    });
  }  
});
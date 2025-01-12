import { db } from './firebaseConfig.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Referencia a la colección "reservas"
const reservasCollection = collection(db, 'reservas');

document.addEventListener('DOMContentLoaded', function () {
  setupDateRestriction();
  setupFormularioHandler();
  setupImagenesModal();
});

// Función para establecer la restricción de fecha mínima
function setupDateRestriction() {
  const fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    const hoy = new Date();
    const hoyString = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    fechaInput.setAttribute('min', hoyString);
  }
}

// Configura el manejador del formulario
function setupFormularioHandler() {
  const formulario = document.getElementById('contact-form');
  if (!formulario) {
    console.error('Formulario no encontrado');
    return;
  }

  formulario.addEventListener('submit', async function (event) {
    event.preventDefault();

    const datos = obtenerDatosFormulario();
    if (!datos) return; // Detener si faltan datos

    try {
      // Guardar datos en Firestore
      await addDoc(reservasCollection, {
        ...datos,
        estado: 'Pendiente',
        timestamp: new Date()
      });

      // Limpiar formulario y mostrar mensaje de éxito
      formulario.reset();
      mostrarMensajeEmergente('🎉 ¡Reserva enviada correctamente! 🎈');

      // Redirigir a WhatsApp
      enviarMensajeWhatsApp(datos);
    } catch (error) {
      console.error('Error al guardar la reserva:', error);
      alert('Ocurrió un error al enviar la reserva.');
    }
  });
}

// Obtiene los datos del formulario
function obtenerDatosFormulario() {
  const nombre = document.getElementById('nombre').value;
  const telefono = document.getElementById('telefono').value;
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;
  const paquete = document.getElementById('paquete').value;
  const direccion = document.getElementById('direccion').value;

  if (!nombre || !telefono || !fecha || !hora || !paquete || !direccion) {
    alert('Por favor, completa todos los campos.');
    return null;
  }

  return { nombre, telefono, fecha, hora, paquete, direccion };
}

// Envía el mensaje a WhatsApp
function enviarMensajeWhatsApp({ nombre, telefono, fecha, hora, paquete, direccion }) {
  const mensaje = `*Hola Hiram Inflables, soy ${nombre}.*

Me gustaría reservar el servicio de renta de inflables para el evento el *${fecha}* a las *${hora}*.

*Mis datos son los siguientes:*
- *Teléfono:* ${telefono}
- *Paquete seleccionado:* ${paquete}
- *Dirección del evento:* ${direccion}

Por favor, *contáctenme para confirmar la reserva.* ¡Gracias!`;

  const urlWhatsApp = `https://wa.me/+5218117604609?text=${encodeURIComponent(mensaje)}`;
  window.location.href = urlWhatsApp;
}

// Muestra un mensaje emergente en el centro de la pantalla
function mostrarMensajeEmergente(texto) {
  const mensaje = document.createElement('div');
  mensaje.textContent = texto;
  mensaje.style.position = 'fixed';
  mensaje.style.top = '50%';
  mensaje.style.left = '50%';
  mensaje.style.transform = 'translate(-50%, -50%)';
  mensaje.style.backgroundColor = '#ff9800';
  mensaje.style.color = 'white';
  mensaje.style.padding = '20px';
  mensaje.style.borderRadius = '10px';
  mensaje.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  mensaje.style.fontSize = '20px';
  mensaje.style.fontWeight = 'bold';
  mensaje.style.textAlign = 'center';
  mensaje.style.zIndex = '1000';
  mensaje.style.animation = 'fadeOut 3s forwards';

  document.body.appendChild(mensaje);

  // Eliminar el mensaje después de 3 segundos
  setTimeout(() => {
    mensaje.remove();
  }, 3000);
}

// Configura el manejo del modal de imágenes
function setupImagenesModal() {
  const modal = document.getElementById('imagenModal');
  const modalImg = document.getElementById("img01");
  const images = document.querySelectorAll('.imagen-expandible');
  const closeBtn = document.querySelector('.cerrar');

  if (!modal || !modalImg || !images.length || !closeBtn) {
    console.error('Modal o elementos relacionados no encontrados');
    return;
  }

  images.forEach(function (image) {
    image.addEventListener('click', function () {
      modal.style.display = "block";
      modalImg.src = this.src;
    });
  });

  closeBtn.addEventListener('click', function () {
    modal.style.display = "none";
  });

  window.addEventListener('click', function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  });
}

import { db } from './firebaseConfig.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Referencia a la colección "reservas"
const reservasCollection = collection(db, 'reservas');

document.addEventListener('DOMContentLoaded', function () {
  setupDateRestriction();
  setupFormularioHandler();
  cargarProductosEnTabla();

  // Mostrar/Ocultar campo de municipio personalizado
  const municipioSelect = document.getElementById('municipio');
  municipioSelect.addEventListener('change', function(){
    const municipioOtroDiv = document.getElementById('municipioOtro');
    if (this.value === 'Otro') {
      municipioOtroDiv.style.display = 'block';
    } else {
      municipioOtroDiv.style.display = 'none';
    }
  });
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

    // Obtener los productos seleccionados y el precio total de sessionStorage
    const productosSeleccionados = JSON.parse(sessionStorage.getItem('productosSeleccionados')) || [];
    const total = parseFloat(sessionStorage.getItem('sumaTotal')) || 0;

    // Agregar los productos adicionales y el costo total a los datos
    datos.adicionales = productosSeleccionados;
    datos.total = total;

    try {
      // Guardar datos en Firestore
      await addDoc(reservasCollection, {
        ...datos,
        estado: 'Pendiente',
        timestamp: new Date()
      });

      // Limpiar sessionStorage y el formulario
      sessionStorage.removeItem('productosSeleccionados');
      sessionStorage.removeItem('sumaTotal');
      formulario.reset();

      // Mostrar mensaje de éxito
      mostrarMensajeEmergente('🎉 ¡Reserva enviada correctamente! 🎈');

      // Redirigir a WhatsApp
      enviarMensajeWhatsApp(datos);
    } catch (error) {
      console.error('Error al guardar la reserva:', error);
      alert('Ocurrió un error al enviar la reserva.');
    }
  });
}

// Obtiene los datos del formulario (actualizado para incluir municipio y validar teléfono)
function obtenerDatosFormulario() {
  const nombre = document.getElementById('nombre').value.trim();
  let telefono = document.getElementById('telefono').value.replace(/\D/g, ""); // Elimina espacios y caracteres no numéricos
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;

  // Validar teléfono (debe ser exactamente 10 dígitos)
  if (telefono.length !== 10) {
    alert('El número de teléfono debe tener exactamente 10 dígitos.');
    return null;
  }

  // Recoger municipio
  const municipioSelect = document.getElementById('municipio').value;
  let municipio = municipioSelect;
  if (municipioSelect === 'Otro') {
    const municipioPersonalizado = document.getElementById('municipioPersonalizado').value.trim();
    if (!municipioPersonalizado) {
      alert('Por favor, ingresa el municipio.');
      return null;
    }
    municipio = municipioPersonalizado;
  }

  const direccion = document.getElementById('direccion').value.trim();

  if (!nombre || !telefono || !fecha || !hora || !direccion) {
    alert('Por favor, completa todos los campos.');
    return null;
  }

  return { nombre, telefono, fecha, hora, municipio, direccion };
}

// Envía el mensaje a WhatsApp (se agrega el municipio al mensaje)
function enviarMensajeWhatsApp({ nombre, telefono, fecha, hora, municipio, direccion, adicionales, total }) {
  let mensaje = `*Hola Hiram Inflables, soy ${nombre}.*\n\n`;
  mensaje += `Me gustaría reservar el servicio de renta de inflables para el evento el *${fecha}* a las *${hora}*.\n\n`;
  mensaje += `*Mis datos son los siguientes:*\n`;
  mensaje += `- *Teléfono:* ${telefono}\n`; // Ahora está limpio y con 10 dígitos
  mensaje += `- *Municipio:* ${municipio}\n`;
  mensaje += `- *Dirección del evento:* ${direccion}\n`;

  if (adicionales.length > 0) {
    mensaje += `\n*Productos seleccionados:*\n`;
    adicionales.forEach(adicional => {
      mensaje += `- ${adicional.nombre} - $${adicional.precio}\n`;
    });
  }

  mensaje += `\n*Total a pagar:* $${total}\n\n`;
  mensaje += `Por favor, *contáctenme para confirmar la reserva.* ¡Gracias!`;

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
  mensaje.style.backgroundColor = '#4caf50';
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

  setTimeout(() => {
    mensaje.remove();
  }, 6000);
}

// Carga los productos seleccionados en la tabla
function cargarProductosEnTabla() {
  const tablaProductos = document.querySelector('#tabla-productos tbody');
  const totalPrecio = document.getElementById('precio');
  let productosSeleccionados = JSON.parse(sessionStorage.getItem('productosSeleccionados')) || [];

  function actualizarTabla() {
    tablaProductos.innerHTML = ''; // Limpiar tabla
    let total = 0;

    if (productosSeleccionados.length > 0) {
      productosSeleccionados.forEach((producto, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${producto.nombre}</td>
          <td>$${producto.precio}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${index})">Eliminar</button>
          </td>
        `;
        tablaProductos.appendChild(row);
        total += producto.precio;
      });
    } else {
      tablaProductos.innerHTML = '<tr><td colspan="3">No hay productos seleccionados.</td></tr>';
    }

    totalPrecio.textContent = `Total: $${total}`;
totalPrecio.style.fontSize = "1.8em"; // Ajusta el tamaño según necesites
totalPrecio.style.fontWeight = "bold"; // Negritas

    totalPrecio.textContent = `Total: $${total}`;
    sessionStorage.setItem('sumaTotal', total); // Actualizar total en sessionStorage
  }

  window.eliminarProducto = function (index) {
    if (index >= 0 && index < productosSeleccionados.length) {
      productosSeleccionados.splice(index, 1);
      sessionStorage.setItem('productosSeleccionados', JSON.stringify(productosSeleccionados));
      actualizarTabla();
    }
  };

  actualizarTabla();
}


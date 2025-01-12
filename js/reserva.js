import { db } from './firebaseConfig.js';
import { collection, getDocs, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const reservasTable = document.getElementById('reservas-lista');

  if (!reservasTable) {
    console.error('Tabla no encontrada');
    return;
  }

  // Referencia a la colección "reservas"
  const reservasCollection = collection(db, 'reservas');

  try {
    // Obtener las reservas desde Firestore
    const snapshot = await getDocs(reservasCollection);

    snapshot.forEach((doc) => {
      const reserva = doc.data();
      const reservaId = doc.id;

      // Crear una fila para la tabla
      const row = document.createElement('tr');

      // Insertar datos en las celdas
      row.innerHTML = `
        <td>${reserva.nombre}</td>
        <td>${reserva.telefono}</td>
        <td>${reserva.fecha}</td>
        <td>${reserva.hora}</td>
        <td>${reserva.paquete}</td>
        <td>${reserva.direccion}</td>
        <td>
          <button class="btn btn-success aceptar-btn" data-id="${reservaId}" data-nombre="${reserva.nombre}" data-telefono="${reserva.telefono}" data-fecha="${reserva.fecha}" data-hora="${reserva.hora}">Aceptar</button>
          <button class="btn btn-danger rechazar-btn" data-id="${reservaId}">Rechazar</button>
        </td>
      `;

      // Agregar la fila a la tabla
      reservasTable.appendChild(row);
    });

    // Agregar eventos a los botones
    document.querySelectorAll('.aceptar-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        console.log(`Botón de aceptación clickeado para reserva ID: ${id}`);
        await updateReservaEstado(id, 'Aceptada');
    
        // Obtén los datos de la reserva para generar el contrato
        const reserva = await getReservaById(id); // Asegúrate de tener esta función para obtener los datos de reserva
        generarContrato(reserva.nombre, reserva.telefono, reserva.fecha, reserva.hora);
      });
    });

    document.querySelectorAll('.rechazar-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        console.log(`Reserva rechazada con ID: ${id}`);
        await updateReservaEstado(id, 'Rechazada');
      });
    });
  } catch (error) {
    console.error('Error al cargar las reservas:', error);
  }
});

// Función para actualizar el estado de la reserva
async function updateReservaEstado(id, estado) {
  try {
    const reservaRef = doc(db, 'reservas', id);
    await updateDoc(reservaRef, { estado });
    alert(`Reserva ${estado.toLowerCase()} correctamente.`);
  } catch (error) {
    console.error(`Error al actualizar la reserva ${id}:`, error);
    alert('Ocurrió un error al actualizar la reserva.');
  }
}

async function getReservaById(id) {
  try {
    const reservaRef = doc(db, 'reservas', id);
    const docSnap = await getDoc(reservaRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No se encontró el documento de la reserva.");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener la reserva:", error);
  }
}

function generarContrato(nombre, telefono, fecha, hora) {
  try {
    console.log("Iniciando la generación del contrato...");

    // Verifica si jsPDF está disponible
    if (typeof window.jspdf === 'undefined') {
      console.error("jsPDF no está cargado correctamente.");
      alert("Error al cargar jsPDF. Por favor, intente nuevamente.");
      return;
    }

    const { jsPDF } = window.jspdf; // Obtener jsPDF desde window.jspdf
    const doc = new jsPDF();
    console.log("Documento PDF creado");

    // Título del contrato
    doc.setFontSize(16);
    doc.text("CONTRATO DE SERVICIO DE RENTA DE INFLABLES", 20, 20);
    console.log("Título del contrato agregado");

    // Datos del cliente
    doc.setFontSize(12);
    doc.text(`Cliente: ${nombre}`, 20, 40);
    doc.text(`Teléfono: ${telefono}`, 20, 50);
    doc.text(`Fecha del evento: ${fecha}`, 20, 60);
    doc.text(`Hora del evento: ${hora}`, 20, 70);
    console.log("Datos del cliente agregados");

    // Información del contrato
    doc.text("El presente contrato tiene como objetivo la renta de inflables para el evento mencionado.", 20, 80);
    doc.text("El cliente acepta las siguientes condiciones:", 20, 90);
    doc.text("- La empresa proveerá el inflable acordado y se encargará del transporte y montaje.", 20, 100);
    doc.text("- El cliente se compromete a mantener el inflable en condiciones adecuadas durante el evento.", 20, 110);
    doc.text("- En caso de daños al equipo, el cliente deberá hacerse responsable de los gastos de reparación.", 20, 120);
    doc.text("- La cancelación de la reserva debe hacerse con al menos 48 horas de anticipación.", 20, 130);
    console.log("Condiciones del contrato agregadas");

    // Protección para la empresa y el cliente
    doc.text("Ambas partes están de acuerdo con los términos y condiciones del presente contrato.", 20, 140);
    doc.text("Este contrato está sujeto a las leyes vigentes de protección al consumidor y responsabilidades legales.", 20, 150);
    console.log("Protección y condiciones legales agregadas");

    // Firma (se puede personalizar más adelante)
    doc.text("Firma del cliente: _______________________________", 20, 160);
    doc.text("Firma de la empresa: ______________________________", 20, 170);
    console.log("Sección de firmas agregada");

    // Generar y mostrar el PDF
    const pdfUrl = doc.output('bloburl');
    console.log("URL del PDF generado:", pdfUrl);

    // Crear un contenedor para el PDF
    const contratoDiv = document.createElement('div');
    contratoDiv.classList.add('contract-container');

    // Crear un iframe para mostrar el PDF
    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.width = '100%';
    iframe.height = '500px';
    contratoDiv.appendChild(iframe);

    // Insertar el contenedor en la página
    const contractContainer = document.getElementById('contract-container');
    if (contractContainer) {
      contractContainer.innerHTML = ''; // Limpiar cualquier contenido previo
      contractContainer.appendChild(contratoDiv);
      console.log("PDF insertado en el contenedor.");
    } else {
      console.error("No se encontró el contenedor para el contrato.");
    }

    // Crear un enlace directo para abrir el PDF
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.target = '_blank';
    link.innerText = 'Haz clic aquí para ver el contrato en una nueva pestaña';
    contratoDiv.appendChild(link);

    // Crear un botón para enviar el contrato por WhatsApp
    const whatsappButton = document.createElement('button');
    whatsappButton.innerText = 'Enviar contrato por WhatsApp';
    whatsappButton.classList.add('btn', 'btn-primary');
    whatsappButton.onclick = () => {
      enviarWhatsApp(pdfUrl, telefono);
    };

    contratoDiv.appendChild(whatsappButton);

    alert("El contrato se ha generado correctamente.");

  } catch (error) {
    console.error("Error al generar el contrato:", error);
  }
}

// Función para enviar el contrato por WhatsApp
function enviarWhatsApp(pdfUrl, telefono) {
  try {
    console.log("Iniciando el envío de mensaje de WhatsApp...");

    // Asegúrate de que el teléfono tiene el formato adecuado (sin símbolos ni guiones)
    const telefonoFormateado = telefono.replace(/[^0-9]/g, ''); // Elimina todo lo que no sea número
    console.log("Teléfono formateado:", telefonoFormateado);

    if (!telefonoFormateado || telefonoFormateado.length < 10) {
      console.error("El número de teléfono es inválido.");
      alert("Número de teléfono inválido. Por favor, revisa el número.");
      return;
    }

    // Mensaje a enviar por WhatsApp
    const mensaje = `Hola, tu contrato de servicio de renta de inflables ha sido generado. Puedes verlo aquí: ${pdfUrl}`;
    console.log("Mensaje generado:", mensaje);

    // Crear la URL para WhatsApp
    const url = `https://wa.me/${telefonoFormateado}?text=${encodeURIComponent(mensaje)}`;
    console.log("URL de WhatsApp generada:", url);

    // Verificar si la URL está bien formada
    if (!url.startsWith("https://wa.me/")) {
      console.error("La URL de WhatsApp no está bien formada.");
      alert("Error al generar la URL de WhatsApp.");
      return;
    }

    // Abrir la URL en una nueva pestaña
    console.log("Abriendo WhatsApp...");
    window.open(url, '_blank');
    console.log("Mensaje de WhatsApp enviado.");
  } catch (error) {
    console.error("Error al enviar el mensaje de WhatsApp:", error);
    alert("Ocurrió un error al intentar enviar el mensaje de WhatsApp.");
  }
}

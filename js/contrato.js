import { db } from './firebaseConfig.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

// Obtener el ID de la reserva desde la URL
const urlParams = new URLSearchParams(window.location.search);
const reservaId = urlParams.get('id');

if (reservaId) {
  cargarContrato(reservaId);
} else {
  alert('ID de reserva no válido.');
}

// Función para calcular la hora de término (sumar 4 horas)
function calcularFechaTermino(horaInicio) {
  const [hora, minuto] = horaInicio.split(':').map(Number); // Separar la hora y el minuto
  const fecha = new Date();
  fecha.setHours(hora + 4, minuto, 0, 0); // Sumar 4 horas
  const horaTermino = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Formato HH:MM
  return horaTermino;
}

// Cargar los detalles del contrato
async function cargarContrato(id) {
  const reservaRef = doc(db, 'reservas', id);
  const reservaDoc = await getDoc(reservaRef);

  if (reservaDoc.exists()) {
    const reservaData = reservaDoc.data();
    const horaTermino = calcularFechaTermino(reservaData.hora); // Calcular la hora de término

    // Mostrar detalles en el HTML
    document.getElementById('cliente-info').innerHTML = `
      <strong>Cliente:</strong> ${reservaData.nombre}<br>
      <strong>Teléfono:</strong> ${reservaData.telefono}<br>
      <strong>Fecha del evento:</strong> ${reservaData.fecha}<br>
      <strong>Hora del evento:</strong> ${reservaData.hora}<br>
      <strong>Hora de término:</strong> ${horaTermino}<br>
      <strong>Dirección:</strong> ${reservaData.direccion}<br>
      <strong>Costo total:</strong> $${reservaData.total}<br>
    `;

    // Mostrar servicios adicionales
    if (reservaData.adicionales && reservaData.adicionales.length > 0) {
      let adicionalesHTML = "<strong>Servicios solicitados:</strong><ul>";
      reservaData.adicionales.forEach(servicio => {
        adicionalesHTML += `<li>${servicio.nombre}: $${servicio.precio}</li>`;
      });
      adicionalesHTML += "</ul>";
      document.getElementById('adicionales-info').innerHTML = adicionalesHTML;
    }

    document.getElementById('costo-total').innerText = `$${reservaData.total}`;

    // Verificar el estado de la reserva
    if (reservaData.estado === 'Autorizado') {
      // Ocultar los botones de "Aceptar" y "Rechazar"
      document.getElementById('aceptar').style.display = 'none';
      document.getElementById('rechazar').style.display = 'none';

      // Mostrar solo el botón de "Descargar PDF"
      document.getElementById('descargar-pdf').style.display = 'block';
    } else {
      // Mostrar los botones de "Aceptar" y "Rechazar"
      document.getElementById('aceptar').style.display = 'block';
      document.getElementById('rechazar').style.display = 'block';

      // Ocultar el botón de "Descargar PDF"
      document.getElementById('descargar-pdf').style.display = 'none';

      // Aceptar el contrato
      document.getElementById('aceptar').addEventListener('click', async () => {
        await updateDoc(reservaRef, { estado: 'Autorizado' });
        generarPDF(reservaData, horaTermino); // Pasar la hora de término
        alert('Contrato aceptado. ¡Gracias!');
      });
    }

    // Descargar el PDF cuando se haga clic en el botón
    document.getElementById('descargar-pdf').addEventListener('click', () => {
      generarPDF(reservaData, horaTermino); // Pasar la hora de término
    });
  } else {
    alert('No se encontraron detalles de la reserva.');
  }
}

// Función para generar el PDF con la hora de término
function generarPDF(datos, horaTermino) {
  const { jsPDF } = window.jspdf;
  const { nombre, telefono, fecha, hora, direccion, total, adicionales } = datos;
  const doc = new jsPDF();

  // Encabezado
  doc.setFontSize(16);
  doc.text('CONTRATO DE SERVICIO DE RENTA DE INFLABLES', 20, 40);
  doc.addImage('img/logo.png', 'PNG', 150, 10, 40, 20);

  // Detalles del cliente en la misma línea
  doc.setFontSize(12);
  doc.text(`Cliente: ${nombre}`, 20, 50);
  doc.text(`Teléfono: ${telefono}`, 120, 50);

  // Fecha y hora en la misma línea
  doc.text(`Fecha del evento: ${fecha}`, 20, 60);
  doc.text(`Hora del evento: ${hora}`, 120, 60);

  // Hora de término
  doc.text(`Hora de término: ${horaTermino}`, 20, 70);

  // Dirección
  doc.text(`Dirección: ${direccion}`, 20, 80);
  
  // Costo total
  doc.text(`Costo total: $${total}`, 20, 90);

  // Servicios adicionales
  if (adicionales && adicionales.length > 0) {
    doc.text('Servicios solicitados:', 20, 100);
    let yPosition = 110;
    adicionales.forEach(servicio => {
      doc.text(`- ${servicio.nombre}: $${servicio.precio}`, 20, yPosition);
      yPosition += 10;
    });
  }

  // Cláusulas
  doc.setFontSize(8);
  doc.text('Cláusulas:', 20, 125);
  
  const clausulas = [
    '1. Objeto del contrato: La empresa Inflables Hiram se compromete a proporcionar los inflables y servicios adicionales acordados, encargándose del transporte, montaje y desmontaje al finalizar el evento.',
    '2. Responsabilidad del cliente: El cliente se compromete a mantener el inflable en condiciones óptimas durante el evento y se responsabiliza de cualquier daño o pérdida ocasionada al equipo.',
    '3. Horas extra: En caso de requerir tiempo adicional al establecido en el contrato, el cliente acepta pagar $100 MXN por cada hora extra de servicio.',
    '4. Cancelaciones: La cancelación de la reserva debe realizarse con al menos 48 horas de anticipación. En caso contrario, el cliente acepta la pérdida del anticipo pagado.',
    '5. Cláusula de daños: Cualquier daño al equipo será evaluado por Inflables Hiram y el cliente deberá cubrir los costos de reparación o reposición dentro de los cinco días hábiles posteriores al evento.',
    '6. Fuerza mayor: Ambas partes acuerdan que eventos fuera de su control (como fenómenos naturales) eximirán a las partes de sus obligaciones, sin penalización alguna por ambas partes.'
  ];

  let yPosition = 130;
  const lineHeight = 6;  // Espacio entre cada línea de texto
  const maxHeight = 270;  // Altura máxima antes de saltar a una nueva página

  clausulas.forEach(clausula => {
    // Dividir automáticamente el texto largo en varias líneas
    const lines = doc.splitTextToSize(clausula, 180); // Ajustamos el tamaño máximo de la línea
    lines.forEach(line => {
      // Verificar si se ha alcanzado el final de la página
      if (yPosition + lineHeight > maxHeight) {
        doc.addPage();  // Salto de página
        yPosition = 20;  // Reseteamos la posición vertical
      }
      doc.text(line, 20, yPosition);
      yPosition += lineHeight;
    });
  });

  // Firma
  doc.text('Firma de la empresa:', 20, yPosition + 10); 
  doc.addImage('img/firma.png', 'PNG', 20, yPosition + 15, 50, 15); 
  doc.text('_________________________________', 20, yPosition + 30);
  doc.text('Representante Legal', 20, yPosition + 40);
  doc.text('Inflables Hiram', 20, yPosition + 50);

  // Guardar PDF
  doc.save(`Contrato_${nombre}.pdf`);
}

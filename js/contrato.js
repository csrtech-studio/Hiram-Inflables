import { auth,db } from "./firebaseConfig.js";
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
import { signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
// Inicia sesión de forma anónima
signInAnonymously(auth)
  .then(() => {
    console.log("Autenticación anónima exitosa");
    // Una vez autenticado, espera a que se detecte el cambio de estado
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Ahora se puede realizar la lectura de "reservas"
        leerReservas();
      }
    });
  })
  .catch((error) => {
    console.error("Error en la autenticación anónima:", error);
  });

function leerReservas() {
  const reservasRef = collection(db, "reservas");
  getDocs(reservasRef)
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        console.log(doc.id, " => ", doc.data());
      });
    })
    .catch((error) => {
      console.error("Error al leer reservas:", error);
    });
}


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
  fecha.setHours(hora + 6, minuto, 0, 0); // Sumar 4 horas
  const horaTermino = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Formato HH:MM
  return horaTermino;
}

function formatearFecha(fechaStr) {
  const [year, month, day] = fechaStr.split("-");
  // Importante: el mes en el objeto Date es 0-indexado (0 = enero)
  const fecha = new Date(year, month - 1, day);
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}


// Cargar los detalles del contrato
async function cargarContrato(id) {
  const reservaRef = doc(db, 'reservas', id);
  const reservaDoc = await getDoc(reservaRef);
  if (reservaDoc.exists()) {
    const reservaData = reservaDoc.data();
    const horaTermino = calcularFechaTermino(reservaData.hora); // Calcular la hora de término
    const fechaFormateada = formatearFecha(reservaData.fecha);

    // Verificar si la reserva está cancelada
if (reservaData.estado === 'Cancelado') {
  alert('❌ No hay un contrato disponible para aceptar. La reserva fue cancelada anteriormente.');

  // Redirigir al index.html después de 3 segundos
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 3000);

  return; // Salir de la función para que no siga ejecutando el código
}

    // Mostrar detalles en el HTML
    document.getElementById('cliente-info').innerHTML = `
      <strong>Cliente:</strong> ${reservaData.nombre}<br>
      <strong>Teléfono:</strong> ${reservaData.telefono}<br>
      <strong>Fecha del evento:</strong> ${fechaFormateada}<br>
      <strong>Hora del evento:</strong> ${reservaData.hora}<br>
      <strong>Hora de término:</strong> ${horaTermino}<br>
      <strong>Dirección:</strong> ${reservaData.direccion}<br>
      <strong>Municipio:</strong> ${reservaData.municipio || " Santa Catarina"}<br>
      <strong>Costo Flete:</strong> $${reservaData.flete || "No Aplica"}<br>
      <strong>Descuento:</strong> ${reservaData.descuento || "No Aplica"}%<br>
      <strong>Anticipo:</strong> $${reservaData.anticipo || "No Aplica"}<br>
      <strong>Costo Restante</strong> $${reservaData.total}<br>
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
        try {
          await updateDoc(reservaRef, { estado: 'Autorizado' });
    
          // Esperar a que se genere el PDF
          await generarPDF(reservaData, horaTermino, fechaFormateada);
    
          // Esperar a que se envíe el correo
          await enviarCorreo(reservaData, fechaFormateada, horaTermino);
    
          alert('✅ Contrato Aceptado. ¡Muchas Gracias! Nos vemos en el evento. Inflables Hiram te desea un Bonito Día 🎈');
    
          // Esperar 3 segundos antes de recargar la página
          setTimeout(() => {
            location.reload();
          }, 3000);
        } catch (error) {
          console.error('Error en el proceso:', error);
          alert('❌ Hubo un problema al procesar la solicitud. Inténtalo de nuevo.');
        }
      });
    
      // Rechazar el contrato
      document.getElementById('rechazar').addEventListener('click', async () => {
        try {
          await updateDoc(reservaRef, { estado: 'Cancelado' });
    
          alert('⚠️ ¡Lamentamos que hayas cancelado tu reserva! 😔\n\nSi en el futuro decides realizar tu evento con nosotros, estaremos encantados de atenderte. No dudes en contactarnos cuando lo necesites. 🎈🎊');
    
          // Cerrar sesión anónima en Firebase
          await signOut(auth);
    
          // Ocultar todos los botones para evitar más acciones
          document.getElementById('aceptar').style.display = 'none';
          document.getElementById('rechazar').style.display = 'none';
          document.getElementById('descargar-pdf').style.display = 'none';
    
        } catch (error) {
          console.error('Error al cancelar la reserva:', error);
          alert('❌ Hubo un problema al cancelar la reserva. Inténtalo de nuevo.');
        }
      });
    }
    

    // Descargar el PDF cuando se haga clic en el botón
    document.getElementById('descargar-pdf').addEventListener('click', () => {
      generarPDF(reservaData, horaTermino, fechaFormateada); // Pasar la hora de término y la fecha formateada
    });
  } else {
    alert('No se encontraron detalles de la reserva.');
  }
}

function enviarCorreo(reserva, fechaFormateada, horaTermino) {
  const emailParams = {
    to_name: reserva.nombre,
    fecha: fechaFormateada,
    hora: reserva.hora,
    hora_termino: horaTermino,
    direccion: reserva.direccion,
    total: reserva.total
  };

  console.log("Enviando correo con parámetros:", emailParams);

  emailjs.send("service_f2yvtv4", "template_5ayvdj9", emailParams)
    .then((response) => {
      console.log("Correo enviado correctamente:", response);
    })
    .catch((error) => {
      console.error("Error enviando correo:", error);
    });
}



// Función para generar el PDF con la hora de término y la fecha formateada
function generarPDF(datos, horaTermino, fechaFormateada) {
  const { jsPDF } = window.jspdf;
  const { nombre, telefono, hora, direccion, municipio, flete, descuento, anticipo, total, adicionales } = datos;
  const doc = new jsPDF();

  // Encabezado
  doc.setFontSize(16);
  doc.text('CONTRATO DE SERVICIO DE RENTA DE INFLABLES', 20, 40);
  doc.addImage('img/logo.png', 'PNG', 150, 10, 40, 20);

  // Detalles del cliente
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 20, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`${nombre}`, 45, 50);

  //Telefono
  doc.setFont('helvetica', 'bold');
  doc.text('Teléfono:', 130, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`${telefono}`, 170, 50);

  // Fecha y hora del evento
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', 20, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(`${fechaFormateada}`, 45, 70);

  doc.setFont('helvetica', 'bold');
  doc.text('Hora del evento:', 130, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`${hora}`, 170, 60);

  // Hora de término
  doc.setFont('helvetica', 'bold');
  doc.text('Hora de término:', 130, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(`${horaTermino}`, 170, 70);

  // Dirección
  doc.setFont('helvetica', 'bold');
  doc.text('Dirección:', 20, 60);
  doc.setFont('helvetica', 'normal');
  const anchoMaximo = 80; // Ajusta el ancho máximo según tus necesidades
  const direccionLineas = doc.splitTextToSize(direccion, anchoMaximo);
  doc.text(direccionLineas, 45, 60);

  // Municipio
  doc.setFont('helvetica', 'bold');
  doc.text('Municipio:', 20, 80);
  doc.setFont('helvetica', 'norm1al')
  doc.text(`${municipio}`, 45, 80);

  // Flete
  doc.setFont('helvetica', 'bold');
  doc.text('Flete:', 20, 90);
  doc.setFont('helvetica', 'norm1al');
  doc.text(`$${flete|| "No Aplica"}`, 45, 90);

  // Descuento
  doc.setFont('helvetica', 'bold');
  doc.text('Descuento:', 130, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`${descuento|| "No Aplica"}%`, 170, 80);

  // Anticipo
  doc.setFont('helvetica', 'bold');
  doc.text('Anticipo:', 130, 90);
  doc.setFont('helvetica', 'normal');
  doc.text(`$${anticipo|| "No Aplica"}`, 170, 90);

  // Costo total
  doc.setFont('helvetica', 'bold');
  doc.text('Costo Restante:', 130, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`$${total}`, 170, 100);

  // Servicios adicionales en columnas
if (adicionales && adicionales.length > 0) {
  doc.setFont('helvetica', 'bold');
  doc.text('Servicios solicitados:', 20, 100);
  doc.setFont('helvetica', 'normal');

  const xInicial = 20;          // Posición horizontal inicial
  let yPosition = 114;          // Posición vertical inicial
  const columnWidth = 60;       // Ancho de cada columna
  const rowHeight = 10;         // Espacio entre filas (se aumentó para evitar empalmes)
  let currentColumn = 0;        // Índice de columna actual

  adicionales.forEach((servicio) => {
    // Si se han llenado 3 columnas, se pasa a la siguiente fila
    if (currentColumn === 3) {
      currentColumn = 0;
      yPosition += rowHeight;
    }
    const textoServicio = `${servicio.nombre}: $${servicio.precio}`;
    // Se utiliza splitTextToSize para dividir el texto si excede el ancho de la columna
    const lineasTexto = doc.splitTextToSize(textoServicio, columnWidth);
    doc.text(lineasTexto, xInicial + (currentColumn * columnWidth), yPosition);
    currentColumn++;
  });
}

// Cláusulas
doc.setFont('helvetica', 'bold');
doc.text('Cláusulas:', 20, 125 + 12);  // Se suma 12 para bajar dos líneas
doc.setFont('helvetica', 'normal');

const clausulas = [
  '1. Objeto del contrato: La empresa Inflables Hiram se compromete a proporcionar los inflables y servicios adicionales acordados, encargándose del transporte, montaje y desmontaje al finalizar el evento.',
  '2. Responsabilidad del cliente: El cliente se compromete a mantener el inflable en condiciones óptimas durante el evento y se responsabiliza de cualquier daño o pérdida ocasionada al equipo.',
  '3. Horas extra: En caso de requerir tiempo adicional al establecido en el contrato, el cliente acepta pagar $80 MXN por cada hora extra de servicio.',
  '4. Cancelaciones: La cancelación de la reserva debe realizarse con al menos 48 horas de anticipación. En caso contrario, el cliente acepta la pérdida del anticipo pagado.',
  '5. Cláusula de daños: Cualquier daño al equipo será evaluado por Inflables Hiram y el cliente deberá cubrir los costos de reparación o reposición dentro de los cinco días hábiles posteriores al evento.',
  '6. Fuerza mayor: Ambas partes acuerdan que eventos fuera de su control (como fenómenos naturales) eximirán a las partes de sus obligaciones, sin penalización alguna por ambas partes.'
];

let yPos = 130 + 12; // Se aumenta en 12 para comenzar dos líneas más abajo
const lineHeight = 6;
const maxHeight = 270;

clausulas.forEach(clausula => {
  const lines = doc.splitTextToSize(clausula, 180);
  lines.forEach(line => {
    if (yPos + lineHeight > maxHeight) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, 20, yPos);
    yPos += lineHeight;
  });
});

// Firma
doc.setFont('helvetica', 'bold');
doc.text('Firma de la empresa:', 20, yPos + 10);
doc.setFont('helvetica', 'normal');
doc.addImage('img/firma.png', 'PNG', 20, yPos + 15, 50, 15);
doc.text('_________________________________', 20, yPos + 30);
doc.text('Representante Legal', 20, yPos + 40);
doc.text('Inflables Hiram', 20, yPos + 50);

// Firma del cliente (a la derecha)
const firmaClienteYPos = yPos + 30; // Mismo nivel que la línea de la firma de la empresa
const firmaClienteXPos = doc.internal.pageSize.getWidth() - 60; // Ajuste para que esté a la derecha

doc.setFont('helvetica', 'bold');
doc.text('Firma del Cliente:', 120, yPos + 10); // Mismo nivel que la línea de la firma
doc.setFont('helvetica', 'normal');
doc.text('_________________________________', 120, yPos + 30); // Línea de firma
doc.text(nombre, 127, yPos + 30); // Nombre del cliente justo sobre la línea
doc.text('Arrendatario', 120, yPos + 40);

// Guardar PDF
doc.save(`Contrato_${nombre}.pdf`);
}


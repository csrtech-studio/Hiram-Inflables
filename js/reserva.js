import { db } from './firebaseConfig.js'; 
import { collection, getDocs, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';

// Verificar si el usuario está autenticado
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Si no está autenticado, redirigir al admin.html
    window.location.href = 'admin.html';
  }
});

const reservasLista = document.getElementById('reservas-lista');
const contractContainer = document.getElementById('contract-container');

async function cargarReservas() {
  const reservasSnapshot = await getDocs(collection(db, 'reservas'));
  const reservas = [];

  reservasSnapshot.forEach(doc => {
    const data = doc.data();
    reservas.push({ id: doc.id, ...data });
  });

  // Ordenar las reservas por estado: Pendiente, Confirmado, Autorizado
  reservas.sort((a, b) => {
    const estados = ['Pendiente', 'Confirmado', 'Autorizado'];
    return estados.indexOf(a.estado) - estados.indexOf(b.estado);
  });

  mostrarReservas(reservas);
  verificarFechasCercanas(reservas); // Verificar fechas después de cargar las reservas
}

function mostrarReservas(reservas) {
  reservasLista.innerHTML = '';
  reservas.forEach(reserva => {
    const row = document.createElement('tr');
    // Comprobar si la reserva está cancelada
    const botonAccion = reserva.estado === 'Cancelado' 
      ? `<button class="btn btn-danger" onclick="eliminarReserva('${reserva.id}')">Eliminar</button>`
      : `<a href="detallesReserva.html?id=${reserva.id}" class="btn btn-info">Ver</a>`;

    row.innerHTML = `
      <td>${reserva.nombre}</td>
      <td>${reserva.fecha}</td>
      <td>${reserva.hora}</td>
      <td>${reserva.estado}</td>
      <td>${botonAccion}</td>
    `;
    reservasLista.appendChild(row);
  });
}

function verificarFechasCercanas(reservas) {
  const advertencias = [];
  const filasConflictivas = new Set(); // Almacena índices de filas en conflicto

  for (let i = 0; i < reservas.length; i++) {
    for (let j = i + 1; j < reservas.length; j++) {
      const fecha1 = new Date(`${reservas[i].fecha}T${reservas[i].hora}`);
      const fecha2 = new Date(`${reservas[j].fecha}T${reservas[j].hora}`);
      const diferencia = Math.abs(fecha1 - fecha2) / (1000 * 60); // Diferencia en minutos

      if (reservas[i].fecha === reservas[j].fecha && diferencia < 60) {
        advertencias.push(
          `Atención: Las reservas de ${reservas[i].nombre} y ${reservas[j].nombre} están a menos de una hora de diferencia.`
        );
        filasConflictivas.add(i);
        filasConflictivas.add(j);
      }
    }
  }

  mostrarAdvertencias(advertencias);
  resaltarFilas(filasConflictivas);
}

function mostrarAdvertencias(advertencias) {
  const advertenciaContainer = document.getElementById('advertencias');
  advertenciaContainer.innerHTML = '';

  if (advertencias.length > 0) {
    advertencias.forEach(advertencia => {
      const label = document.createElement('div');
      label.className = 'alert alert-warning';
      label.textContent = advertencia;
      advertenciaContainer.appendChild(label);
    });
  }
}

function resaltarFilas(filasConflictivas) {
  const filas = document.querySelectorAll('#reservas-lista tr');
  filasConflictivas.forEach(index => {
    filas[index].classList.add('reserva-conflicto');
  });
}

// Función para eliminar la reserva de Firebase
window.eliminarReserva = async function(reservaId) {
  const reservaRef = doc(db, 'reservas', reservaId);

  try {
    await deleteDoc(reservaRef);
    alert("Reserva eliminada correctamente.");
    cargarReservas(); // Volver a cargar las reservas después de la eliminación
  } catch (error) {
    console.error("Error al eliminar la reserva:", error);
    alert("Hubo un error al intentar eliminar la reserva.");
  }
}

// Llamar a cargarReservas al cargar la página
cargarReservas();

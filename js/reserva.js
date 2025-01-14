import { db } from './firebaseConfig.js'; 
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

const reservasLista = document.getElementById('reservas-lista');
const contractContainer = document.getElementById('contract-container');

async function cargarReservas() {
  const reservasSnapshot = await getDocs(collection(db, 'reservas'));
  const reservas = [];

  reservasSnapshot.forEach(doc => {
    const data = doc.data();
    reservas.push({ id: doc.id, ...data });
  });

  mostrarReservas(reservas);
  verificarFechasCercanas(reservas); // Verificar fechas después de cargar las reservas
}

function mostrarReservas(reservas) {
  reservasLista.innerHTML = '';
  reservas.forEach(reserva => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${reserva.nombre}</td>
      <td>${reserva.fecha}</td>
      <td>${reserva.hora}</td>
      <td>${reserva.estado}</td>
      <td><a href="detallesReserva.html?id=${reserva.id}" class="btn btn-info">Ver</a></td>
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

// Llamar a cargarReservas al cargar la página
cargarReservas();

function marcarConflictos() {
  const filas = document.querySelectorAll('#reservas-lista tr');
  const conflictos = [];

  filas.forEach((fila1, index1) => {
    const fechaHora1 = fila1.dataset.fechaHora;
    const [fecha1, hora1] = fechaHora1.split(' ');

    filas.forEach((fila2, index2) => {
      if (index1 !== index2) {
        const fechaHora2 = fila2.dataset.fechaHora;
        const [fecha2, hora2] = fechaHora2.split(' ');

        if (fecha1 === fecha2 && Math.abs(new Date(`1970-01-01T${hora1}`) - new Date(`1970-01-01T${hora2}`)) <= 3600000) {
          if (!conflictos.includes(fila1)) conflictos.push(fila1);
          if (!conflictos.includes(fila2)) conflictos.push(fila2);
        }
      }
    });
  });

  conflictos.forEach(fila => fila.classList.add('reserva-conflicto'));
}

// Ejecutar la función después de cargar la tabla
marcarConflictos();


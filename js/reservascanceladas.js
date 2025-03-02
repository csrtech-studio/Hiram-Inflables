import { db } from './firebaseConfig.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { auth } from './firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {
  // Verificar si el usuario está autenticado
  onAuthStateChanged(auth, user => {
    if (!user) {
      // Si el usuario no está autenticado, redirigir a la página de inicio
      window.location.href = 'no-autenticado.html';
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
    const logoutButton = document.getElementById('logout-button');
  
    if (logoutButton) {
      logoutButton.addEventListener('click', async function () {
        try {
          // Cerrar sesión
          await signOut(auth);
          console.log('Sesión cerrada');
          
          // Redirigir al inicio (index.html) o a la página que desees
          window.location.href = 'index.html';
        } catch (error) {
          console.error('Error al cerrar sesión:', error.message);
        }
      });
    }
  });


async function cargareventosCancelados() {
    const listaReservas = document.getElementById("eventosCanceladosLista");
    listaReservas.innerHTML = ""; // Limpiar la lista antes de agregar nuevos elementos
    let totalSumado = 0; // Variable para acumular el total

    try {
        const reservasSnapshot = await getDocs(collection(db, "eventosCancelados"));
        
        if (reservasSnapshot.empty) {
            listaReservas.innerHTML = "<tr><td colspan='5'>No hay reservas canceladas.</td></tr>";
            return;
        }

        reservasSnapshot.forEach((doc) => {
            const reserva = doc.data();
            const row = document.createElement("tr");

            // Generamos el listado de adicionales como una cadena concatenada
            let adicionales = reserva.adicionales 
                ? reserva.adicionales.map(adicional => `${adicional.nombre} (${adicional.precio} MXN)`).join(", ") 
                : "No hay adicionales";

            // Sumar el total de la reserva (se verifica que exista un valor numérico)
            totalSumado += reserva.total || 0;

            // Agregar una fila a la tabla con los datos (5 columnas: Fecha, Nombre, Adicionales, Motivo Cancelación y Total)
            row.innerHTML = `
                <td>${reserva.fecha}</td>
                <td>${reserva.nombre}</td>
                <td>${adicionales}</td>
                <td>${reserva.motivoCancelacion}</td>
                <td>${reserva.total || "No disponible"}</td>
            `;

            listaReservas.appendChild(row);
        });

        // Agregar una fila con el total acumulado al final de la tabla (5 columnas)
        const rowTotal = document.createElement("tr");
        rowTotal.innerHTML = `
            <td colspan="4" style="text-align: right; font-weight: bold;">Total cancelado:</td>
            <td style="font-weight: bold;">${totalSumado} MXN</td>
        `;
        listaReservas.appendChild(rowTotal);

    } catch (error) {
        console.error("Error al cargar los eventos cancelados: ", error);
        listaReservas.innerHTML = "<tr><td colspan='5'>Hubo un error al cargar las reservas canceladas.</td></tr>";
    }
}

// Ejecutar la función al cargar la página
window.onload = cargareventosCancelados;

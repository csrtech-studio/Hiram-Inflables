import { db } from './firebaseConfig.js';
import { collection, getDocs, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

async function cargarReservasConcluidas() {
    const listaReservas = document.getElementById("reservasConcluidasLista");
    listaReservas.innerHTML = ""; // Limpiar la lista antes de agregar nuevos elementos
    let totalSumado = 0; // Variable para acumular el total

    try {
        const reservasSnapshot = await getDocs(collection(db, "reservasTerminadas")); // Asegúrate de que "reservasTerminadas" exista en Firestore
        
        if (reservasSnapshot.empty) {
            listaReservas.innerHTML = "<tr><td colspan='4'>No hay reservas concluidas.</td></tr>";
            return;
        }

        reservasSnapshot.forEach((doc) => {
            const reserva = doc.data();
            const row = document.createElement("tr");

            // Generamos el listado de adicionales como una cadena concatenada
            let adicionales = reserva.adicionales ? reserva.adicionales.map(adicional => `${adicional.nombre} (${adicional.precio} MXN)`).join(", ") : "No hay adicionales";

            // Sumar el total de la reserva
            totalSumado += reserva.total || 0;

            // Agregar una fila a la tabla con los datos
            row.innerHTML = `
                <td>${reserva.fecha}</td>
                <td>${reserva.nombre}</td>
                <td>${adicionales}</td>
                <td>${reserva.total || "No disponible"}</td>
            `;

            listaReservas.appendChild(row);
        });

        // Agregar una fila con el total acumulado al final de la tabla
        const rowTotal = document.createElement("tr");
        rowTotal.innerHTML = `
            <td colspan="3" style="text-align: right; font-weight: bold;">Total acumulado:</td>
            <td style="font-weight: bold;">${totalSumado} MXN</td>
        `;
        listaReservas.appendChild(rowTotal);

    } catch (error) {
        console.error("Error al cargar las reservas concluidas: ", error);
        listaReservas.innerHTML = "<tr><td colspan='4'>Hubo un error al cargar las reservas.</td></tr>";
    }
}

// Ejecutar la función al cargar la página
window.onload = cargarReservasConcluidas;
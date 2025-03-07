import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

async function cargarEncuestas() {
  const encuestasRef = collection(db, "encuestas");
  const snapshot = await getDocs(encuestasRef);
  const encuestas = snapshot.docs.map(doc => doc.data());

  // Llenar la tabla
  const tabla = document.getElementById("encuestasTabla");
  tabla.innerHTML = "";
  encuestas.forEach(encuesta => {
    const fila = `
      <tr>
        <td>${encuesta.nombre}</td>
        <td>${encuesta.calidad}</td>
        <td>${encuesta.personal}</td>
        <td>${encuesta.precio}</td>
        <td>${encuesta.puntualidad}</td>
        <td>${encuesta.recomendacion}</td>
        <td>${encuesta.dificultad}</td>
        <td>${encuesta.comentarios}</td>
      </tr>
    `;
    tabla.innerHTML += fila;
  });

  // Generar gráficos
  const datos = {
    calidad: contarRespuestas(encuestas, "calidad"),
    personal: contarRespuestas(encuestas, "personal"),
    recomendacion: contarRespuestas(encuestas, "recomendacion"),
    precio: contarRespuestas(encuestas, "precio"),
    dificultad: contarRespuestas(encuestas, "dificultad"),
    puntualidad: contarRespuestas(encuestas, "puntualidad"),
  };

  generarGrafico("graficoCalidad", datos.calidad, "Calidad");
  generarGrafico("graficoPersonal", datos.personal, "Personal");
  generarGrafico("graficoRecomendacion", datos.recomendacion, "Recomendación");
  generarGrafico("graficoPrecio", datos.precio, "Precio");
  generarGrafico("graficoDificultad", datos.dificultad, "Dificultad");
  generarGrafico("graficoPuntualidad", datos.puntualidad, "Puntualidad");
}

function contarRespuestas(encuestas, campo) {
  return encuestas.reduce((acc, encuesta) => {
    acc[encuesta[campo]] = (acc[encuesta[campo]] || 0) + 1;
    return acc;
  }, {});
}

function generarGrafico(id, datos, titulo) {
  const ctx = document.getElementById(id).getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(datos),
      datasets: [{
        data: Object.values(datos),
        backgroundColor: ["#4CAF50", "#FF9800", "#2196F3", "#F44336", "#9C27B0", "#FFEB3B"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right" }
      }
    }
  });
}

cargarEncuestas();

import { db } from './firebaseConfig.js';  // Asegúrate de que la configuración de Firebase esté correcta
import { doc, getDoc, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Obtener el parámetro 'id' de la URL
const urlParams = new URLSearchParams(window.location.search);
const reservaId = urlParams.get('id');  // Asegúrate de que el parámetro en la URL sea 'id'

// Verifica si el ID se obtiene correctamente
if (!reservaId) {
  console.error('No se encontró el parámetro ID en la URL.');
  alert('El parámetro ID no está presente en la URL.');
} else {
  console.log('Reserva ID:', reservaId);  // Verifica el ID de la reserva en la consola
}

// Variable global para almacenar el nombre del usuario
let nombreUsuario = '';

// Función para cargar el nombre y la fecha desde la colección 'reservas'
const getReservaData = async () => {
  const reservaRef = doc(db, 'reservas', reservaId);  // Usamos 'doc' para buscar por el ID del documento

  const docSnapshot = await getDoc(reservaRef);

  if (!docSnapshot.exists()) {
    console.log('No se encontró la reserva con el ID:', reservaId);

    // Aquí imprimimos todos los documentos de la colección 'reservas' para verificar
    const allDocsSnapshot = await getDocs(collection(db, 'reservas'));
    allDocsSnapshot.forEach(doc => {
      console.log(doc.id, " => ", doc.data());  // Imprime todos los documentos y sus datos
    });

    return;
  }

  const data = docSnapshot.data();
  console.log('Nombre:', data.nombre);  // Verifica si se obtiene correctamente el nombre
  console.log('Fecha del evento:', data.fecha);  // Verifica si se obtiene la fecha

  // Guardar el nombre del usuario en la variable global
  nombreUsuario = data.nombre;

  // Mostrar los datos en el contenedor 'reserva-detalles'
  const reservaDetalles = document.getElementById('reserva-detalles');
  reservaDetalles.innerHTML = `
    <p><strong>Nombre:</strong> ${data.nombre || 'No disponible'}</p>
    <p><strong>Fecha del evento:</strong> ${data.fecha || 'No disponible'}</p>
  `;
};

// Espera a que el DOM esté completamente cargado antes de ejecutar el código
document.addEventListener('DOMContentLoaded', () => {
  // Llamar a la función para cargar los datos de la reserva
  getReservaData();

  // Verificar si la encuesta ya fue contestada
  checkSurveyStatus().then((hasResponded) => {
    if (hasResponded) {
      showAlreadyAnsweredModal();  // Si ya fue contestada, mostrar mensaje
    } else {
      enableSurveyForm();  // Si no está contestada, habilitar el formulario
    }
  });
});

// Verificar si la encuesta ya fue contestada
const checkSurveyStatus = async () => {
  const surveyRef = collection(db, 'encuestas');
  const q = query(surveyRef, where("reservaId", "==", reservaId)); // Verificar si el ID de la reserva ya respondió
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return false; // No se ha respondido
  }

  let status = '';
  querySnapshot.forEach((doc) => {
    status = doc.data().status;
  });

  return status === 'contestada'; // Retorna true si ya está contestada
};

// Mostrar mensaje si la encuesta ya fue respondida
const showAlreadyAnsweredModal = () => {
  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.innerHTML = `
    <div class="modal-content">
      <h2>¡Ya has completado esta encuesta!</h2>
      <p>Gracias por tu participación.</p>
      <button id="acceptBtn">Aceptar</button>
    </div>
  `;
  document.body.appendChild(modal);

  const acceptBtn = document.getElementById('acceptBtn');
  acceptBtn.addEventListener('click', () => {
    modal.remove();
    window.location.href = 'index.html';  // Redirigir al index
  });
};

// Función para habilitar el formulario si la encuesta no ha sido contestada
const enableSurveyForm = () => {
  const encuestaForm = document.getElementById('encuestaForm');  // Asegúrate de tener este ID en tu formulario
  encuestaForm.style.display = 'block';  // Muestra el formulario de encuesta
};

// Lógica para guardar las respuestas de la encuesta
const saveSurveyResponse = async (formData) => {
  try {
    // Guardar las respuestas de la encuesta en la colección 'encuestas'
    await addDoc(collection(db, 'encuestas'), {
      reservaId,
      nombre: nombreUsuario, // Ahora se usa el nombre desde la variable global
      fecha: new Date(), // Guardamos la fecha actual en el campo 'fecha'
      calidad: formData.calidad,
      personal: formData.personal,
      recomendacion: formData.recomendacion,
      precio: formData.precio,
      dificultad: formData.dificultad,
      puntualidad: formData.puntualidad,
      comentarios: formData.comentarios,
      status: 'contestada',
    });
    showThankYouModal();  // Mostrar mensaje de agradecimiento
  } catch (error) {
    console.error("Error al guardar la encuesta: ", error);
    alert("Hubo un problema al guardar la encuesta. Inténtalo nuevamente.");
  }
};

// Mostrar modal de agradecimiento
const showThankYouModal = () => {
  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.innerHTML = `
    <div class="modal-content">
      <h2>¡Gracias por completar la encuesta!</h2>
      <p>Tu opinión es muy importante para nosotros.</p>
      <button id="acceptBtn">Aceptar</button>
    </div>
  `;
  document.body.appendChild(modal);

  const acceptBtn = document.getElementById('acceptBtn');
  acceptBtn.addEventListener('click', () => {
    modal.remove();
    window.location.href = 'index.html';  // Redirigir al index
  });
};

// Cuando el formulario sea enviado
const encuestaForm = document.getElementById('encuestaForm');  // Asegúrate de tener este ID en tu formulario
encuestaForm.addEventListener('submit', (e) => {
  e.preventDefault();

  checkSurveyStatus().then((hasResponded) => {
    if (hasResponded) {
      showAlreadyAnsweredModal();  // Si ya fue contestada, mostrar mensaje
    } else {
      const formData = {
        calidad: document.querySelector('input[name="calidad"]:checked')?.value,
        personal: document.querySelector('input[name="personal"]:checked')?.value,
        recomendacion: document.querySelector('input[name="recomendacion"]:checked')?.value,
        precio: document.querySelector('input[name="precio"]:checked')?.value,
        dificultad: document.querySelector('input[name="dificultad"]:checked')?.value,
        puntualidad: document.querySelector('input[name="puntualidad"]:checked')?.value,
        comentarios: document.querySelector('textarea[name="comentarios"]').value
      };

      // Verificar que todas las preguntas estén respondidas
      if (!formData.calidad || !formData.personal || !formData.recomendacion || !formData.precio || !formData.dificultad || !formData.puntualidad) {
        alert("Por favor, complete todas las preguntas.");
        return;
      }

      saveSurveyResponse(formData);  // Guardar respuestas
    }
  });
});

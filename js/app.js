import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

/* ====================================================
   Selectores y elementos globales
==================================================== */
const carouselContainer = document.querySelector('#carouselExample .carousel-inner');


/* ====================================================
   Funciones para cargar e inicializar el carrusel
==================================================== */
async function cargarImagenesCarrusel() {
  try {
    const imagenesSnapshot = await getDocs(collection(db, "imagenes"));
    let imagenesHTML = '';
    let primeraImagen = true;

    imagenesSnapshot.forEach((doc) => {
      const { url } = doc.data();
      console.log("Cargando imagen:", url);
      imagenesHTML += `
        <div class="carousel-item ${primeraImagen ? 'active' : ''}">
          <img src="${url}" class="d-block w-100" alt="Imagen del carrusel">
        </div>`;
      primeraImagen = false;
    });

    if (!imagenesHTML) {
      console.warn("No se encontraron imágenes en Firebase.");
      return;
    }

    // Insertamos el HTML de las imágenes en el carrusel
    carouselContainer.innerHTML = imagenesHTML;

    // Inicializamos el carrusel; un pequeño retraso garantiza que el DOM se actualice
    setTimeout(() => {
      new bootstrap.Carousel(carouselElement, {
        interval: 3000, // Cambia cada 3 segundos
        ride: "carousel"
      });
    }, 100);
  } catch (error) {
    console.error("Error al cargar imágenes del carrusel:", error);
  }
}


// Inicializa el modal de imagen ampliada
function initModalImagen() {
  const modalImagen = document.querySelector("#modalImagen");  

}

/* ====================================================
   Inicialización general al cargar el DOM
==================================================== */
document.addEventListener("DOMContentLoaded", () => {
  cargarImagenesCarrusel();

});

document.addEventListener("DOMContentLoaded", () => {
  const reservarBtn = document.querySelector(".nav-link.btn-custom");
  actualizarContadorReservas(); // Inicializa el contador al cargar la página

  document.addEventListener("click", (e) => {
 
      if (e.target.classList.contains("eliminar-btn")) {
          const id = e.target.dataset.id;
          let productosSeleccionados = JSON.parse(sessionStorage.getItem('productosSeleccionados')) || [];

          productosSeleccionados = productosSeleccionados.filter(producto => producto.id !== id);
          sessionStorage.setItem('productosSeleccionados', JSON.stringify(productosSeleccionados));

          actualizarContadorReservas(); // Actualizar contador en botón
      }
  });

  function actualizarContadorReservas() {
      const productosSeleccionados = JSON.parse(sessionStorage.getItem('productosSeleccionados')) || [];
      const cantidad = productosSeleccionados.length;
      reservarBtn.textContent = cantidad > 0 ? `Reservar (${cantidad})` : "Reservar";
  }
});

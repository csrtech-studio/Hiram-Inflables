import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

let clickCount = 0;

    document.getElementById("trigger").addEventListener("click", function() {
        clickCount++;
        if (clickCount === 6) {
            window.location.href = "admin.html";
        }
    });

   // Función para aplicar la configuración a los elementos del sitio
function applyStyles(config) {
  // Encabezado: se asume que el header tiene la clase .header
  const header = document.querySelector('.header');
  if (header) {
    header.style.backgroundColor = config.headerBgColor;
    header.style.color = config.headerTextColor;
  }
  
  // Título: se asume que el título tiene la clase .site-title
  const title = document.querySelector('.site-title');
  if (title) {
    title.style.color = config.titleTextColor;
    title.style.fontFamily = config.titleFont;
  }
  
  // Botones de navegación: elementos con clase .nav-link
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.style.color = config.navTextColor;
    link.style.background = `linear-gradient(135deg, ${config.navBgStart}, ${config.navBgEnd})`;
  });
  
  // Texto principal y secundario en los contenedores (.container)
  const containers = document.querySelectorAll('.container');
  containers.forEach(container => {
    // Texto secundario (por ejemplo, h2)
    const secondary = container.querySelector('h2');
    if (secondary) {
      secondary.style.color = config.secondaryTextColor;
      secondary.style.fontFamily = config.secondaryFont;
    }
    // Texto principal (por ejemplo, p)
    const mainText = container.querySelector('p');
    if (mainText) {
      mainText.style.color = config.mainTextColor;
      mainText.style.fontFamily = config.mainFont;
    }
  });
}

// Al cargar la página se recupera la configuración desde Firebase y se aplica
window.addEventListener('load', async () => {
  try {
    const configRef = doc(db, "styles", "config");
    const configDoc = await getDoc(configRef);
    if (configDoc.exists()) {
      const config = configDoc.data();
      applyStyles(config);
    } else {
      // Si no hay configuración guardada, se aplican los valores por defecto
      applyStyles(defaultConfig);
    }
  } catch (error) {
    console.error("Error al cargar la configuración:", error);
    // En caso de error, se aplica la configuración por defecto
    applyStyles(defaultConfig);
  }
});
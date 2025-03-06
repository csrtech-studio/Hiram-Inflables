import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        console.log('Service Worker registrado correctamente:', registration);
      })
      .catch((error) => {
        console.log('Fallo al registrar Service Worker:', error);
      });
  }

// Mostrar el modal a los 3 segundos
setTimeout(() => {
  document.getElementById('pwaModal').style.display = 'block';
}, 3000);

// Botón "Sí, instalar"
document.getElementById('installBtn').addEventListener('click', () => {
  // Aquí puedes agregar la lógica para la instalación de la PWA
  // Por ejemplo, disparar el evento "beforeinstallprompt" si está disponible.
  console.log("Iniciando instalación de la aplicación...");
  // Ocultar el modal tras aceptar
  document.getElementById('pwaModal').style.display = 'none';
});

// Botón "No, gracias"
document.getElementById('noBtn').addEventListener('click', () => {
  // Ocultar el modal si el usuario decide no instalar
  document.getElementById('pwaModal').style.display = 'none';
});



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

    
    // Configuración por defecto (opcional, si no existe configuración guardada)
    const defaultConfig = {
      bodyBgColor: "#f9f9f9",       
      headerBgColor: "#007bff",      
      headerTextColor: "#ffffff",    
      titleTextColor: "#ffffff",     
      titleFont: "'Comic Sans MS', cursive, sans-serif",
      navTextColor: "#ffffff",       
      navBgStart: "#ff6b6b",
      navBgEnd: "#ffcc00",
      mainTextColor: "#333333",      
      mainFont: "'Dosis', sans-serif",
      secondaryTextColor: "#ff4081",
      secondaryFont: "'Permanent Marker', cursive, sans-serif"
    };
    
    // Función que aplica los estilos utilizando variables CSS
    function applyStyles(config) {
      const root = document.documentElement;
      root.style.setProperty('--body-bg-color', config.bodyBgColor);
      root.style.setProperty('--header-bg-color', config.headerBgColor);
      root.style.setProperty('--header-text-color', config.headerTextColor);
      root.style.setProperty('--title-text-color', config.titleTextColor);
      root.style.setProperty('--title-font', config.titleFont);
      root.style.setProperty('--nav-text-color', config.navTextColor);
      root.style.setProperty('--nav-bg-start', config.navBgStart);
      root.style.setProperty('--nav-bg-end', config.navBgEnd);
      root.style.setProperty('--main-text-color', config.mainTextColor);
      root.style.setProperty('--main-font', config.mainFont);
      root.style.setProperty('--secondary-text-color', config.secondaryTextColor);
      root.style.setProperty('--secondary-font', config.secondaryFont);
    }
    
    // Función para cargar la configuración desde Firebase
    async function loadConfig() {
      try {
        const configDoc = await getDoc(doc(db, "styles", "config"));
        if (configDoc.exists()) {
          const config = configDoc.data();
          applyStyles(config);
        } else {
          // Si no hay configuración guardada, aplica la configuración por defecto
          console.log("No se encontró configuración guardada, se aplicarán los estilos por defecto.");
          applyStyles(defaultConfig);
        }
      } catch (error) {
        console.error("Error al obtener la configuración:", error);
        applyStyles(defaultConfig);
      }
    }
    
    // Ejecuta la carga de la configuración cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', loadConfig);
    
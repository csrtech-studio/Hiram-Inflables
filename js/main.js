import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

/* ====================================================
   Selectores y elementos globales
==================================================== */
const carouselContainer = document.querySelector('#carouselExample .carousel-inner');
const carouselElement = document.querySelector("#carouselExample");
const productosContainer = document.querySelector(".productos-container");

// Modal de confirmación (oculto por defecto)
const modalConfirm = document.createElement('div');
modalConfirm.className = 'modal-confirm';
modalConfirm.style.display = 'none';
modalConfirm.innerHTML = `
  <div class="modal-content">
    <p>Producto agregado. ¿Desea agregar más productos?</p>
    <button class="btn btn-success" id="btnSi">Sí</button>
    <button class="btn btn-danger" id="btnNo">No, Ir a Reservar</button>
  </div>
`;
document.body.appendChild(modalConfirm);

/* ====================================================
   Eventos del modal de confirmación
==================================================== */
modalConfirm.querySelector('#btnSi').addEventListener('click', () => {
  modalConfirm.style.display = 'none';
});
modalConfirm.querySelector('#btnNo').addEventListener('click', () => {
  window.location.href = 'contactanos.html';
});

/* ====================================================
   Estado global para productos agrupados por categoría
==================================================== */
const productosPorCategoria = {
  "Paquetes": [],
  "Inflables Secos": [],
  "Inflables Acuaticos" :[],
  "Maquinitas": [],
  "Adicionales": []
};

/* ====================================================
   Funciones para cargar e inicializar el carrusel principal
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

    carouselContainer.innerHTML = imagenesHTML;

    // Se inicializa el carrusel luego de un breve retraso para asegurar que el DOM se actualizó
    setTimeout(() => {
      new bootstrap.Carousel(carouselElement, {
        interval: 3000,
        ride: "carousel"
      });
    }, 100);

  } catch (error) {
    console.error("Error al cargar imágenes del carrusel:", error);
  }
}

/* ====================================================
   Funciones para cargar y renderizar productos
==================================================== */
async function cargarProductos() {
  try {
    const productosSnapshot = await getDocs(collection(db, "productos"));

    // Reiniciamos el estado de productos por categoría
    for (const key in productosPorCategoria) {
      if (productosPorCategoria.hasOwnProperty(key)) {
        productosPorCategoria[key] = [];
      }
    }

    productosSnapshot.forEach((doc) => {
      const producto = doc.data();
      if (producto.categoria && productosPorCategoria[producto.categoria]) {
        productosPorCategoria[producto.categoria].push({ id: doc.id, ...producto });
      }
    });

    renderProductos();
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

function renderProductos() { 
  productosContainer.innerHTML = "";
  Object.keys(productosPorCategoria).forEach(categoria => {
    if (productosPorCategoria[categoria].length > 0) {
      let categoriaHTML = `<div class="categoria"><h2>${categoria}:</h2>`;
      productosPorCategoria[categoria].forEach(producto => {
        categoriaHTML += `
          <div class="producto-container">
            <div class="imagen-wrapper">
              <div class="tipo-producto"><strong>${producto.tipo || ''}</strong></div>
              <img src="${producto.imagenes?.[0] || ''}" alt="${producto.nombre}" 
                   class="imagen-expandible" data-producto-id="${producto.id}">
              ${
                producto.video && producto.video.trim() !== ""
                  ? `<div class="video-icon" onclick="openVideoModal('${producto.video}')" title="Ver video">
                       <i class="fa fa-play-circle"></i>
                     </div>`
                  : ""
              }
            </div>
            <div class="detalles">
              <p class="nombre-producto"><strong>${producto.nombre}</strong></p>
              <p><strong>Descripción:</strong> ${producto.descripcion}</p>
              <p><strong>Tiempo:</strong> ${producto.tiempo} horas</p>
              <p><strong>Costo:</strong> $${producto.costo} MXN</p>
              <button class="reservar-btn" data-id="${producto.id}" 
                      data-nombre="${producto.nombre}" data-precio="${producto.costo}">
                Reservar
              </button>
            </div>
          </div>
        `;
      });
      categoriaHTML += `</div>`;
      productosContainer.insertAdjacentHTML('beforeend', categoriaHTML);
    }
  });
}

function openVideoModal(videoUrl) {
  const modal = document.createElement('div');
  modal.classList.add('video-modal');
  modal.innerHTML = `
    <div class="video-modal-content">
      <span class="close-video-modal">&times;</span>
      <video controls autoplay>
        <source src="${videoUrl}" type="video/mp4">
        Tu navegador no soporta el elemento de video.
      </video>
    </div>
  `;
  document.body.appendChild(modal);

  // Cerrar el modal al hacer clic en la "x"
  modal.querySelector('.close-video-modal').addEventListener('click', () => modal.remove());
  // Cerrar el modal al hacer clic fuera del contenido
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Asignar la función al objeto global para que sea accesible desde el HTML (soluciona el warning de TS)
window.openVideoModal = openVideoModal;

/* ====================================================
   Delegación de eventos para Reservar y Modal de Imagen
==================================================== */
productosContainer.addEventListener("click", (e) => {
  // --- Manejo de "Reservar"

  // --- Manejo de clic en imagen expandible (para mostrar el modal)
  if (e.target.classList.contains("imagen-expandible")) {
    // Obtiene el id del producto desde el atributo data
    const productoId = e.target.dataset.productoId ||
      e.target.closest('.producto-container').querySelector(".reservar-btn").dataset.id;

    // Buscar el producto en la estructura global
    const producto = Object.values(productosPorCategoria).flat().find(p => p.id === productoId);
    const imagenes = producto?.imagenes || [];

    if (imagenes.length > 0) {
      const carouselHTML = imagenes.map((imagen, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
          <img src="${imagen}" class="d-block w-300" alt="Infables Hiram">
        </div>
      `).join('');

      const modalCarousel = document.querySelector("#modalCarousel");
      modalCarousel.innerHTML = `
        <div id="carouselModal" class="carousel slide" data-bs-ride="carousel">
          <div class="carousel-inner">
            ${carouselHTML}
          </div>
          <button class="carousel-control-prev" type="button" data-bs-target="#carouselModal" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#carouselModal" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
          </button>
        </div>
      `;

      // Inicializa el carrusel dentro del modal
      new bootstrap.Carousel(modalCarousel.querySelector("#carouselModal"));
    }

    // Mostrar el modal de imagen
    const modalImagen = document.querySelector("#modalImagen");
    modalImagen.style.display = "flex";

    // Configuración perezosa: asignar los listeners de cierre solo la primera vez
    if (!modalImagen.dataset.initialized) {
      const cerrarModal = modalImagen.querySelector(".cerrar-modal");
      cerrarModal.addEventListener("click", () => {
        modalImagen.style.display = "none";
      });
      modalImagen.addEventListener("click", (event) => {
        if (event.target === modalImagen) {
          modalImagen.style.display = "none";
        }
      });
      modalImagen.dataset.initialized = "true";
    }
  }
});

/* ====================================================
   Inicialización general al cargar el DOM
==================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Aseguramos que el modal de imagen esté oculto al inicio
  const modalImagen = document.querySelector("#modalImagen");
  if (modalImagen) {
    modalImagen.style.display = "none";
  }

  cargarImagenesCarrusel();
  cargarProductos();
});

window.addEventListener("scroll", () => {
  const header = document.querySelector('.header');
  // Si el scroll vertical es mayor a la mitad de la altura de la ventana...
  if (window.scrollY > window.innerHeight / 2) {
    header.classList.add("small-header");
  } else {
    header.classList.remove("small-header");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const reservarBtn = document.querySelector(".nav-link.btn-custom");
  actualizarContadorReservas(); // Inicializa el contador al cargar la página

  document.addEventListener("click", (e) => {
      if (e.target.classList.contains("reservar-btn")) {
          const { nombre, precio, id } = e.target.dataset;
          const precioProducto = parseInt(precio, 10);
          let productosSeleccionados = JSON.parse(sessionStorage.getItem('productosSeleccionados')) || [];

          productosSeleccionados.push({ id, nombre, precio: precioProducto });
          sessionStorage.setItem('productosSeleccionados', JSON.stringify(productosSeleccionados));
          modalConfirm.style.display = 'flex';
          actualizarContadorReservas(); // Actualizar contador en botón
      }

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

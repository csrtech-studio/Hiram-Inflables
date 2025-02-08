import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Referencias al carrusel
const carouselContainer = document.querySelector('#carouselExample .carousel-inner');
const carouselElement = document.querySelector("#carouselExample");

// 🚀 Cargar imágenes del carrusel desde Firebase
async function cargarImagenesCarrusel() {
    try {
        const imagenesSnapshot = await getDocs(collection(db, "imagenes"));
        let imagenesHTML = '';
        let primeraImagen = true;

        imagenesSnapshot.forEach((doc) => {
            const imagen = doc.data().url;
            console.log("Cargando imagen:", imagen); // Verifica las URLs en la consola

            imagenesHTML += `
            <div class="carousel-item ${primeraImagen ? 'active' : ''}">
                <img src="${imagen}" class="d-block w-100" alt="Imagen del carrusel">
            </div>`;
            primeraImagen = false; // Solo la primera imagen tendrá la clase "active"
        });

        // Verifica si se encontraron imágenes
        if (imagenesHTML === '') {
            console.warn("No se encontraron imágenes en Firebase.");
            return;
        }

        // Insertar las imágenes en el DOM
        carouselContainer.innerHTML = imagenesHTML;

        // 🔥 Forzar la inicialización del carrusel DESPUÉS de agregar las imágenes
        setTimeout(() => {
            new bootstrap.Carousel(carouselElement, {
                interval: 3000, // Cambia cada 3 segundos
                ride: "carousel"
            });
        }, 500); // Un pequeño retraso para asegurar que el DOM se actualizó

    } catch (error) {
        console.error("Error al cargar imágenes del carrusel:", error);
    }
}

// Llamar a la función para cargar las imágenes cuando la página se haya cargado
document.addEventListener("DOMContentLoaded", cargarImagenesCarrusel);


// Referencia al contenedor de productos
const productosContainer = document.querySelector(".productos-container");

// Modal de confirmación
const modalConfirm = document.createElement('div');
modalConfirm.className = 'modal-confirm';
modalConfirm.style.display = 'none'; // Ocultar por defecto
modalConfirm.innerHTML = `
  <div class="modal-content">
    <p>Producto agregado. ¿Desea agregar más productos?</p>
    <button class="btn btn-success" id="btnSi">Sí</button>
    <button class="btn btn-danger" id="btnNo">No, Ir a Reservar</button>
  </div>
`;
document.body.appendChild(modalConfirm);



// Funciones para mostrar y ocultar modales
function mostrarModal() {
    modalConfirm.style.display = 'flex';
}
function ocultarModal() {
    modalConfirm.style.display = 'none';
}

// Eventos del modal de confirmación
document.getElementById('btnSi').addEventListener('click', ocultarModal);
document.getElementById('btnNo').addEventListener('click', () => {
    window.location.href = 'contactanos.html';
});

// 🚀 Cargar productos desde Firebase
async function cargarProductos() {
    try {
        const productosSnapshot = await getDocs(collection(db, "productos"));
        let productosPorCategoria = {
            "Paquetes": [],
            "Inflables": [],
            "Maquinitas": []
        };

        // Organizar productos por categoría
        productosSnapshot.forEach((doc) => {
            const producto = doc.data();
            if (productosPorCategoria[producto.categoria]) {
                productosPorCategoria[producto.categoria].push({ id: doc.id, ...producto });
            }
        });

        // Insertar HTML dinámicamente
        productosContainer.innerHTML = "";

        Object.keys(productosPorCategoria).forEach(categoria => {
            if (productosPorCategoria[categoria].length > 0) {
                let categoriaHTML = `<div class="categoria"><h2>${categoria}:</h2>`;

                productosPorCategoria[categoria].forEach(producto => {
                    categoriaHTML += `
                    <div class="producto-container">
                        <img src="${producto.imagen}" alt="${producto.nombre}" class="imagen-expandible">
                        <div class="detalles">
                            <p class="nombre-producto"><strong>${producto.nombre}</strong></p>
                            <p><strong>Descripción:</strong> ${producto.descripcion}</p>
                            <p><strong>Tiempo:</strong> ${producto.tiempo} horas</p>
                            <p><strong>Costo:</strong> $${producto.costo} MXN</p>
                            <button class="reservar-btn" data-id="${producto.id}" data-nombre="${producto.nombre}" data-precio="${producto.costo}">Reservar</button>
                        </div>
                    </div>
                    `;
                });

                categoriaHTML += `</div>`;
                productosContainer.innerHTML += categoriaHTML;
            }
        });

    } catch (error) {
        console.error("Error al cargar productos:", error);
    }
}

// 🛒 Delegación de eventos para los botones de "Reservar"
productosContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("reservar-btn")) {
        const nombreProducto = e.target.dataset.nombre;
        const precioProducto = parseInt(e.target.dataset.precio);

        // Obtener productos almacenados o crear un array vacío
        let productosSeleccionados = JSON.parse(sessionStorage.getItem('productosSeleccionados')) || [];

        // Agregar el producto seleccionado
        productosSeleccionados.push({ nombre: nombreProducto, precio: precioProducto });

        // Guardar en sessionStorage
        sessionStorage.setItem('productosSeleccionados', JSON.stringify(productosSeleccionados));

        // Mostrar el modal
        mostrarModal();
    }
});

// Obtener los elementos necesarios

const modalImagen = document.querySelector("#modalImagen");
const imagenAmpliada = document.getElementById("imagenAmpliada");
const cerrarModal = document.querySelector(".cerrar-modal");

// Delegación de evento para ampliar la imagen
productosContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("imagen-expandible")) {
        imagenAmpliada.src = e.target.src;  // Asignar la imagen seleccionada al modal
        modalImagen.style.display = "flex";  // Mostrar el modal
    }
});

// Cerrar el modal cuando se hace clic en el botón de cerrar
cerrarModal.addEventListener("click", () => {
    modalImagen.style.display = "none";  // Ocultar el modal
});


// 🎯 Cerrar el modal de imagen al hacer clic en la "X"
document.querySelector(".cerrar-modal").addEventListener("click", () => {
    modalImagen.style.display = "none";
});

// Cerrar el modal si se hace clic fuera de la imagen
modalImagen.addEventListener("click", (e) => {
    if (e.target === modalImagen) {
        modalImagen.style.display = "none";
    }
});



// Llamar a la función al cargar la página
cargarProductos();

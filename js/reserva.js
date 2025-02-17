import { db } from './firebaseConfig.js';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc, addDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';

// 📌 Verificar autenticación del usuario
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'admin.html'; // Redirige si no está autenticado
    }
});

const categoriaSelect = document.getElementById("categoria");
const formCampos = document.getElementById("formCampos");
const productoForm = document.getElementById("productoForm");
const tablaProductos = document.getElementById("tablaProductos");
const reservasLista = document.getElementById("reservas-lista");

// 📌 Generar formulario según la categoría seleccionada (incluye campo de video)
categoriaSelect.addEventListener("change", () => {
  formCampos.innerHTML = `
      <label for="nombre">Nombre:</label>
      <input type="text" id="nombre" required>
      
      <label for="descripcion">Descripción:</label>
      <input type="text" id="descripcion" required>
      
      <label for="tiempo">Tiempo:</label>
      <input type="text" id="tiempo" required>
      
      <label for="costo">Costo:</label>
      <input type="number" id="costo" required>
      
      <label>Imágenes (URLs):</label>
      <div id="imagenesContainer">
          <div class="imagen-input">
              <input type="text" class="imagen-url" placeholder="https://ejemplo.com/imagen.jpg" required>
              <button type="button" class="agregar-imagen">+</button>
          </div>
      </div>
      
      <label for="video">Video (opcional):</label>
      <input type="text" id="video" placeholder="https://ejemplo.com/video.mp4">
  `;

  // Agregar más campos de imagen al hacer clic en "+"
  document.querySelector(".agregar-imagen").addEventListener("click", () => {
      const contenedor = document.getElementById("imagenesContainer");
      const nuevoInput = document.createElement("div");
      nuevoInput.classList.add("imagen-input");
      nuevoInput.innerHTML = `
          <input type="text" class="imagen-url" placeholder="https://ejemplo.com/imagen.jpg" required>
          <button type="button" class="eliminar-imagen">x</button>
      `;
      contenedor.appendChild(nuevoInput);

      // Botón para eliminar un campo de imagen
      nuevoInput.querySelector(".eliminar-imagen").addEventListener("click", () => {
          nuevoInput.remove();
      });
  });
});

// 📌 Guardar o editar producto en Firebase
productoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const categoria = categoriaSelect.value;
    const nombre = document.getElementById("nombre").value;
    const descripcion = document.getElementById("descripcion").value;
    const tiempo = document.getElementById("tiempo").value;
    const costo = document.getElementById("costo").value;
    const imagenes = Array.from(document.querySelectorAll(".imagen-url")).map(input => input.value);
    const video = document.getElementById("video").value; // Nuevo campo de video

    const productoData = { categoria, nombre, descripcion, tiempo, costo, imagenes, video };

    try {
        if (productoForm.dataset.editingId) {
            // Si se está editando, actualizar en Firebase
            const productoId = productoForm.dataset.editingId;
            await updateDoc(doc(db, "productos", productoId), productoData);

            // Restablecer el estado del botón a "Guardar"
            delete productoForm.dataset.editingId;
            const submitButton = document.querySelector("#productoForm button[type='submit']");
            if (submitButton) {
                submitButton.textContent = "Guardar";
            }
        } else {
            // Si es un nuevo producto, agregarlo a Firebase
            await addDoc(collection(db, "productos"), productoData);
        }

        productoForm.reset();
        cargarProductos();
    } catch (error) {
        console.error("Error al guardar producto:", error);
    }
});

// 📌 Cargar productos desde Firebase
async function cargarProductos() {
    tablaProductos.innerHTML = "";

    const productosSnapshot = await getDocs(collection(db, "productos"));
    productosSnapshot.forEach((doc) => {
        const producto = doc.data();
        const key = doc.id;

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${producto.categoria}</td> 
            <td>${producto.nombre}</td>
            <td>${producto.descripcion}</td>
            <td>${producto.tiempo}</td>
            <td>${producto.costo}</td>
            <td>
                <img src="${producto.imagenes?.[0] || ''}" alt="Imagen" style="width: 100px; height: 100px;">
                ${producto.video ? `<br><a href="${producto.video}" target="_blank">Ver Video</a>` : ""}
            </td>
            <td>
                <button onclick="editarProducto('${key}')">Editar</button>
                <button onclick="eliminarProducto('${key}')">Eliminar</button>
            </td>
        `;
        tablaProductos.appendChild(fila);
    });
}

// 📌 Eliminar un producto
window.eliminarProducto = async function (key) {
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
        await deleteDoc(doc(db, "productos", key));
        cargarProductos();
    }
};

// 📌 Editar un producto
window.editarProducto = async function (key) {
  try {
      const productoRef = doc(db, "productos", key);
      const productoSnap = await getDoc(productoRef);

      if (!productoSnap.exists()) {
          console.error("El producto no existe");
          return;
      }

      const productoData = productoSnap.data();

      // Actualizar el formulario con los datos del producto
      document.getElementById("categoria").value = productoData.categoria;
      document.getElementById("nombre").value = productoData.nombre;
      document.getElementById("descripcion").value = productoData.descripcion;
      document.getElementById("tiempo").value = productoData.tiempo;
      document.getElementById("costo").value = productoData.costo;
      document.getElementById("video").value = productoData.video || "";

      // Cargar imágenes
      const imagenesContainer = document.getElementById("imagenesContainer");
      imagenesContainer.innerHTML = ""; // Limpiar el contenedor

      if (productoData.imagenes && productoData.imagenes.length > 0) {
          productoData.imagenes.forEach((url) => {
              const nuevoInput = document.createElement("div");
              nuevoInput.classList.add("imagen-input");
              nuevoInput.innerHTML = `
                  <input type="text" class="imagen-url" value="${url}" required>
                  <button type="button" class="eliminar-imagen">x</button>
              `;
              imagenesContainer.appendChild(nuevoInput);

              nuevoInput.querySelector(".eliminar-imagen").addEventListener("click", () => {
                  nuevoInput.remove();
              });
          });
      }

      // Agregar un campo para nuevas imágenes (con botón "+")
      const plusDiv = document.createElement("div");
      plusDiv.classList.add("imagen-input");
      plusDiv.innerHTML = `
          <input type="text" class="imagen-url" placeholder="https://ejemplo.com/imagen.jpg">
          <button type="button" class="agregar-imagen">+</button>
      `;
      imagenesContainer.appendChild(plusDiv);

      plusDiv.querySelector(".agregar-imagen").addEventListener("click", () => {
          const contenedor = document.getElementById("imagenesContainer");
          const nuevoInput = document.createElement("div");
          nuevoInput.classList.add("imagen-input");
          nuevoInput.innerHTML = `
              <input type="text" class="imagen-url" placeholder="https://ejemplo.com/imagen.jpg" required>
              <button type="button" class="eliminar-imagen">x</button>
          `;
          contenedor.appendChild(nuevoInput);

          nuevoInput.querySelector(".eliminar-imagen").addEventListener("click", () => {
              nuevoInput.remove();
          });
      });

      // Cambiar el botón de "Guardar" a "Actualizar"
      const submitButton = document.querySelector("#productoForm button[type='submit']");
      if (submitButton) {
          submitButton.textContent = "Actualizar";
      }

      // Guardar el ID del producto para actualizarlo luego
      productoForm.dataset.editingId = key;
  } catch (error) {
      console.error("Error al cargar el producto:", error);
  }
};



// 📌 Cargar reservas
async function cargarReservas() {
    reservasLista.innerHTML = "";
    const reservasSnapshot = await getDocs(collection(db, 'reservas'));

    reservasSnapshot.forEach((doc) => {
        const reserva = doc.data();
        let botonAccion = '';

        if (reserva.estado === 'Cancelado') {
            botonAccion = `<button class="btn btn-danger" onclick="eliminarReserva('${doc.id}')">Eliminar</button>`;
        } else if (reserva.estado === 'Confirmado') {
            botonAccion = `<button class="btn btn-success" onclick="concluirReserva('${doc.id}', '${encodeURIComponent(JSON.stringify(reserva))}')">Concluir</button>`;
        } else {
            botonAccion = `<a href="detallesReserva.html?id=${doc.id}" class="btn btn-info">Ver</a>`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reserva.nombre}</td>
            <td>${reserva.fecha}</td>
            <td>${reserva.hora}</td>
            <td>${reserva.estado}</td>
            <td>${botonAccion}</td>
        `;
        reservasLista.appendChild(row);
    });
}

// 📌 Hacer la función accesible globalmente
window.concluirReserva = async function (reservaId, reservaDataStr) {
    try {
        const reservaData = JSON.parse(decodeURIComponent(reservaDataStr));

        // Guardar en la colección 'reservasTerminadas'
        await setDoc(doc(db, 'reservasTerminadas', reservaId), reservaData);

        // Eliminar de la colección 'reservas'
        await deleteDoc(doc(db, 'reservas', reservaId));

        alert("Reserva concluida y archivada.");
        cargarReservas(); // Recargar lista
    } catch (error) {
        console.error("Error al concluir la reserva:", error);
        alert("Hubo un error al concluir la reserva.");
    }
};





// 📌 Verificar reservas cercanas en el tiempo
function verificarFechasCercanas(reservas) {
    const advertencias = [];
    const filasConflictivas = new Set();

    for (let i = 0; i < reservas.length; i++) {
        for (let j = i + 1; j < reservas.length; j++) {
            const fecha1 = new Date(`${reservas[i].fecha}T${reservas[i].hora}`);
            const fecha2 = new Date(`${reservas[j].fecha}T${reservas[j].hora}`);
            const diferencia = Math.abs(fecha1 - fecha2) / (1000 * 60); // Minutos

            if (reservas[i].fecha === reservas[j].fecha && diferencia < 60) {
                advertencias.push(`Atención: Las reservas de ${reservas[i].nombre} y ${reservas[j].nombre} están a menos de una hora de diferencia.`);
                filasConflictivas.add(i);
                filasConflictivas.add(j);
            }
        }
    }

    mostrarAdvertencias(advertencias);
    resaltarFilas(filasConflictivas);
}

// 📌 Mostrar advertencias en pantalla
function mostrarAdvertencias(advertencias) {
    const advertenciaContainer = document.getElementById('advertencias');
    advertenciaContainer.innerHTML = "";
    advertencias.forEach(advertencia => {
        const label = document.createElement('div');
        label.className = 'alert alert-warning';
        label.textContent = advertencia;
        advertenciaContainer.appendChild(label);
    });
}

// 📌 Eliminar reserva
window.eliminarReserva = async function(reservaId) {
    await deleteDoc(doc(db, 'reservas', reservaId));
    alert("Reserva eliminada correctamente.");
    cargarReservas();
};

const formImagen = document.getElementById('formImagen');
const imagenURL = document.getElementById('imagenURL');
const imagenPreview = document.getElementById('imagenPreview');

// 📌 Función para agregar una imagen
formImagen.addEventListener('submit', async (e) => {
  e.preventDefault();
  const urlImagen = imagenURL.value;

  if (urlImagen) {
    // Guardar en Firebase (si es necesario)
    await addDoc(collection(db, "imagenes"), { url: urlImagen });

    // Mostrar imagen en el contenedor
    mostrarImagen(urlImagen);

    // Limpiar el campo
    imagenURL.value = '';
  }
});

// 📌 Mostrar imagen en miniatura y con opción de eliminar
function mostrarImagen(url) {
  const imagenDiv = document.createElement('div');
  imagenDiv.classList.add('col-3', 'mb-3', 'position-relative');

  const imagen = document.createElement('img');
  imagen.src = url;
  imagen.classList.add('img-fluid', 'border');
  imagen.style.height = '150px';

  const botonEliminar = document.createElement('button');
  botonEliminar.classList.add('btn', 'btn-danger', 'position-absolute', 'top-0', 'end-0', 'm-2');
  botonEliminar.innerHTML = 'X';
  botonEliminar.addEventListener('click', () => eliminarImagen(url, imagenDiv));

  imagenDiv.appendChild(imagen);
  imagenDiv.appendChild(botonEliminar);
  imagenPreview.appendChild(imagenDiv);
}

// 📌 Eliminar imagen
async function eliminarImagen(url, imagenDiv) {
  if (confirm('¿Seguro que quieres eliminar esta imagen del carrusel?')) {
    // Eliminar de Firebase
    const querySnapshot = await getDocs(collection(db, 'imagenes'));
    querySnapshot.forEach((doc) => {
      if (doc.data().url === url) {
        deleteDoc(doc.ref); // Eliminar de Firestore
      }
    });

    // Eliminar de la vista
    imagenDiv.remove();
  }
}

// 📌 Cargar las imágenes desde Firebase (si es necesario)
async function cargarImagenes() {
  const imagenesSnapshot = await getDocs(collection(db, 'imagenes'));
  imagenesSnapshot.forEach((doc) => {
    mostrarImagen(doc.data().url);
  });
}

// Cargar las imágenes cuando se inicie
cargarImagenes();


// 📌 Cargar datos al iniciar
cargarProductos();
cargarReservas();

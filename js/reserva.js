import { db } from './firebaseConfig.js';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc, addDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';

// 📌 Verificar autenticación del usuario
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'admin.html'; // Redirige si no está autenticado
    }
});

// 📌 Selección de elementos del DOM
const categoriaSelect = document.getElementById("categoria");
const formCampos = document.getElementById("formCampos");
const productoForm = document.getElementById("productoForm");
const tablaProductos = document.getElementById("tablaProductos");
const reservasLista = document.getElementById("reservas-lista");


// 📌 Actualizar formulario según la categoría seleccionada
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
        
        <label for="imagen">Imagen (URL):</label>
        <input type="text" id="imagen" placeholder="https://ejemplo.com/imagen.jpg" required>
    `;
});

// 📌 Guardar producto en Firebase
productoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const categoria = categoriaSelect.value;
  const nombre = document.getElementById("nombre").value;
  const descripcion = document.getElementById("descripcion").value;
  const tiempo = document.getElementById("tiempo").value;
  const costo = document.getElementById("costo").value;
  const imagen = document.getElementById("imagen").value;

  try {
      await addDoc(collection(db, "productos"), { // 🟢 Ahora todos los productos están en la colección "productos"
          categoria, // 🟢 Se guarda la categoría como un campo
          nombre,
          descripcion,
          tiempo,
          costo,
          imagen
      });
      productoForm.reset();
      cargarProductos();
  } catch (error) {
      console.error("Error al agregar producto:", error);
  }
});

// 📌 Cargar productos desde Firebase
async function cargarProductos() {
  tablaProductos.innerHTML = "";
  
  const productosSnapshot = await getDocs(collection(db, "productos")); // 🟢 Se cargan todos los productos de la colección "productos"
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
          <td><img src="${producto.imagen}" alt="Imagen" style="width: 100px; height: 100px;"></td>
          <td>
              <button onclick="editarProducto('${key}', '${producto.categoria}', '${producto.nombre}', '${producto.descripcion}', '${producto.tiempo}', '${producto.costo}', '${producto.imagen}')">Editar</button>
              <button onclick="eliminarProducto('${key}')">Eliminar</button>
          </td>
      `;
      tablaProductos.appendChild(fila);
  });
}

// 📌 Eliminar un producto
window.eliminarProducto = async function (key) {
  if (confirm("¿Seguro que deseas eliminar este producto?")) {
      await deleteDoc(doc(db, "productos", key)); // 🟢 Ahora se usa "productos" como colección única
      cargarProductos();
  }
};

// 📌 Editar un producto
window.editarProducto = function (key, categoria, nombre, descripcion, tiempo, costo, imagen) {
  document.getElementById("categoria").value = categoria;
  document.getElementById("nombre").value = nombre;
  document.getElementById("descripcion").value = descripcion;
  document.getElementById("tiempo").value = tiempo;
  document.getElementById("costo").value = costo;
  document.getElementById("imagen").value = imagen;

  productoForm.onsubmit = async function (e) {
      e.preventDefault();
      await updateDoc(doc(db, "productos", key), { // 🟢 Se usa "productos" como colección única
          categoria: document.getElementById("categoria").value,
          nombre: document.getElementById("nombre").value,
          descripcion: document.getElementById("descripcion").value,
          tiempo: document.getElementById("tiempo").value,
          costo: document.getElementById("costo").value,
          imagen: document.getElementById("imagen").value
      });
      productoForm.reset();
      cargarProductos();
      productoForm.onsubmit = productoForm.submit;
  };
};




// 📌 Cargar reservas
async function cargarReservas() {
    reservasLista.innerHTML = "";
    const reservasSnapshot = await getDocs(collection(db, 'reservas'));

    reservasSnapshot.forEach((doc) => {
        const reserva = doc.data();
        const row = document.createElement('tr');
        const botonAccion = reserva.estado === 'Cancelado' 
            ? `<button class="btn btn-danger" onclick="eliminarReserva('${doc.id}')">Eliminar</button>`
            : `<a href="detallesReserva.html?id=${doc.id}" class="btn btn-info">Ver</a>`;

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

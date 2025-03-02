import { db } from './firebaseConfig.js';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc, addDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';
import { auth } from './firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {
  // Verificar si el usuario está autenticado
  onAuthStateChanged(auth, user => {
    if (!user) {
      // Si el usuario no está autenticado, redirigir a la página de inicio
      window.location.href = 'no-autenticado.html';
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
    const logoutButton = document.getElementById('logout-button');
  
    if (logoutButton) {
      logoutButton.addEventListener('click', async function () {
        try {
          // Cerrar sesión
          await signOut(auth);
          console.log('Sesión cerrada');
          
          // Redirigir al inicio (index.html) o a la página que desees
          window.location.href = 'index.html';
        } catch (error) {
          console.error('Error al cerrar sesión:', error.message);
        }
      });
    }
  });

const categoriaSelect = document.getElementById("categoria");
const formCampos = document.getElementById("formCampos");
const productoForm = document.getElementById("productoForm");
const tablaProductos = document.getElementById("tablaProductos");
const reservasLista = document.getElementById("reservas-lista");

// ── Función para renderizar los campos del formulario ──
function renderFormCampos() {
    formCampos.innerHTML = `
        <label for="nombre">Nombre:</label>
        <input type="text" id="nombre" required>
        
        <label for="descripcion">Descripción:</label>
        <input type="text" id="descripcion" required>
        
        <label for="tipo">Tipo:</label>
        <select id="tipo" required>
            <option value="" disabled selected>Seleccione</option>
            <option value="chico">Chico</option>
            <option value="mediano">Mediano</option>
            <option value="grande">Grande</option>
        </select>
        
        <label for="tiempo">Tiempo:</label>
        <input type="number" id="tiempo" required>
        
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

    // ── Agregar funcionalidad al botón "+"
    const agregarImagenBtn = formCampos.querySelector(".agregar-imagen");
    if (agregarImagenBtn) {
        agregarImagenBtn.addEventListener("click", () => {
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
    }
}

// ── Escuchar el cambio de categoría para renderizar el formulario ──
categoriaSelect.addEventListener("change", renderFormCampos);

// ── Guardar o editar producto en Firebase ──
productoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const categoria = categoriaSelect.value;
    const nombre = document.getElementById("nombre").value;
    const descripcion = document.getElementById("descripcion").value;
    const tipo = document.getElementById("tipo").value;
    const tiempo = document.getElementById("tiempo").value;
    const costo = document.getElementById("costo").value;
    const imagenes = Array.from(document.querySelectorAll(".imagen-url")).map(input => input.value);
    const video = document.getElementById("video").value;

    const productoData = { categoria, nombre, descripcion, tipo, tiempo, costo, imagenes, video };

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

        // Reiniciar el formulario y limpiar campos dinámicos
        productoForm.reset();
        formCampos.innerHTML = "";  // Limpia el contenido dinámico (imágenes, video, etc.)
        
        // Opcional: Si usas un modal o panel expandible para el formulario, puedes cerrarlo aquí.
        // Ejemplo (usando Bootstrap): 
        // const modal = bootstrap.Modal.getInstance(document.getElementById('modalProducto'));
        // modal.hide();

        cargarProductos();
    } catch (error) {
        console.error("Error al guardar producto:", error);
    }
});

// ── Cargar productos desde Firebase ──
async function cargarProductos() {
    // Limpiar la tabla
    tablaProductos.innerHTML = "";

    // Obtener todos los productos
    const productosSnapshot = await getDocs(collection(db, "productos"));
    const productosArray = [];
    
    productosSnapshot.forEach((docSnap) => {
        const producto = docSnap.data();
        producto.id = docSnap.id;
        productosArray.push(producto);
    });

    // Definir el orden de categorías deseado
    const prioridadCategorias = ["paquetes", "inflables secos", "inflables actuaticos", "maquinitas", "adicionales"];

    // Ordenar el arreglo según el índice de la categoría en el arreglo de prioridad
    productosArray.sort((a, b) => {
        // Convertir a minúsculas para evitar problemas de mayúsculas/minúsculas
        const indexA = prioridadCategorias.indexOf(a.categoria.toLowerCase());
        const indexB = prioridadCategorias.indexOf(b.categoria.toLowerCase());

        // Si alguna categoría no se encuentra en el arreglo, se la ubica al final
        return (indexA === -1 ? prioridadCategorias.length : indexA) - 
               (indexB === -1 ? prioridadCategorias.length : indexB);
    });

    // Renderizar los productos ordenados en la tabla
    productosArray.forEach((producto) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${producto.categoria}</td> 
            <td>${producto.nombre}</td>
            <td>${producto.descripcion}</td>
            <td>${producto.tipo || ""}</td>
            <td>${producto.tiempo}</td>
            <td>${producto.costo}</td>
            <td>
                <img src="${producto.imagenes?.[0] || ''}" alt="Imagen" style="width: 100px; height: 100px;">
                ${producto.video ? `<br><a href="${producto.video}" target="_blank">Ver Video</a>` : ""}
            </td>
            <td>
             <button class="editar" onclick="editarProducto('${producto.id}')">Editar</button>
             <button class="eliminar" onclick="eliminarProducto('${producto.id}')">Eliminar</button>

            </td>
        `;
        tablaProductos.appendChild(fila);
    });
}

// ── Eliminar un producto ──
window.eliminarProducto = async function (key) {
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
        await deleteDoc(doc(db, "productos", key));
        cargarProductos();
    }
};

// ── Editar un producto ──
window.editarProducto = async function (key) {
    try {
        const productoRef = doc(db, "productos", key);
        const productoSnap = await getDoc(productoRef);

        if (!productoSnap.exists()) {
            console.error("El producto no existe");
            return;
        }

        const productoData = productoSnap.data();

        // ── Manejo del combobox de categoría ──
        const categoriaSelect = document.getElementById("categoria");
        // Verifica si la opción almacenada existe; si no, se agrega
        if (!categoriaSelect.querySelector(`option[value="${productoData.categoria}"]`)) {
            const nuevaOpcion = document.createElement("option");
            nuevaOpcion.value = productoData.categoria;
            nuevaOpcion.textContent = productoData.categoria;
            categoriaSelect.appendChild(nuevaOpcion);
        }
        // Asigna el valor correspondiente
        categoriaSelect.value = productoData.categoria;

        // ── Renderizar los campos del formulario ──
        renderFormCampos();

        // Se utiliza un retardo para asegurar que el formulario se haya renderizado
        setTimeout(() => {
            document.getElementById("nombre").value = productoData.nombre;
            document.getElementById("descripcion").value = productoData.descripcion;
            document.getElementById("tiempo").value = productoData.tiempo;
            document.getElementById("costo").value = productoData.costo;
            document.getElementById("video").value = productoData.video || "";

            // ── Manejo del combobox "tipo" ──
            const selectTipo = document.getElementById("tipo");
            if (!selectTipo.querySelector(`option[value="${productoData.tipo}"]`)) {
                const nuevaOpcionTipo = document.createElement("option");
                nuevaOpcionTipo.value = productoData.tipo;
                nuevaOpcionTipo.textContent = productoData.tipo;
                selectTipo.appendChild(nuevaOpcionTipo);
            }
            selectTipo.value = productoData.tipo || "";

            // ── Cargar imágenes existentes ──
            const imagenesContainer = document.getElementById("imagenesContainer");
            imagenesContainer.innerHTML = "";
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

            // ── Agregar campo para nuevas imágenes ──
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

            // ── Cambiar el texto del botón a "Actualizar" ──
            const submitButton = document.querySelector("#productoForm button[type='submit']");
            if (submitButton) {
                submitButton.textContent = "Actualizar";
            }

            // Guardar el ID del producto para actualizarlo luego
            productoForm.dataset.editingId = key;
        }, 100);
    } catch (error) {
        console.error("Error al cargar el producto:", error);
    }
};


/// Reservas ///

function formatearFecha(fechaStr) {
    const [year, month, day] = fechaStr.split("-");
    const fecha = new Date(year, month - 1, day);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function cargarReservas() {
    reservasLista.innerHTML = "";
    const reservasSnapshot = await getDocs(collection(db, 'reservas'));
    const reservasArray = [];

    // Recopilar reservas
    reservasSnapshot.forEach((docSnap) => {
        const reserva = docSnap.data();
        reserva.id = docSnap.id;
        reservasArray.push(reserva);
    });

    // Ordenar reservas: primero pendientes, luego autorizadas, confirmadas, concluidas
    const order = ['Pendiente', 'Autorizado', 'Confirmado', 'Concluido'];
    reservasArray.sort((a, b) => {
        const aIndex = order.indexOf(a.estado.toLowerCase());
        const bIndex = order.indexOf(b.estado.toLowerCase());
        // Si no se encuentra en el orden definido, se ubica al final
        return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
    });

    // Crear filas de la tabla
    let index = 0;
    reservasArray.forEach((reserva) => {
        const fechaFormateada = formatearFecha(reserva.fecha);
        const row = document.createElement('tr');
        row.setAttribute('data-index', index);
        
        // Botón para ver la reserva
        const botonVerReserva = reserva.estado.toLowerCase() === 'cancelado'
          ? `<button class="btn btn-danger" onclick="eliminarReserva('${reserva.id}')">Eliminar</button>`
          : `<a href="detallesReserva.html?id=${reserva.id}" class="btn btn-info">Ver Reserva</a>`;
        
        // Si la reserva está autorizada, agregamos el botón "Agregar al Calendario"
        const botonAgregarCalendario = reserva.estado.toLowerCase() === 'autorizado'
          ? `<button class="btn btn-success" onclick='agregarAlCalendario(${JSON.stringify(reserva)})'>Agregar al Calendario</button>`
          : "";
        
        row.innerHTML = `
            <td>${reserva.nombre}</td>
            <td>${fechaFormateada}</td>
            <td>${reserva.municipio}</td>
            <td>${reserva.hora}</td>
            <td class="estado-reserva">${reserva.estado}</td>
            <td>${botonVerReserva} </td><td>${botonAgregarCalendario}</td>
        `;
        reservasLista.appendChild(row);
        index++;
    });
    
    // Verificar conflictos de fechas y resaltar filas conflictivas
    verificarFechasCercanas(reservasArray);
}

function calcularFechaTermino(fecha, horaInicio) {
    let [horas, minutos] = horaInicio.split(":").map(Number);
    let fechaTermino = new Date(fecha);

    horas += 6; // Sumar 6 horas a la hora de inicio

    if (horas >= 24) {
        horas -= 24;
        fechaTermino.setDate(fechaTermino.getDate() + 1);
    }

    let fechaISO = fechaTermino.toISOString().split("T")[0];
    let horaTermino24H = horas.toString().padStart(2, "0") + ":" + minutos.toString().padStart(2, "0");

    return { fecha: fechaISO, hora: horaTermino24H };
}

function convertirA12Horas(hora24) {
    let [horas, minutos] = hora24.split(":").map(Number);
    let periodo = horas >= 12 ? "PM" : "AM";
    horas = horas % 12 || 12; // Convertir 0 a 12 para formato AM/PM

    return `${horas}:${minutos.toString().padStart(2, "0")} ${periodo}`;
}

function formatearFechaHoraParaGoogle(fecha, hora) {
    let [horas, minutos] = hora.split(":").map(Number);
    
    // Asegurar que la zona horaria sea correcta (ajustar si es necesario)
    return `${fecha.replace(/-/g, "")}T${horas.toString().padStart(2, "0")}${minutos.toString().padStart(2, "0")}00`;
}

function agregarAlCalendario(reserva) {
    const { fecha: fechaTermino, hora: horaTermino24H } = calcularFechaTermino(reserva.fecha, reserva.hora);

    const horaInicio12H = convertirA12Horas(reserva.hora);
    const horaTermino12H = convertirA12Horas(horaTermino24H);

    const startDateTime = formatearFechaHoraParaGoogle(reserva.fecha, reserva.hora);
    const endDateTime = formatearFechaHoraParaGoogle(fechaTermino, horaTermino24H);

    const title = encodeURIComponent(`Reserva para ${reserva.nombre}`);
    const details = encodeURIComponent(`Cliente: ${reserva.nombre}\nFecha: ${reserva.fecha}\nHora: ${horaInicio12H} - ${horaTermino12H}\nDirección: ${reserva.direccion}`);
    const location = encodeURIComponent(reserva.direccion);

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;

    window.open(url, '_blank');
}



  
  // Hacer que la función esté disponible en el ámbito global
  window.agregarAlCalendario = agregarAlCalendario;
  
  



// ── Función para resaltar filas conflictivas ──
function resaltarFilas(indices) {
    const rows = reservasLista.querySelectorAll('tr');
    rows.forEach((row) => {
        const rowIndex = parseInt(row.getAttribute('data-index'));
        if (indices.has(rowIndex)) {
            row.classList.add('table-warning');
        }
    });
}

// ── Función para verificar reservas cercanas ──
function verificarFechasCercanas(reservas) {
    const advertencias = [];
    const filasConflictivas = new Set();

    for (let i = 0; i < reservas.length; i++) {
        for (let j = i + 1; j < reservas.length; j++) {
            const fecha1 = new Date(`${reservas[i].fecha}T${reservas[i].hora}`);
            const fecha2 = new Date(`${reservas[j].fecha}T${reservas[j].hora}`);
            const diferencia = Math.abs(fecha1 - fecha2) / (1000 * 60); // en minutos

            // Si es la misma fecha y la diferencia es menor a 300 minutos (5 horas)
            if (reservas[i].fecha === reservas[j].fecha && diferencia < 300) {
                advertencias.push(`Atención: Las reservas de ${reservas[i].nombre} y ${reservas[j].nombre} están a menos de 5 horas de diferencia.`);
                filasConflictivas.add(i);
                filasConflictivas.add(j);
            }
        }
    }

    mostrarAdvertencias(advertencias);
    resaltarFilas(filasConflictivas);
}

// ── Función para mostrar advertencias en pantalla ──
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


// ── Eliminar reserva ──
window.eliminarReserva = async function(reservaId) {
    await deleteDoc(doc(db, 'reservas', reservaId));
    alert("Reserva eliminada correctamente.");
    cargarReservas();
};

// ── Concluir reserva y archivarla ──
window.concluirReserva = async function (reservaId, reservaDataStr) {
    try {
        const reservaData = JSON.parse(decodeURIComponent(reservaDataStr));
        await setDoc(doc(db, 'reservasTerminadas', reservaId), reservaData);
        await deleteDoc(doc(db, 'reservas', reservaId));
        alert("Reserva concluida y archivada.");
        cargarReservas();
    } catch (error) {
        console.error("Error al concluir la reserva:", error);
        alert("Hubo un error al concluir la reserva.");
    }
};

// ── Funciones para manejo de imágenes ──
const formImagen = document.getElementById('formImagen');
const imagenURL = document.getElementById('imagenURL');
const imagenPreview = document.getElementById('imagenPreview');

formImagen.addEventListener('submit', async (e) => {
  e.preventDefault();
  const urlImagen = imagenURL.value;

  if (urlImagen) {
    await addDoc(collection(db, "imagenes"), { url: urlImagen });
    mostrarImagen(urlImagen);
    imagenURL.value = '';
  }
});

function mostrarImagen(url) {
    // Crear un contenedor para la imagen y el botón con fondo negro
    const imagenDiv = document.createElement('div');
    imagenDiv.classList.add('col-3', 'mb-3', 'position-relative');
    imagenDiv.style.border = '2px solid rgba(0, 0, 0, 0.3)';  // Contorno negro alrededor de cada imagen
    imagenDiv.style.borderRadius = '8px';  // Opcional: Bordes redondeados
    imagenDiv.style.overflow = 'hidden';  // Evita que la imagen se salga del contenedor
    imagenDiv.style.position = 'relative';
  
    // Crear la etiqueta de la imagen
    const imagen = document.createElement('img');
    imagen.src = url;
    imagen.classList.add('img-fluid');
    imagen.style.height = '150px';
    imagen.style.objectFit = 'cover';  // Asegura que la imagen se ajuste bien al contenedor
  
    // Crear el botón de eliminar dentro de la imagen
    const botonEliminar = document.createElement('button');
    botonEliminar.classList.add('btn', 'btn-danger', 'position-absolute', 'top-0', 'end-0', 'm-1');
    botonEliminar.innerHTML = 'X';
    botonEliminar.addEventListener('click', () => eliminarImagen(url, imagenDiv));
  
    // Añadir la imagen y el botón de eliminar al contenedor
    imagenDiv.appendChild(imagen);
    imagenDiv.appendChild(botonEliminar);
  
    // Añadir el contenedor de imagen al contenedor principal
    imagenPreview.appendChild(imagenDiv);
  }
  
async function eliminarImagen(url, imagenDiv) {
  if (confirm('¿Seguro que quieres eliminar esta imagen del carrusel?')) {
    const querySnapshot = await getDocs(collection(db, 'imagenes'));
    querySnapshot.forEach((docSnap) => {
      if (docSnap.data().url === url) {
        deleteDoc(docSnap.ref);
      }
    });
    imagenDiv.remove();
  }
}

async function cargarImagenes() {
  const imagenesSnapshot = await getDocs(collection(db, 'imagenes'));
  imagenesSnapshot.forEach((docSnap) => {
    mostrarImagen(docSnap.data().url);
  });
}

// ── Cargar imágenes y datos al iniciar ──
cargarImagenes();
cargarProductos();
cargarReservas();

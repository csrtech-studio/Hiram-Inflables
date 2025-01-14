// Variables para el modal y los botones
const modalConfirm = document.createElement('div');
modalConfirm.className = 'modal-confirm';
modalConfirm.innerHTML = `
  <div class="modal-content">
    <p>Producto agregado. ¿Desea agregar más?</p>
    <button class="btn btn-success" id="btnSi">Sí</button>
    <button class="btn btn-danger" id="btnNo">No</button>
  </div>
`;

// Agregamos el modal al body
document.body.appendChild(modalConfirm);

// Función para mostrar el modal
function mostrarModal() {
  modalConfirm.style.display = 'flex'; // Muestra el modal
}

// Función para ocultar el modal
function ocultarModal() {
  modalConfirm.style.display = 'none'; // Oculta el modal
}

// Eventos de los botones de acción dentro del modal
modalConfirm.addEventListener('click', (e) => {
  if (e.target.id === 'btnSi') {
    ocultarModal();
    alert('Puedes seguir agregando productos.');
  } else if (e.target.id === 'btnNo') {
    window.location.href = 'contactanos.html'; // Redirige a la página de contactos
  }
});

// Agregar evento a todos los botones de reservar
document.querySelectorAll('.reservar-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const nombreProducto = e.target.dataset.nombre;
      const precioProducto = parseInt(e.target.dataset.precio);
  
      // Obtener productos almacenados, o crear un array vacío si no existe
      let productosSeleccionados = JSON.parse(sessionStorage.getItem('productosSeleccionados')) || [];
  
      // Agregar el producto seleccionado
      productosSeleccionados.push({ nombre: nombreProducto, precio: precioProducto });
  
      // Guardar en sessionStorage
      sessionStorage.setItem('productosSeleccionados', JSON.stringify(productosSeleccionados));
  
      // Mostrar el modal
      mostrarModal();
    });
  });
  
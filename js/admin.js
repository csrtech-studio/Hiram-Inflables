// js/admin.js

// Firebase Authentication
const auth = firebase.auth();
const db = firebase.database();

// Manejar inicio de sesión
document.getElementById('admin-login').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('login-form').classList.add('d-none');
      document.getElementById('admin-panel').classList.remove('d-none');
      cargarProductos();
    })
    .catch((error) => alert('Error: ' + error.message));
});

// Cargar productos
function cargarProductos() {
  db.ref('productos').on('value', (snapshot) => {
    const productosLista = document.getElementById('productos-lista');
    productosLista.innerHTML = '';
    snapshot.forEach((childSnapshot) => {
      const producto = childSnapshot.val();
      const key = childSnapshot.key;

      productosLista.innerHTML += `
        <tr>
          <td>${producto.nombre}</td>
          <td>${producto.descripcion}</td>
          <td>$${producto.precio}</td>
          <td>
            <button class="btn btn-danger" onclick="eliminarProducto('${key}')">Eliminar</button>
          </td>
        </tr>
      `;
    });
  });
}

// Agregar producto
document.getElementById('add-product-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value;
  const descripcion = document.getElementById('descripcion').value;
  const precio = document.getElementById('precio').value;
  const imagen = document.getElementById('imagen').value;

  const nuevoProducto = {
    nombre,
    descripcion,
    precio,
    imagen
  };

  db.ref('productos').push(nuevoProducto);
  alert('Producto agregado correctamente');
  document.getElementById('add-product-form').reset();
});

// Eliminar producto
function eliminarProducto(key) {
  db.ref('productos/' + key).remove();
  alert('Producto eliminado correctamente');
}

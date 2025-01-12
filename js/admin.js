// js/admin.js
import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('admin-login');

  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      // Obtener valores del formulario
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        // Iniciar sesión con Firebase Authentication
        await signInWithEmailAndPassword(auth, email, password);

        // Redirigir a la página de reservas
        window.location.href = 'reservas.html';
      } catch (error) {
        console.error('Error al iniciar sesión:', error.message);
        alert('Correo o contraseña incorrectos. Intenta nuevamente.');
      }
    });
  }
});

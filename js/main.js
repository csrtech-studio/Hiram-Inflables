


document.addEventListener('DOMContentLoaded', function () {
    // Asegúrate de que los elementos existan antes de manipularlos
    const formulario = document.getElementById('contact-form');

    if (!formulario) {
        console.error('Formulario no encontrado');
        return; // Detener si no se encuentra el formulario
    }

    const fechaInput = document.getElementById('fecha');
    const hoy = new Date();
    const hoyString = hoy.toISOString().split('T')[0]; // Obtener solo la fecha en formato YYYY-MM-DD
    fechaInput.setAttribute('min', hoyString); // Establecer la fecha mínima

    // Manejar el envío del formulario
    formulario.addEventListener('submit', function (event) {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const telefono = document.getElementById('telefono').value;
        const fecha = document.getElementById('fecha').value;
        const hora = document.getElementById('hora').value;
        const paquete = document.getElementById('paquete').value;
        const direccion = document.getElementById('direccion').value;

        // Validación adicional
        if (!fecha || !hora) {
            alert('Por favor, selecciona una fecha y hora para el evento.');
            return;
        }

        // Crear mensaje para WhatsApp
        const mensaje = `*Hola Hiram Inflables, soy ${nombre}.*

Me gustaría reservar el servicio de renta de inflables para el evento el *${fecha}* a las *${hora}*.

*Mis datos son los siguientes:*
- *Teléfono:* ${telefono}
- *Paquete seleccionado:* ${paquete}
- *Dirección del evento:* ${direccion}

Por favor, *contáctenme para confirmar la reserva.* ¡Gracias!`;

        // Redirigir a WhatsApp con el mensaje
        const urlWhatsApp = `https://wa.me/+5218117604609?text=${encodeURIComponent(mensaje)}`;
        window.location.href = urlWhatsApp;
    });
});

// Obtiene los elementos de imagen y modal
var modal = document.getElementById('imagenModal');
var modalImg = document.getElementById("img01");
var images = document.querySelectorAll('.imagen-expandible');
var closeBtn = document.querySelector('.cerrar');

// Agrega el evento click a todas las imágenes
images.forEach(function (image) {
    image.onclick = function () {
        modal.style.display = "block";
        modalImg.src = this.src; // Muestra la imagen seleccionada
    }
});

// Cierra el modal cuando se hace clic en la X
closeBtn.onclick = function () {
    modal.style.display = "none";
}

// También cierra el modal cuando se hace clic fuera de la imagen
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
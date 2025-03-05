// Importa Firebase y funciones necesarias  
import { db } from './firebaseConfig.js';
import { doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { auth } from './firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
document.addEventListener('DOMContentLoaded', function () {
  // Verificar si el usuario está autenticado
  onAuthStateChanged(auth, user => {
    if (!user) {
      // Si el usuario no está autenticado, redirigir a la página de inicio
      window.location.href = 'no-autenticado.html';
    }
  });
});



// Configuración por defecto (basada en style.css)
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

// Guarda la configuración en Firebase
async function saveConfig(data) {
  try {
    await setDoc(doc(db, "styles", "config"), data);
    alert("Configuración guardada.");
  } catch (error) {
    console.error("Error al guardar configuración:", error);
    alert("Error al guardar configuración.");
  }
}

// Restablece la configuración eliminándola de Firebase y aplicando la configuración por defecto
async function resetConfig() {
  try {
    await deleteDoc(doc(db, "styles", "config"));
    alert("Configuración restablecida a los estilos originales.");
    applyStyles(defaultConfig);
    setInputs(defaultConfig);
  } catch (error) {
    console.error("Error al restablecer configuración:", error);
    alert("Error al restablecer configuración.");
  }
}

// Aplica los estilos a la vista previa
function applyStyles(config) {
  // Establece el fondo del body
  if (config.bodyBgColor) {
    document.body.style.backgroundColor = config.bodyBgColor;
  }

  // Aplica estilos al header
  const header = document.querySelector('.header');
  if (header) {
    header.style.setProperty('background-color', config.headerBgColor, 'important');
    header.style.setProperty('color', config.headerTextColor, 'important');
  }

  // Aplica estilos al título del sitio
  const title = document.querySelector('.site-title');
  if (title) {
    title.style.color = config.titleTextColor;
    title.style.fontFamily = config.titleFont;
  }

  // Aplica estilos a cada enlace de navegación
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.style.color = config.navTextColor;
    link.style.background = `linear-gradient(135deg, ${config.navBgStart}, ${config.navBgEnd})`;
  });

  // Aplica estilos a contenedores específicos (por ejemplo, títulos secundarios y párrafos)
  const containers = document.querySelectorAll('.container');
  containers.forEach(container => {
    const secondary = container.querySelector('h2');
    if (secondary) {
      secondary.style.color = config.secondaryTextColor;
      secondary.style.fontFamily = config.secondaryFont;
    }
    const mainText = container.querySelector('p');
    if (mainText) {
      mainText.style.color = config.mainTextColor;
      mainText.style.fontFamily = config.mainFont;
    }
  });
}

// Función auxiliar para obtener el valor de un input por su id o usar el valor por defecto
function getInputValue(id) {
  const element = document.getElementById(id);
  if (element) {
    return element.value;
  } else {
    console.error(`Elemento con id "${id}" no encontrado. Se usará el valor por defecto: ${defaultConfig[id]}`);
    return defaultConfig[id] || "";
  }
}

// Obtiene la configuración desde los inputs del formulario de forma segura
function getConfigFromInputs() {
  return {
    bodyBgColor: getInputValue('bodyBgColor'),
    headerBgColor: getInputValue('headerBgColor'),
    headerTextColor: getInputValue('headerTextColor'),
    titleTextColor: getInputValue('titleTextColor'),
    titleFont: getInputValue('titleFont'),
    navTextColor: getInputValue('navTextColor'),
    navBgStart: getInputValue('navBgStart'),
    navBgEnd: getInputValue('navBgEnd'),
    mainTextColor: getInputValue('mainTextColor'),
    mainFont: getInputValue('mainFont'),
    secondaryTextColor: getInputValue('secondaryTextColor'),
    secondaryFont: getInputValue('secondaryFont')
  };
}

// Actualiza los inputs del formulario con la configuración dada, verificando que existan
function setInputs(config) {
  const setVal = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
    } else {
      console.error(`Elemento con id "${id}" no encontrado.`);
    }
  };

  setVal('bodyBgColor', config.bodyBgColor);
  setVal('headerBgColor', config.headerBgColor);
  setVal('headerTextColor', config.headerTextColor);
  setVal('titleTextColor', config.titleTextColor);
  setVal('titleFont', config.titleFont);
  setVal('navTextColor', config.navTextColor);
  setVal('navBgStart', config.navBgStart);
  setVal('navBgEnd', config.navBgEnd);
  setVal('mainTextColor', config.mainTextColor);
  setVal('mainFont', config.mainFont);
  setVal('secondaryTextColor', config.secondaryTextColor);
  setVal('secondaryFont', config.secondaryFont);
}

// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // Evento para el botón de vista previa
  const previewButton = document.getElementById('previewButton');
  if (previewButton) {
    previewButton.addEventListener('click', () => {
      const config = getConfigFromInputs();
      applyStyles(config);
    });
  } else {
    console.error("El elemento 'previewButton' no fue encontrado.");
  }

  // Evento para el envío del formulario
  const stylesForm = document.getElementById('stylesForm');
  if (stylesForm) {
    stylesForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const config = getConfigFromInputs();
      await saveConfig(config);
      applyStyles(config);
    });
  } else {
    console.error("El elemento 'stylesForm' no fue encontrado.");
  }

  // Evento para el botón de restablecer configuración
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', resetConfig);
  } else {
    console.error("El elemento 'resetButton' no fue encontrado.");
  }

  // Al cargar la página, se recupera la configuración guardada (si existe) o se aplica la configuración por defecto
  window.addEventListener('load', async () => {
    try {
      const configDoc = await getDoc(doc(db, "styles", "config"));
      if (configDoc.exists()) {
        const config = configDoc.data();
        applyStyles(config);
        setInputs(config);
      } else {
        applyStyles(defaultConfig);
        setInputs(defaultConfig);
      }
    } catch (error) {
      console.error("Error al obtener la configuración:", error);
      applyStyles(defaultConfig);
      setInputs(defaultConfig);
    }
  });
});

// Importa Firebase y funciones necesarias 
import { db } from './firebaseConfig.js';
import { doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Configuración por defecto (basada en el CSS original)
const defaultConfig = {
  bodyBgColor: "#fff", // Color de fondo del body
  headerBgColor: "#222",
  headerTextColor: "#fff",
  titleTextColor: "#fff",
  titleFont: "'Comic Sans MS', cursive, sans-serif",
  navTextColor: "#fff",
  navBgStart: "#ff6b6b",
  navBgEnd: "#ffcc00",
  mainTextColor: "#333",
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
    alert("Error al restablecer configuración.");
  }
}

// Aplica los estilos a la vista previa
function applyStyles(config) {
  if (config.bodyBgColor) {
    document.body.style.backgroundColor = config.bodyBgColor;
  }

  const header = document.querySelector('.header');
  if (header) {
    header.style.backgroundColor = config.headerBgColor;
    header.style.color = config.headerTextColor;
  }

  const title = document.querySelector('.site-title');
  if (title) {
    title.style.color = config.titleTextColor;
    title.style.fontFamily = config.titleFont;
  }

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.style.color = config.navTextColor;
    link.style.background = `linear-gradient(135deg, ${config.navBgStart}, ${config.navBgEnd})`;
  });

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

// Obtiene la configuración desde los inputs del formulario
function getConfigFromInputs() {
  return {
    bodyBgColor: document.getElementById('bodyBgColor').value,
    headerBgColor: document.getElementById('headerBgColor').value,
    headerTextColor: document.getElementById('headerTextColor').value,
    titleTextColor: document.getElementById('titleTextColor').value,
    titleFont: document.getElementById('titleFont').value,
    navTextColor: document.getElementById('navTextColor').value,
    navBgStart: document.getElementById('navBgStart').value,
    navBgEnd: document.getElementById('navBgEnd').value,
    mainTextColor: document.getElementById('mainTextColor').value,
    mainFont: document.getElementById('mainFont').value,
    secondaryTextColor: document.getElementById('secondaryTextColor').value,
    secondaryFont: document.getElementById('secondaryFont').value
  };
}

// Actualiza los inputs del formulario con la configuración dada
function setInputs(config) {
  document.getElementById('bodyBgColor').value = config.bodyBgColor;
  document.getElementById('headerBgColor').value = config.headerBgColor;
  document.getElementById('headerTextColor').value = config.headerTextColor;
  document.getElementById('titleTextColor').value = config.titleTextColor;
  document.getElementById('titleFont').value = config.titleFont;
  document.getElementById('navTextColor').value = config.navTextColor;
  document.getElementById('navBgStart').value = config.navBgStart;
  document.getElementById('navBgEnd').value = config.navBgEnd;
  document.getElementById('mainTextColor').value = config.mainTextColor;
  document.getElementById('mainFont').value = config.mainFont;
  document.getElementById('secondaryTextColor').value = config.secondaryTextColor;
  document.getElementById('secondaryFont').value = config.secondaryFont;
}

// Eventos de los botones
document.getElementById('previewButton').addEventListener('click', () => {
  const config = getConfigFromInputs();
  applyStyles(config);
});

document.getElementById('stylesForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const config = getConfigFromInputs();
  await saveConfig(config);
  applyStyles(config);
});

window.addEventListener('DOMContentLoaded', () => {
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', resetConfig);
  } else {
    console.error("El elemento 'resetButton' no fue encontrado.");
  }
});

// Al cargar la página, se recupera la configuración guardada (si existe)
window.addEventListener('load', async () => {
  const configDoc = await getDoc(doc(db, "styles", "config"));
  if (configDoc.exists()) {
    const config = configDoc.data();
    applyStyles(config);
    setInputs(config);
  } else {
    applyStyles(defaultConfig);
    setInputs(defaultConfig);
  }
});

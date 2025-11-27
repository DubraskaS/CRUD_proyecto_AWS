// frontend/src/config.js

// Usamos una variable de entorno (VITE_API_URL) para que Vercel pueda inyectar 
// la URL de tu backend desplegado. Si no existe (ej: desarrollo local), usamos localhost:5000.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_URL = API_BASE_URL;
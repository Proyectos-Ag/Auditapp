import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './resources/ThemeContext';
import { initApi } from './services/api';

const root = ReactDOM.createRoot(document.getElementById('root'));
(async () => {
  try {
    await initApi();
  } catch (e) {
    console.warn('[index] initApi falló, continúo con base por defecto:', e);
  } finally {
    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </React.StrictMode>
    );

    // Métricas opcionales (como las tenías)
    reportWebVitals();
  }
})();

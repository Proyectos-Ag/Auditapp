import { useTheme } from '../context/ThemeContext';

function Tema() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="theme-switcher">
      <button onClick={toggleTheme} aria-label="Cambiar tema">
        {darkMode ? '🌞 Modo Claro' : '🌙 Modo Oscuro'}
      </button>
    </div>
  );
}

export default Tema;
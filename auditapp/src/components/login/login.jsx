import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import './css/Login.css';
import logo from '../../assets/img/logoAguida.png';
import Swal from 'sweetalert2';
import api from '../../services/api';

const SKEW_MS = 1500; // margen para evitar navegar si faltan pocos ms

function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function routeForRole(roleRaw) {
  const role = String(roleRaw || '').toLowerCase();
  if (role === 'administrador' || role === 'invitado') return '/admin';
  if (role === 'auditado') return '/auditado';
  if (role === 'auditor') return '/auditor';
  return null;
}

const Login = () => {
  const [formData, setFormData] = useState({ Correo: '', Contraseña: '' });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error] = useState('');
  const { setUserData } = useContext(UserContext);
  const navigate = useNavigate();
  const navigatedRef = useRef(false); // evita doble navegación

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const mostrarCargando = () => {
    Swal.fire({
      title: 'Verificando Credenciales...',
      text: 'Por favor, espere',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  };

  const ocultarCargando = () => Swal.close();

  // ——————————————————————————————————————
  // Redirección automática si ya hay token válido al renderizar
  // ——————————————————————————————————————
  useEffect(() => {
    (async () => {
      if (navigatedRef.current) return;

      const token = localStorage.getItem('authToken');
      if (!token) return;

      const payload = decodeJwt(token);
      const expMs = payload?.exp ? payload.exp * 1000 : 0;
      const msLeft = expMs - Date.now();

      // Si el token ya venció o está por vencer en ~1.5s, no redirigimos
      if (!payload?.exp || msLeft <= SKEW_MS) {
        localStorage.removeItem('authToken');
        return;
      }

      try {
        // Verifica con el backend (firma/estado/usuario)
        const { data } = await api.get('/auth/verifyToken');
        const user = data.user ?? data;
        setUserData(user);

        // Rol desde backend (respeta grants temporales que ya calculas ahí)
        const role = user?.tipoUsuario ?? user?.TipoUsuario;
        const path = routeForRole(role) ?? '/';
        navigatedRef.current = true;
        navigate(path, { replace: true, state: { showModal: true } });
      } catch (e) {
        // 401 u otro -> token inválido, limpiamos y nos quedamos en login
        localStorage.removeItem('authToken');
      }

      // —— OPCIONAL (bajo tu riesgo): si falla verify por red,
      // podrías confiar en el token local para navegar:
      // } catch (e) {
      //   if (!e.response) {
      //     const pathByToken = routeForRole(payload?.tipoUsuario);
      //     if (pathByToken) {
      //       navigatedRef.current = true;
      //       navigate(pathByToken, { replace: true, state: { showModal: true } });
      //     }
      //   } else {
      //     localStorage.removeItem('authToken');
      //   }
      // }
    })();
  }, [navigate, setUserData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    mostrarCargando();
    localStorage.removeItem('breadcrumbHistory');

    try {
      const base = sessionStorage.getItem('AUTH_BASE') || api.defaults.baseURL;
      sessionStorage.setItem('AUTH_BASE', base);

      // IMPORTANTE: evitar Authorization en /login
      const { data } = await api.post('/login', formData, {
        baseURL: base,
        __authFree: true,
      });

      // Guarda token
      localStorage.setItem('authToken', data.token);

      // Guarda usuario
      const user = data.user ?? data.usuario ?? {};
      setUserData(user);

      // Navega por rol
      const tipo = (user.tipoUsuario ?? user.TipoUsuario ?? '').toLowerCase();
      const path = routeForRole(tipo);
      if (path) {
        navigate(path, { state: { showModal: true } });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Rol no permitido.' });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.error || 'Credenciales inválidas. Por favor, intente de nuevo.',
        allowOutsideClick: false,
      });
    } finally {
      ocultarCargando();
    }
  };

  return (
    <div className='login-container-all'>
      <div className="login-container">
        <div className="form-group">
          <div className='espacio'>
            <img src={logo} alt="Logo Empresa" className="logo-empresa-login" />
            <div className='tipo-usuario'>Auditapp</div>
          </div>
        </div>
        {error && <p className="error-message">{error}</p>}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="Correo"></label>
            <input
              type="email"
              name="Correo"
              value={formData.Correo}
              onChange={handleChange}
              placeholder="Correo electrónico"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="Contraseña"></label>
            <input
              type={mostrarContrasena ? 'text' : 'password'}
              name="Contraseña"
              value={formData.Contraseña}
              onChange={handleChange}
              placeholder="Contraseña"
              required
            />
          </div>

          <div className="pass-vew">
            <p>ver contraseña</p>
            <input
              type="checkbox"
              id="mostrarContrasena"
              checked={mostrarContrasena}
              onChange={() => setMostrarContrasena(!mostrarContrasena)}
            />
          </div>

          <button type="submit" className="btn-login">Iniciar Sesión</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span>
            <br />
            v2.1.9(Beta)
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../App";
import "./css/Login.css";
import logo from "../../assets/img/logoAguida.png";
import Swal from "sweetalert2";
import api from "../../services/api";

const SKEW_MS = 1500; // margen para evitar navegar si faltan pocos ms

function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function routeForRole(roleRaw) {
  const role = String(roleRaw || "").toLowerCase();
  if (role === "administrador" || role === "invitado") return "/admin";
  if (role === "auditado") return "/auditado";
  if (role === "auditor") return "/auditor";
  return null;
}

const Login = () => {
  const [formData, setFormData] = useState({ Correo: "", Contraseña: "" });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { setUserData } = useContext(UserContext);
  const navigate = useNavigate();
  const navigatedRef = useRef(false); // evita doble navegación
  const emailRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const mostrarCargando = () => {
    Swal.fire({
      title: "Verificando credenciales...",
      text: "Por favor, espere",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  };

  const ocultarCargando = () => Swal.close();

  // Autofocus
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // ——————————————————————————————————————
  // Redirección automática si ya hay token válido al renderizar
  // ——————————————————————————————————————
  useEffect(() => {
    (async () => {
      if (navigatedRef.current) return;

      const token = localStorage.getItem("authToken");
      if (!token) return;

      const payload = decodeJwt(token);
      const expMs = payload?.exp ? payload.exp * 1000 : 0;
      const msLeft = expMs - Date.now();

      // Si el token ya venció o está por vencer en ~1.5s, no redirigimos
      if (!payload?.exp || msLeft <= SKEW_MS) {
        localStorage.removeItem("authToken");
        return;
      }

      try {
        const { data } = await api.get("/auth/verifyToken");
        const user = data.user ?? data;
        setUserData(user);

        const role = user?.tipoUsuario ?? user?.TipoUsuario;
        const path = routeForRole(role) ?? "/";
        navigatedRef.current = true;
        navigate(path, { replace: true, state: { showModal: true } });
      } catch {
        localStorage.removeItem("authToken");
      }
    })();
  }, [navigate, setUserData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);
    mostrarCargando();
    localStorage.removeItem("breadcrumbHistory");

    try {
      const base = sessionStorage.getItem("AUTH_BASE") || api.defaults.baseURL;
      sessionStorage.setItem("AUTH_BASE", base);

      const payload = {
        Correo: formData.Correo.trim(),
        Contraseña: formData.Contraseña,
      };

      // IMPORTANTE: evitar Authorization en /login
      const { data } = await api.post("/login", payload, {
        baseURL: base,
        __authFree: true,
      });

      localStorage.setItem("authToken", data.token);

      const user = data.user ?? data.usuario ?? {};
      setUserData(user);

      const tipo = (user.tipoUsuario ?? user.TipoUsuario ?? "").toLowerCase();
      const path = routeForRole(tipo);

      if (path) {
        navigate(path, { state: { showModal: true } });
      } else {
        setError("Rol no permitido.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Credenciales inválidas. Por favor, intente de nuevo."
      );
    } finally {
      ocultarCargando();
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <img src={logo} alt="Logo Empresa" className="login-logo" />
          <h1 className="login-title">Auditapp</h1>
          <p className="login-subtitle">Inicia sesión para continuar</p>
        </header>

        {error && (
          <div className="login-alert" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="Correo">
              Correo electrónico
            </label>
            <input
              ref={emailRef}
              id="Correo"
              type="email"
              name="Correo"
              value={formData.Correo}
              onChange={handleChange}
              placeholder="Correo electrónico"
              autoComplete="email"
              required
              aria-invalid={!!error}
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="Contrasena">
              Contraseña
            </label>

            <div className="login-inputWrap">
              <input
                id="Contrasena"
                type={mostrarContrasena ? "text" : "password"}
                name="Contraseña"
                value={formData.Contraseña}
                onChange={handleChange}
                placeholder="Contraseña"
                autoComplete="current-password"
                required
                aria-invalid={!!error}
              />

              <button
                type="button"
                className="login-toggle"
                onClick={() => setMostrarContrasena((v) => !v)}
                aria-label={mostrarContrasena ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {mostrarContrasena ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        <footer className="login-footer">
          <span className="login-version">v2.1.9 (Beta)</span>
        </footer>
      </div>
    </div>
  );
};

export default Login;
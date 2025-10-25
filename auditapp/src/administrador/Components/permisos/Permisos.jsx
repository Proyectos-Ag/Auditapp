import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Typography,
  CircularProgress,
  Tooltip,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import api from "../../../services/api";
import { toast } from "react-toastify";
// Ajusta la ruta si tu App exporta UserContext desde otro fichero
import { UserContext } from "../../../App";

// Lista de rutas de administrador (simplificadas; quita/añade según necesites)
const ADMIN_ROUTES = [
  { key: "datos", path: "/datos", label: "Datos generales" },
  { key: "programa", path: "/programa", label: "Programas" },
  { key: "usuarios", path: "/usuarios", label: "Usuarios" },
  { key: "usuariosRegistrados", path: "/usuariosRegistrados", label: "Usuarios registrados" },
  { key: "revicion", path: "/revicion", label: "Revisión" },
  { key: "terminada", path: "/terminada", label: "Terminadas" },
  { key: "finalizadas", path: "/finalizadas", label: "Vista finalizadas" },
  { key: "ishikawa", path: "/ishikawa", label: "Ishikawa" },
  { key: "calendario", path: "/calendario", label: "Calendario general" },
  { key: "departamento", path: "/departamento", label: "Departamentos" },
  { key: "diagrama", path: "/diagrama", label: "Diagrama" },
  { key: "carga", path: "/carga", label: "Carga masiva" },
  { key: "estadisticas", path: "/estadisticas", label: "Estadísticas" },
  { key: "prog-audi", path: "/prog-audi", label: "Programar auditoría" },
  { key: "ishikawas-estadisticas", path: "/ishikawas-estadisticas", label: "Ishikawa - Estadísticas" },
  { key: "ver-reali", path: "/ver-reali", label: "Ver realizaciones" },
  // agrega/ajusta más según tu lista de rutas
];

function Permisos() {
  const { user } = useContext(UserContext) ?? {}; // asumo que UserContext proporciona { user }
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [checkedMap, setCheckedMap] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      // no hacemos nada hasta tener contexto de usuario
      return;
    }
    // sólo admins pueden usar esta pantalla
    if (user?.TipoUsuario !== "administrador") {
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/usuarios`);
        // supongo que data es array de usuarios: [{ _id, nombre, email, permisos: [] }]
        setUsers(data || []);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar usuarios.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const openEditor = (u) => {
    // preparar mapa de checkboxes desde u.permisos
    const map = {};
    ADMIN_ROUTES.forEach((r) => {
      map[r.path] = !!(u.permisos?.includes(r.path) || u.permissions?.includes(r.path));
    });
    setSelectedUser(u);
    setCheckedMap(map);
    setOpen(true);
  };

  const toggleRoute = (path) => {
    setCheckedMap((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const selectAll = (value) => {
    const newMap = {};
    ADMIN_ROUTES.forEach((r) => (newMap[r.path] = !!value));
    setCheckedMap(newMap);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    const permissions = Object.entries(checkedMap)
      .filter(([_, v]) => v)
      .map(([k]) => k);

    try {
      setSaving(true);
      await api.put(`/usuarios/${selectedUser._id}/permissions`, {
        permissions,
      });
      // actualizar lista locals
      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? { ...u, permisos: permissions, permissions } : u))
      );
      toast.success("Permisos actualizados.");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar permisos.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Si el usuario no es administrador mostramos mensaje de acceso denegado
  if (!user || user?.TipoUsuario !== "administrador") {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Acceso denegado</Typography>
        <Typography variant="body2">Necesitas ser administrador para gestionar permisos.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Gestión de permisos (rutas de administrador)
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Permisos actuales</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.map((u) => (
              <TableRow key={u._id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar src={u.fotoPerfil ?? ""} alt={u.nombre || u.username}>
                      {u.nombre ? u.nombre.charAt(0).toUpperCase() : "U"}
                    </Avatar>
                    <Typography>{u.nombre ?? u.username ?? "—"}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{u.email ?? "—"}</TableCell>
                <TableCell>{u.TipoUsuario ?? u.role ?? "—"}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(u.permisos || u.permissions || []).slice(0, 5).map((p) => (
                      <Paper key={p} sx={{ px: 1, py: 0.3, fontSize: 12 }}>
                        {p}
                      </Paper>
                    ))}
                    {((u.permisos || u.permissions) || []).length > 5 && (
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        +{((u.permisos || u.permissions).length - 5)}
                      </Typography>
                    )}
                    {((u.permisos || u.permissions) || []).length === 0 && (
                      <Typography variant="caption">Sin permisos</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar permisos">
                    <IconButton onClick={() => openEditor(u)} size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2">No se encontraron usuarios.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DIALOG EDITOR */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar permisos: {selectedUser?.nombre ?? selectedUser?.email}</DialogTitle>
        <DialogContent dividers>
          <Box mb={1}>
            <Grid container spacing={1} alignItems="center">
              <Grid item>
                <Button size="small" onClick={() => selectAll(true)}>
                  Seleccionar todo
                </Button>
              </Grid>
              <Grid item>
                <Button size="small" onClick={() => selectAll(false)}>
                  Limpiar todo
                </Button>
              </Grid>
              <Grid item xs>
                <Typography variant="caption" color="textSecondary">
                  Marca las rutas a las que podrá acceder este usuario (rutas administrativas).
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box display="flex" flexDirection="column" gap={1}>
            {ADMIN_ROUTES.map((r) => (
              <FormControlLabel
                key={r.path}
                control={
                  <Checkbox
                    checked={!!checkedMap[r.path]}
                    onChange={() => toggleRoute(r.path)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" component="span">
                      {r.label}
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      {r.path}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? "Guardando..." : "Guardar permisos"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Permisos;

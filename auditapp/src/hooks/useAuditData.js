import { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../services/api';

export default function useAuditData({ _id, withIshikawa = false }) {
  const [datos, setDatos] = useState([]);
  const [ishikawas, setIshikawas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const obtenerDatos = useCallback(async () => {
    const res = await api.get(`/datos/por/${_id}`);
    return Array.isArray(res.data) ? res.data : [res.data];
  }, [_id]);

  const obtenerIshikawa = useCallback(async () => {
    const res = await api.get(`/ishikawa/por/${_id}`);
    return Array.isArray(res.data) ? res.data : [res.data];
  }, [_id]);

  // ✔ upsert que SÍ exportamos
  const upsertDato = useCallback((next) => {
    if (!next || !next._id) return;
    setDatos(prev => {
      const i = prev.findIndex(d => d._id === next._id);
      if (i === -1) return [next, ...prev];
      const copy = prev.slice();
      copy[i] = { ...copy[i], ...next };
      return copy;
    });
  }, []);

  // ✔ función de carga real y reutilizable
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [d, i] = await Promise.all([
        obtenerDatos(),
        withIshikawa ? obtenerIshikawa() : Promise.resolve([])
      ]);
      setDatos(d);
      setIshikawas(i);
    } catch (e) {
      setError('Error al obtener datos.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [obtenerDatos, obtenerIshikawa, withIshikawa]);

  useEffect(() => { load(); }, [load]);

  const ishikawasMap = useMemo(() => {
    return ishikawas.reduce((acc, ish) => {
      acc[`${ish.idReq}-${ish.idRep}-${ish.proName}`] = ish;
      return acc;
    }, {});
  }, [ishikawas]);

  return { datos, ishikawas, ishikawasMap, loading, error, refetch: load, upsertDato };
}
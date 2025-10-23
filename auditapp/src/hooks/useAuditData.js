// src/features/auditoria/hooks/useAuditData.js
import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

export default function useAuditData({_id, withIshikawa = false}) {
  const [datos, setDatos] = useState([]);
  const [ishikawas, setIshikawas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const obtenerDatos = async () => {
    const res = await api.get(`/datos/por/${_id}`);
    return Array.isArray(res.data) ? res.data : [res.data];
  };

  const obtenerIshikawa = async () => {
    const res = await api.get(`/ishikawa/por/${_id}`);
    return Array.isArray(res.data) ? res.data : [res.data];
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const [d, i] = await Promise.all([
          obtenerDatos(),
          withIshikawa ? obtenerIshikawa() : Promise.resolve([])
        ]);
        if (!mounted) return;
        setDatos(d);
        setIshikawas(i);
      } catch (e) {
        if (!mounted) return;
        setError('Error al obtener datos.');
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [_id, withIshikawa]);

  // Mapa rápido por triple clave: idReq-idRep-proName
  const ishikawasMap = useMemo(() => {
    return ishikawas.reduce((acc, ish) => {
      acc[`${ish.idReq}-${ish.idRep}-${ish.proName}`] = ish;
      return acc;
    }, {});
  }, [ishikawas]);

  return { datos, ishikawas, ishikawasMap, loading, error, refetch: () => setLoading(true) };
}
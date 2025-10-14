// src/features/auditoria/utils/ishikawa.js

// Puedes ajustar estos pesos libremente:
export const ESTADO_WEIGHTS = {
  'Pendiente': 0.0,
  'Asignado': 0.25,
  'En revisión': 0.5,
  'Aprobado': 0.75,
  'Revisado': 1.0,
  'Rechazado': 0.1, // opcional: cuenta muy poco, pero no cero
};

export const estadoToColor = (estado) => {
  switch (estado) {
    case 'Asignado': return '#055e99';
    case 'En revisión': return '#ffe817';
    case 'Rechazado': return '#ff1515';
    case 'Aprobado': return '#25d1dd';
    case 'Revisado': return '#25f71e';
    default: return '#585858';
  }
};

// Criterios que requieren seguimiento con Ishikawa
export const REQUIERE_ISHIKAWA = new Set(['m','M','C','O','o']); // incluye observación

// Devuelve: { totalEsperado, totalConPeso, porcentaje }
export function calcularCumplimientoPonderado(dato, ishikawasMap) {
  let totalEsperado = 0;
  let totalConPeso = 0;

  dato?.Programa?.forEach(programa => {
    programa?.Descripcion?.forEach(desc => {
      const crit = (desc?.Criterio || '').toString();
      if (!crit || crit === 'NA' || crit === 'Conforme') return;

      // ¿Contabiliza para %?
      if (!REQUIERE_ISHIKAWA.has(crit)) return;
      totalEsperado += 1;

      const key = `${desc.ID}-${dato._id}-${programa.Nombre}`;
      const ish = ishikawasMap[key];

      const w = ESTADO_WEIGHTS[ish?.estado] ?? 0;
      totalConPeso += w;
    });
  });

  const porcentaje = totalEsperado > 0 ? (totalConPeso / totalEsperado) * 100 : 0;
  return { totalEsperado, totalConPeso, porcentaje };
}

// Cálculo de puntos de “conformidad”
export const checkboxValues = { Conforme: 1, m: 0.7, M: 0.3, C: 0 };

// Cuenta criterios útiles y puntos
export function contarYCalcularPuntos(dato) {
  const conteo = {};
  let total = 0;
  dato?.Programa?.forEach(p =>
    p?.Descripcion?.forEach(d => {
      const crit = (d?.Criterio || '').toString();
      if (!crit || crit === 'NA' || crit.toLowerCase() === 'o') return; // excluye 'o' como en tu lógica actual
      conteo[crit] = (conteo[crit] || 0) + 1;
      total++;
    })
  );
  const puntos = Object.entries(conteo)
    .reduce((acc, [k,v]) => acc + ((checkboxValues[k] ?? 0) * v), 0)
    .toFixed(2);

  return { conteo, total, puntos };
}

// Formateo fecha
export const formatDateES = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' });
};
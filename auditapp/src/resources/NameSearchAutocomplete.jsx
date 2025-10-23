import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

function normalizeOption(o) {
  if (o === null || o === undefined) return null;
  if (typeof o === 'string') return { Nombre: o, Puesto: '', Correo: '' };
  return {
    Nombre: o.Nombre || o.nombre || o.name || '',
    Puesto: o.Puesto || o.puesto || o.cargo || o.position || '',
    Correo: o.Correo || o.correo || o.email || ''
  };
}

export default function NameSearchAutocomplete({
  value,
  onChange = () => {},
  options = null,            // si provisto, se usa en lugar de la llamada remota
  fetch = true,             // por defecto consume el endpoint
  fetchUrl = `/usuarios/nombres`,
  placeholder = '',
  label = '',
  size = 'small',
  freeSolo = true,
  disableClearable = false,
  getOptionLabel = null,
  renderOptionExtra = null,
  TextFieldProps = {}
}) {
  const [remoteOptions, setRemoteOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadNames = async () => {
      if (!fetch) return;
      setLoading(true);
      try {
        const res = await api.get(fetchUrl);
        if (!res || !res.data) {
          if (mounted) setRemoteOptions([]);
          return;
        }

        if (Array.isArray(res.data) && res.data.length && typeof res.data[0] === 'string') {
          const users = res.data.map(n => ({ Nombre: n }));
          if (mounted) setRemoteOptions(users);
        } else if (Array.isArray(res.data)) {
          const users = res.data.map(u => ({
            Nombre: u.Nombre || u.nombre || (typeof u === 'string' ? u : ''),
            Puesto: u.Puesto || u.puesto || u.cargo || '',
            Correo: u.Correo || u.correo || u.email || ''
          })).filter(u => u.Nombre);
          if (mounted) setRemoteOptions(users);
        } else {
          if (mounted) setRemoteOptions([]);
        }
      } catch (err) {
        console.warn('NameSearchAutocomplete: no se pudieron cargar los nombres', err);
        if (mounted) setRemoteOptions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadNames();
    return () => { mounted = false; };
  }, [fetch, fetchUrl]);

  // Decide qué opciones usar: prop `options` tiene prioridad si viene
  const normalizedOptions = useMemo(() => {
    const source = Array.isArray(options) && options.length ? options : remoteOptions;
    return (source || []).map(o => normalizeOption(o)).filter(Boolean);
  }, [options, remoteOptions]);

  // Determinar selección actual intentando casarla por Nombre
  const selected = useMemo(() => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') {
      return normalizedOptions.find(opt => opt.Nombre === value) || value;
    }
    const n = normalizeOption(value);
    if (!n) return null;
    return normalizedOptions.find(opt => opt.Nombre === n.Nombre) || n;
  }, [value, normalizedOptions]);

  const defaultGetLabel = (opt) => (opt ? (typeof opt === 'string' ? opt : (opt.Nombre || '')) : '');

  return (
    <Autocomplete
      freeSolo={freeSolo}
      disableClearable={disableClearable}
      options={normalizedOptions}
      getOptionLabel={(opt) => getOptionLabel ? getOptionLabel(opt) : defaultGetLabel(opt)}
      value={selected ?? ''}
      onChange={(e, newVal) => {
        if (!newVal) return onChange('');
        if (typeof newVal === 'string') return onChange(newVal);
        return onChange(normalizeOption(newVal));
      }}
      loading={loading}
      renderOption={(props, option) => (
        <li {...props} key={option.Correo || option.Nombre}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 13 }}>{option.Nombre}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{option.Puesto || option.Correo}</div>
            {renderOptionExtra && renderOptionExtra(option)}
          </div>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          size={size}
          placeholder={placeholder}
          label={label}
          {...TextFieldProps}
        />
      )}
    />
  );
}

NameSearchAutocomplete.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onChange: PropTypes.func,
  options: PropTypes.array,
  fetch: PropTypes.bool,
  fetchUrl: PropTypes.string,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  size: PropTypes.string,
  freeSolo: PropTypes.bool,
  disableClearable: PropTypes.bool,
  getOptionLabel: PropTypes.func,
  renderOptionExtra: PropTypes.func,
  TextFieldProps: PropTypes.object
};

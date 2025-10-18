import React, { useState, useEffect } from 'react';
import { Paper, List, ListItem, TextField } from '@mui/material';
import api from '../../../services/api';

const Busqueda = ({ onSelect, placeholder = "Buscar nombre..." }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      api.get(`/usuarios/search?search=${encodeURIComponent(searchTerm)}`)
        .then(response => {
          setSuggestions(response.data);
        })
        .catch(error => {
          console.error("Error al buscar participantes:", error);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelect = (user) => {
    setSearchTerm("");
    setSuggestions([]);
    if (onSelect) {
      onSelect(user);
    }
  };

  return (
    <div>
      <TextField
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        margin="normal"
      />
      {suggestions.length > 0 && (
        <Paper
          style={{
            maxHeight: "10rem",
            overflowY: "auto",
            marginBottom: "1rem",
            cursor: "pointer"
          }}
        >
          <List>
            {suggestions.map((participant, index) => (
              <ListItem
                button
                key={index}
                onClick={() => handleSelect(participant)}
              >
                {participant.Nombre}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
};

export default Busqueda;

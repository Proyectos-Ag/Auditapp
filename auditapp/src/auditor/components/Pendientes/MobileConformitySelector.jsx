import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { CheckBox, Close, CheckCircle } from '@mui/icons-material';

const MobileConformitySelector = ({ selectedValue, onSelect }) => {
  const [open, setOpen] = useState(false);

  const options = [
    { value: 'Conforme', label: 'Conforme', color: 'success' },
    { value: 'm', label: 'Menor', color: 'warning' },
    { value: 'M', label: 'Mayor', color: 'error' },
    { value: 'C', label: 'Crítico', color: 'error' },
    { value: 'NA', label: 'No Aplica', color: 'info' }
  ];

  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <>
      <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Estado del Requisito
        </Typography>
        <Button
          fullWidth
          variant={selectedValue ? 'contained' : 'outlined'}
          color={selectedOption?.color || 'primary'}
          onClick={() => setOpen(true)}
          startIcon={<CheckBox />}
          sx={{ justifyContent: 'flex-start' }}
        >
          {selectedOption?.label || 'Seleccionar estado'}
        </Button>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullScreen>
        <AppBar position="sticky" elevation={1}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Seleccionar Estado
            </Typography>
          </Toolbar>
        </AppBar>
        <List>
          {options.map((option) => (
            <ListItem
              key={option.value}
              button
              onClick={() => {
                onSelect(option.value);
                setOpen(false);
              }}
              selected={selectedValue === option.value}
              sx={{
                borderLeft: selectedValue === option.value ? 4 : 0,
                borderColor: `${option.color}.main`,
                backgroundColor: selectedValue === option.value ? `${option.color}.light` : 'transparent'
              }}
            >
              <ListItemIcon>
                <CheckCircle color={selectedValue === option.value ? option.color : 'disabled'} />
              </ListItemIcon>
              <ListItemText
                primary={option.label}
                primaryTypographyProps={{
                  fontWeight: selectedValue === option.value ? 600 : 400
                }}
              />
            </ListItem>
          ))}
        </List>
      </Dialog>
    </>
  );
};

export default MobileConformitySelector;
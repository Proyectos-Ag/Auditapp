import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { CameraAlt, Delete } from '@mui/icons-material';

const MobilePhotoManager = ({ photos, onAddPhoto, onDeletePhoto, onPreviewPhoto }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Evidencia Fotográfica ({photos.length}/4)
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {photos.map((photo, index) => {
          const src = typeof photo === 'string' ? photo : URL.createObjectURL(photo);

          return (
            <Box
              key={index}
              sx={{
                position: 'relative',
                width: 80,
                height: 80,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <img
                src={src}
                alt={`Evidencia ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  cursor: 'pointer'
                }}
                onClick={() => onPreviewPhoto(src, index)}
              />
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.7)'
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhoto(index);
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          );
        })}

        {photos.length < 4 && (
          <Box
            sx={{
              width: 80,
              height: 80,
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: 'primary.light',
              '&:hover': {
                backgroundColor: 'primary.main',
                '& .MuiSvgIcon-root': {
                  color: 'white'
                }
              }
            }}
            onClick={onAddPhoto}
          >
            <CameraAlt sx={{ color: 'primary.main', fontSize: 32 }} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MobilePhotoManager;
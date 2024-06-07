import { Container, Card, Icon, Button, Modal } from 'semantic-ui-react';
import './css/Camara.css';
import { useEffect, useRef, useState } from 'react';

function Fotos({ open, onClose, onCapture }) {
  const videoDiv = useRef(null);
  const fotoDiv = useRef(null);
  const [hayFoto, setHayFoto] = useState(false);
  const [stream, setStream] = useState(null);

  const verCamara = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 420, height: 210 }
      });
      setStream(currentStream);
      if (videoDiv.current) {
        videoDiv.current.srcObject = currentStream;
        videoDiv.current.play();
      }
    } catch (err) {
      console.log(err);
    }
  };

  const detenerCamara = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const tomarFoto = () => {
    const w = 430;
    const h = w / (16 / 9);

    const video = videoDiv.current;
    const foto = fotoDiv.current;

    if (foto && video) {
      foto.width = w;
      foto.height = h;
      const context = foto.getContext('2d');
      context.drawImage(video, 0, 0, w, h);
      setHayFoto(true);

      // Captura la imagen como una base64 string
      const dataUrl = foto.toDataURL('image/png');
      onCapture(dataUrl);
    }
  };

  const cerrarFoto = () => {
    const f = fotoDiv.current;
    if (f) {
      const context = f.getContext('2d');
      context.clearRect(0, 0, f.width, f.height);
      setHayFoto(false);
    }
  };

  useEffect(() => {
    if (open) {
      verCamara();
    } else {
      detenerCamara();
    }

    return () => {
      detenerCamara();
    };
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} size="small" className="fixed-modal">
      <Modal.Content>
        <Container className="miApp" fluid textAlign="center">
          <Card.Group centered>
            <Card>
              <video ref={videoDiv} style={{ width: '100%' }}></video>
              <Card.Content>
                <Button className="camera-button" color="teal" onClick={tomarFoto} disabled={!open}>
                <span class="material-symbols-outlined">
                photo_camera
                </span>
                </Button>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
                <Button color="red" onClick={onClose}>
                  <Icon name="close" /> Cerrar
                </Button>
              </Card.Content>
            </Card>
            <Card>
              <canvas ref={fotoDiv}></canvas>
              {hayFoto && (
                <Card.Content>
                  <Button color="red" onClick={cerrarFoto}>
                    <Icon name="close" /> Cerrar Foto
                  </Button>
                </Card.Content>
              )}
            </Card>
          </Card.Group>
        </Container>
      </Modal.Content>
    </Modal>
  );
}

export default Fotos;
import { Container, Card, Icon, Button } from 'semantic-ui-react';
import './css/Camara.css';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

function Fotos() {
  const videoDiv = useRef(null);
  const fotoDiv = useRef(null);
  const [hayFoto, setHayFoto] = useState(false);
  const [stream, setStream] = useState(null);
  const [camaraActiva, setCamaraActiva] = useState(false);

  const verCamara = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 420, height: 240 }
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
      enviarFoto(dataUrl);
    }
  };

  const enviarFoto = async (dataUrl) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/foto`, { image: dataUrl });
      console.log('Foto enviada exitosa mente');
    } catch (err) {
      console.log('Error al enviar la foto:', err);
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
    if (camaraActiva) {
      verCamara();
    } else {
      detenerCamara();
    }

    return () => {
      detenerCamara();
    };
  }, [camaraActiva]);

  return (
    <Container className="miApp" fluid textAlign="center">
      <Card.Group centered>
        <Card>
          {camaraActiva && <video ref={videoDiv}></video>}
          <Card.Content>
            <Button color="teal" onClick={tomarFoto} disabled={!camaraActiva}>
              <Icon name="camera" /> Tomar foto
            </Button>
            <Button color={camaraActiva ? 'red' : 'green'} onClick={() => setCamaraActiva(prev => !prev)}>
              <Icon name={camaraActiva ? 'pause' : 'play'} /> {camaraActiva ? 'Desactivar' : 'Activar'} Cámara
            </Button>
          </Card.Content>
        </Card>
        <Card>
          <canvas ref={fotoDiv}></canvas>
          {hayFoto && (
            <Card.Content>
              <Button color="red" onClick={cerrarFoto}>
                <Icon name="close" /> Cerrar
              </Button>
            </Card.Content>
          )}
        </Card>
      </Card.Group>
    </Container>
  );
}

export default Fotos;

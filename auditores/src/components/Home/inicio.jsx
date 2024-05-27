import React, { useState, useEffect } from "react";
import './css/inicio.css';
import nopal from './assets/img/nopal.jpg'
import nopal2 from './assets/img/nopal2.jpg'
import Navigation from "../Navigation/narbar"


const Inicio = () => {
  const images = [nopal, nopal2];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="inicio-container" style={{ backgroundImage: `url(${images[currentImageIndex]})`, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <Navigation />
      </div>
      <h1>Bienvenido</h1>
    </div>
  );
  
};

export default Inicio;
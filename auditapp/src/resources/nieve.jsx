import React, { useEffect, useRef } from 'react';
import './css/nieve.css';

const sizes = ['small', 'medium', 'large'];
const colors = ['#FF5E5E', '#FF7F7F', '#FFB6C1', '#FFC0CB'];

const Nieve = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const numHearts = 15; // Ajusta el número de corazones según lo necesites

    for (let i = 0; i < numHearts; i++) {
      const heart = document.createElement('div');
      heart.classList.add('heart');
      // Asigna aleatoriamente un tamaño
      const sizeClass = sizes[Math.floor(Math.random() * sizes.length)];
      heart.classList.add(sizeClass);
      // Asigna aleatoriamente un color a través de una variable CSS
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];
      heart.style.setProperty('--heart-color', chosenColor);
      // Posición horizontal aleatoria
      heart.style.left = Math.random() * 100 + '%';
      // Retraso y duración aleatorios para evitar sincronización
      heart.style.animationDelay = Math.random() * 5 + 's';
      heart.style.animationDuration = 8 + Math.random() * 5 + 's';
      container.appendChild(heart);
    }
  }, []);

  return <div ref={containerRef} className="heart-background"></div>;
};

export default Nieve;

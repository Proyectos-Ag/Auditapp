import React, { useContext,useState, useEffect } from "react";
import './css/inicio.css';
import nopal from '../../assets/img/nopal.jpg'
import nopal2 from '../../assets/img/nopal2.jpg'
import Navigation from "../Navigation/Navbar"
import { UserContext } from '../../App';


const Inicio = () => {
  const images = [nopal, nopal2];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { userData, setUserData } = useContext(UserContext);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, [setUserData]);

  return (
    <div className="inicio-container" style={{ backgroundImage: `url(${images[currentImageIndex]})`, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0 }}>
        <Navigation />
      </div>
      <div className="inicio-content">
          <h1>Bienvenido</h1>
          {userData && (
            <div className="user-info">
              <p className="user-name">{userData.Nombre}</p>
            </div>
          )}
        </div>
    </div>
  );
  
};

export default Inicio;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import iconoNotificaciones from '../Images/Notification_Bell_2-transformed.png';
import iconoMensajes from '../Images/chat-icon3.png';
import NotificationDropdown from './NotificationDropdown';
import NotificationBell from '../Images/Notification_Bell_2-transformed.png';
import iconoPublicar from '../Images/plus-pequeno.svg';

export default function Footer() {
  const [user, setUser] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("https://localhost:8080/usuario/perfil", { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user", error);
      }
    };
    fetchUser();

    // Listener para detectar cambios en el tamaño de la ventana
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  return (
    <footer className="footer">
      {/* Mostrar los iconos solo si el ancho de la ventana es menor a 768px y el usuario está logueado */}
      {user && windowWidth < 768 && (
        <div className="footer-icons">
          <Link to="/usuario/notificaciones">
          <img
        src={NotificationBell}
        className="notification-bell"
        alt="Notification Bell"
      />
      </Link>
          <Link to="/devocionales/crear">
          <img src={iconoPublicar} className='publicar-icon'/> 
          </Link>
          <Link to={`/conversaciones/${user.idUsuario}`}>
            <img src={iconoMensajes} alt="Mensajes" className='chat-icon'/>
          </Link>
          
        </div>
      )}
    </footer>
  );
}
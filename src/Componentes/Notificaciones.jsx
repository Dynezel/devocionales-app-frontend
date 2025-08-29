import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/Notificaciones.css';
import MensajeriaPopup from './Mensajeria';
import { useNavigate } from 'react-router-dom';
import defaultImage from '../Images/default-image-profile.jpg';

const Notificaciones = () => { 
  const [notifications, setNotifications] = useState([]);
  const [notificationActiva, setNotificationActiva] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Traer usuario logueado
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("https://localhost:8080/usuario/perfil", { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        console.error("No se ha podido encontrar al usuario", error);
      }
    };
    fetchUser();
  }, []);

  // Traer notificaciones y agregar imagenes de emisor
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`https://localhost:8080/notificaciones/${user.idUsuario}`, { withCredentials: true });
        const notificationsWithImages = await Promise.all(
          response.data.map(async (n) => {
            let imagenEmisor = defaultImage;
            try {
              const imgResp = await axios.get(`https://localhost:8080/imagen/perfil/${n.usuarioEmisorId}`, { responseType: 'blob' });
              imagenEmisor = URL.createObjectURL(imgResp.data);
            } catch {}
            return { ...n, imagenEmisor };
          })
        );
        setNotifications(notificationsWithImages);
      } catch (error) {
        console.error('Error fetching notifications', error);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleNotificationClick = async (notification) => {
    try {
      await axios.put(`https://localhost:8080/notificaciones/marcar-como-leida/${notification.id}`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, visto: true } : n))
      );

      if (notification.tipo === 'mensaje') {
        setNotificationActiva(notification.usuarioEmisorId);
      } else if (notification.tipo === "megusta" && notification.devocionalId) {
        navigate(`/devocional/${notification.devocionalId}`);
      } else if (notification.tipo === "comentario" && notification.devocionalId) {
        navigate(`/devocional/${notification.devocionalId}`);
      }
    } catch (error) {
      console.error('Error handling notification click', error);
    }
  };

  return (
    <div className="notificaciones-container">
      <h3>Tus Notificaciones</h3>
      <ul>
        {notifications.length === 0 ? (
          <li className="notification-item">No hay nuevas notificaciones</li>
        ) : (
          notifications.map((notification) => (
            <li
              key={notification.id}
              className={`notification-item ${notification.visto ? 'leida' : 'no-leida'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <img src={notification.imagenEmisor} alt={notification.nombreEmisor} className="notification-emisor-img" />
              <span>{notification.mensaje}</span>
            </li>
          ))
        )}
      </ul>

      {notificationActiva && (
        <MensajeriaPopup
          usuarioId={notificationActiva}
          usuarioActualId={user.idUsuario}
          onClose={() => setNotificationActiva(null)}
        />
      )}
    </div>
  );
};

export default Notificaciones;

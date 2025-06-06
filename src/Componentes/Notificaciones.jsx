import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/Notificaciones.css';
import MensajeriaPopup from './Mensajeria';
import { useNavigate } from 'react-router-dom';

const Notificaciones = () => {
  const [notifications, setNotifications] = useState([]);
  const [notificationActiva, setNotificationActiva] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://localhost:8080/usuario/perfil", { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        console.error("No se ha podido encontrar al usuario", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const response = await axios.get(`http://localhost:8080/notificaciones/${user.idUsuario}`, { withCredentials: true });
          setNotifications(response.data);
        } catch (error) {
          console.error('Error fetching notifications', error);
        }
      };
      fetchNotifications();
    }
  }, [user]);

  const handleNotificationClick = async (notification) => {
    try {
      await axios.put(`http://localhost:8080/notificaciones/marcar-como-leida/${notification.id}`);
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => (n.id === notification.id ? { ...n, visto: true } : n))
      );

      if (notification.tipo === 'mensaje') {
        setNotificationActiva(notification.usuarioEmisorId);
      }
      else if (notification.tipo === "megusta") {
        navigate(`/devocional/${notification.devocionalId}`)
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
              {notification.mensaje}
            </li>
          ))
        )}
      </ul>
      {notificationActiva && notification.tipo === "mensaje" (
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

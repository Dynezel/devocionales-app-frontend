import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NotificationBell from '../Images/Notification_Bell_2-transformed.png';
import '../css/NotificationDropdown.css';
import MensajeriaPopup from './Mensajeria';
import { useNavigate } from 'react-router-dom';
import defaultImage from '../Images/default-image-profile.jpg';

const NotificationDropdown = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationActiva, setNotificationActiva] = useState(null);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`https://localhost:8080/notificaciones/${user.idUsuario}`);
        const notificationsWithImages = await Promise.all(
          response.data.map(async (notification) => {
            try {
              const imageResponse = await axios.get(
                `https://localhost:8080/imagen/perfil/${notification.usuarioEmisorId}`,
                { responseType: 'arraybuffer' }
              );
              const base64Image = btoa(
                new Uint8Array(imageResponse.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
              );
              return { ...notification, imagenEmisor: `data:image/jpeg;base64,${base64Image}` };
            } catch {
              return { ...notification, imagenEmisor: defaultImage  };
            }
          })
        );
        setNotifications(notificationsWithImages);
      } catch (error) {
        console.error('Error fetching notifications', error);
      }
    };

    fetchNotifications();
  }, [user.idUsuario]);

  const handleNotificationClick = async (notification) => {
    try {
      await axios.put(`https://localhost:8080/notificaciones/marcar-como-leida/${notification.id}`);
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notification.id ? { ...n, visto: true } : n
        )
      );

      if (notification.tipo === 'mensaje') {
        setNotificationActiva(notification.usuarioEmisorId);
      } else if (notification.tipo === 'megusta' || notification.tipo === "comentario" || notification.tipo === "devocionalcreado") {
        navigate(notification.url);
      }
    } catch (error) {
      console.error('Error handling notification click', error);
    }
  };

  const handleAceptarSolicitud = async (usuarioId, amigoId) => {
    try {
      await axios.post(`https://localhost:8080/amistades/${usuarioId}/aceptar-solicitud/${amigoId}`);
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.usuarioEmisorId !== amigoId)
      );
    } catch (error) {
      console.error('Error accepting friend request', error);
    }
  };
  
  const handleRechazarSolicitud = async (usuarioId, amigoId) => {
    try {
      await axios.delete(`https://localhost:8080/amistades/${usuarioId}/rechazar-solicitud/${amigoId}`);
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.usuarioEmisorId !== amigoId)
      );
    } catch (error) {
      console.error('Error rejecting friend request', error);
    }
  };

  const handleClickIconoNotificacion = () => {
    setDropdownAbierto(!dropdownAbierto);
  };

  return (
    <div className="notification-container">
      <img
        src={NotificationBell}
        className="notification-bell"
        alt="Notification Bell"
        onClick={handleClickIconoNotificacion}
      />
      {dropdownAbierto && (
        <div className="notification-dropdown">
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
                  <img src={notification.imagenEmisor} alt="Emisor" className="notification-emisor-img" />
                  <span>{notification.mensaje}</span>
                  
                  {notification.tipo === 'solicitudamistad' && (
                    <div className="notification-actions">
                      <button onClick={() => handleAceptarSolicitud(notification.usuarioEmisorId, user.idUsuario)}>Aceptar</button>
                      <button onClick={() => handleRechazarSolicitud(notification.usuarioEmisorId, user.idUsuario)}>Rechazar</button>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
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

export default NotificationDropdown;
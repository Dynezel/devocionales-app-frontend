import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import NotificationBell from '../Images/Notification_Bell_2-transformed.png';
import '../css/NotificationDropdown.css';
import MensajeriaPopup from './Mensajeria';
import { useNavigate } from 'react-router-dom';
import defaultImage from '../Images/default-image-profile.jpg';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const NotificationDropdown = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationActiva, setNotificationActiva] = useState(null);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const stompClientRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.idUsuario) fetchNotifications();
  }, [user?.idUsuario]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`https://devocionales-app-backend.onrender.com/notificaciones/${user.idUsuario}`);
      const notificationsWithImages = await Promise.all(
        response.data.map(async (n) => {
          let imagenEmisor = defaultImage;
          try {
            const imgResp = await axios.get(`https://devocionales-app-backend.onrender.com/imagen/perfil/${n.usuarioEmisorId}`, { responseType: 'blob' });
            imagenEmisor = URL.createObjectURL(imgResp.data);
          } catch {}
          return { ...n, imagenEmisor };
        })
      );
      setNotifications(notificationsWithImages);
      setNoLeidas(notificationsWithImages.filter(n => !n.visto).length);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  useEffect(() => {
    if (!user?.idUsuario) return;

    const socket = new SockJS(`https://devocionales-app-backend.onrender.com/ws-notifications?userId=${user.idUsuario}`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/notificaciones', async (message) => {
          let body = message.body;
          if (message.isBinaryBody && message._binaryBody) {
            body = new TextDecoder().decode(message._binaryBody);
          }
          const nueva = JSON.parse(body);
          let imagenEmisor = defaultImage;
          try {
            const imgResp = await axios.get(`https://devocionales-app-backend.onrender.com/imagen/perfil/${nueva.usuarioEmisorId}`, { responseType: 'blob' });
            imagenEmisor = URL.createObjectURL(imgResp.data);
          } catch {}
          setNotifications(prev => [{ ...nueva, imagenEmisor }, ...prev]);
          setNoLeidas(prev => prev + 1);
        });
      },
      onStompError: (frame) => console.error("STOMP error:", frame)
    });

    client.activate();
    stompClientRef.current = client;

    return () => client.deactivate();
  }, [user?.idUsuario]);

  const handleNotificationClick = async (notification) => {
    try {
      await axios.put(`https://devocionales-app-backend.onrender.com/notificaciones/marcar-como-leida/${notification.id}`);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, visto: true } : n)
      );
      setNoLeidas(prev => Math.max(0, prev - 1));

      if (notification.tipo === 'mensaje') setNotificationActiva(notification.usuarioEmisorId);
      else if (['megusta', 'comentario', 'devocionalcreado'].includes(notification.tipo)) navigate(notification.url);
    } catch (err) {
      console.error('Error handling notification click', err);
    }
  };

  const handleClickIconoNotificacion = () => setDropdownAbierto(!dropdownAbierto);

  const handleAceptarSolicitud = async (emisorId) => {
    try {
      await axios.post(`https://devocionales-app-backend.onrender.com/amistades/${user.idUsuario}/aceptar-solicitud/${emisorId}`);
      fetchNotifications();
    } catch (err) {
      console.error("Error al aceptar solicitud de amistad:", err);
    }
  };

  const handleRechazarSolicitud = async (emisorId) => {
    try {
      await axios.delete(`https://devocionales-app-backend.onrender.com/amistades/${user.idUsuario}/rechazar-solicitud/${emisorId}`);
      fetchNotifications();
    } catch (err) {
      console.error("Error al rechazar solicitud de amistad:", err);
    }
  };

  return (
    <div className="notification-container">
      <div className="notification-icon-wrapper" onClick={handleClickIconoNotificacion}>
        <img src={NotificationBell} className="notification-bell" alt="Notification Bell" />
        {noLeidas > 0 && <span className="notification-badge">{noLeidas}</span>}
      </div>

      {dropdownAbierto && (
        <div className="notification-dropdown">
          <h3>Tus Notificaciones</h3>
          <ul>
            {notifications.length === 0 ? (
              <li className="notification-item">No hay nuevas notificaciones</li>
            ) : (
              notifications.map(notification => (
                <li
                  key={notification.id}
                  className={`notification-item ${notification.visto ? 'leida' : 'no-leida'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <img src={notification.imagenEmisor} alt={notification.nombreEmisor} className="notification-emisor-img" />
                  <span>{notification.mensaje}</span>
                  {notification.tipo === 'solicitudamistad' && (
                    <div className="notification-actions">
                      <button onClick={() => handleAceptarSolicitud(notification.usuarioEmisorId)}>Aceptar</button>
                      <button onClick={() => handleRechazarSolicitud(notification.usuarioEmisorId)}>Rechazar</button>
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

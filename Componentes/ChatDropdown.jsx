import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import iconoChat from '../Images/chat-icon3.png'; // Reemplaza con tu ruta real al icono de chat
import '../css/ChatDropdown.css'; // Estilo para el dropdown
import MensajeriaPopup from './Mensajeria';

const ChatDropdown = ({ user }) => {
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null); // Estado para mantener la conversación activa
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  useEffect(() => {
    const obtenerConversaciones = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/mensajes/conversaciones/${user.idUsuario}`);
        setConversaciones(response.data);
      } catch (error) {
        console.error('Error al obtener las conversaciones:', error);
      }
    };

    obtenerConversaciones();
  }, [user.idUsuario]);

  const handleAbrirMensajeria = (usuarioId) => {
    setConversacionActiva(usuarioId);
    // Cierra el dropdown después de abrir la mensajería si es necesario
    setDropdownAbierto(false);
  };

  const handleClickIconoChat = () => {
    // Cambia el estado del dropdown al hacer clic en el icono de chat
    setDropdownAbierto(!dropdownAbierto);
  };

  return (
    <div className={`chat-dropdown ${dropdownAbierto ? 'open' : ''}`}>
      <img
        src={iconoChat}
        className="chat-icon"
        alt="Chat Icon"
        onClick={handleClickIconoChat}
      />
      <div className="chat-dropdown-content">
        <h3>Tus Conversaciones</h3>
        <ul>
          {conversaciones.map((usuario) => (
            <li key={usuario.idUsuario}>
              <button onClick={() => handleAbrirMensajeria(usuario.idUsuario)}>
                Conversar con {usuario.nombre}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {conversacionActiva && (
        <MensajeriaPopup
          usuarioId={conversacionActiva}
          usuarioActualId={user.idUsuario}
          onClose={() => setConversacionActiva(null)}
        />
      )}
    </div>
  );
};

export default ChatDropdown;

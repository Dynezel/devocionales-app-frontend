import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import '../css/Conversaciones.css';
import Mensajeria from './Mensajeria';

export default function Conversaciones() {
  const { usuarioActualId } = useParams();
  const [conversaciones, setConversaciones] = useState([]);
  const [mostrarMensajeriaPara, setMostrarMensajeriaPara] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerConversaciones = async () => {
      try {
        const response = await axios.get(`https://devocionales-app-backend.onrender.com/mensajes/conversaciones/${usuarioActualId}`);
        setConversaciones(response.data);
      } catch (error) {
        console.error('Error al obtener las conversaciones:', error);
      }
    };

    obtenerConversaciones();
  }, [usuarioActualId]);

  const handleEnviarMensaje = (usuarioId) => {
    setMostrarMensajeriaPara(usuarioId);
  };

  const cerrarMensajeria = () => {
    setMostrarMensajeriaPara(null);
  };

  return (
    <div className="conversaciones">
      <h2>Tus Conversaciones</h2>
      <ul>
        {conversaciones.map((usuario) => (
          <li key={usuario.idUsuario}>
            <button onClick={() => handleEnviarMensaje(usuario.idUsuario)}>
              Conversar con {usuario.nombre}
            </button>
            {mostrarMensajeriaPara === usuario.idUsuario && (
              <Mensajeria
                usuarioId={usuario.idUsuario}
                usuarioActualId={usuarioActualId}
                onClose={cerrarMensajeria}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

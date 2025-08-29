import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import defaultImage from '../Images/default-image-profile.jpg';
import '../css/Amigos.css';

export default function Amigos({ usuarioId, usuarioActualId }) {
  const [amigos, setAmigos] = useState([]);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [esAmigo, setEsAmigo] = useState(false);
  const [mostrarAmigos, setMostrarAmigos] = useState(false);
  const amigosRef = useRef(null);
  const navigate = useNavigate();

  const esPerfilPropio = usuarioId === usuarioActualId;

  const obtenerAmigos = async () => {
    try {
      const response = await axios.get(
        `https://devocionales-app-backend.onrender.com/amistades/${usuarioId}/amigos`
      );
      const listaAmigos = response.data || [];
      setAmigos(listaAmigos);

      // Verifica si el usuario actual está en la lista de amigos
      const amigoExistente = listaAmigos.some(a => a.id === usuarioActualId);
      setEsAmigo(amigoExistente);
    } catch (error) {
      console.error("Error al obtener amigos:", error);
    }
  };

  useEffect(() => {
    obtenerAmigos();
  }, [usuarioId, usuarioActualId, solicitudEnviada]);

  const enviarSolicitudAmistad = async () => {
    if (!usuarioActualId) {
      alert("Debes iniciar sesión para enviar una solicitud de amistad.");
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `https://devocionales-app-backend.onrender.com/amistades/${usuarioActualId}/enviar-solicitud/${usuarioId}`
      );
      setSolicitudEnviada(true);
    } catch (error) {
      console.error("Error al enviar solicitud de amistad:", error);
    }
  };

  const eliminarAmigo = async (amigoId) => {
    try {
      await axios.delete(
        `https://devocionales-app-backend.onrender.com/amistades/${usuarioId}/eliminar/${amigoId}`
      );
      setAmigos(prev => prev.filter(a => a.id !== amigoId));
      if (amigoId === usuarioActualId) setEsAmigo(false);
    } catch (error) {
      console.error("Error al eliminar amigo:", error);
    }
  };

  const handleClickOutside = (event) => {
    if (amigosRef.current && !amigosRef.current.contains(event.target)) {
      setMostrarAmigos(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="amigos-container">
      <div className="amigos" onClick={() => setMostrarAmigos(!mostrarAmigos)}>
        <p>Amigos</p>
        <p>{amigos.length}</p>

        {mostrarAmigos && (
          <div className="amigos-lista" ref={amigosRef}>
            <h3>Amigos</h3>
            <ul>
              {amigos.length === 0 && <li>No hay amigos aún.</li>}
              {amigos.map((amigo) => (
                <li key={amigo.id}>
                  <Link to={`/usuario/perfil/${amigo.id}`}>
                    <button className="boton-amigos">
                      <img
                        src={`https://devocionales-app-backend.onrender.com/imagen/perfil/${amigo.id}`}
                        alt="Perfil"
                        onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
                      />
                      {amigo.nombre}
                    </button>
                  </Link>

                  {esPerfilPropio && (
                    <button
                      className="btn-eliminar-amigo"
                      onClick={() => eliminarAmigo(amigo.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!esPerfilPropio && !esAmigo && (
        <div className="botones-container">
          {solicitudEnviada ? (
            <p>Solicitud Enviada</p>
          ) : (
            <button
              onClick={enviarSolicitudAmistad}
              className="btn-enviar-solicitud"
            >
              Enviar Solicitud de Amistad
            </button>
          )}
        </div>
      )}
    </div>
  );
}
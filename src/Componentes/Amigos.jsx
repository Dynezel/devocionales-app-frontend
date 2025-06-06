import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import '../css/Amigos.css';

export default function Amigos({ usuarioId, usuarioActualId }) {
  const [amigos, setAmigos] = useState([]);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [esAmigo, setEsAmigo] = useState(false);
  const [mostrarAmigos, setMostrarAmigos] = useState(false);
  const amigosRef = useRef(null);
  const navigate = useNavigate();

  const obtenerAmigos = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/amistades/${usuarioId}/amigos`
      );
      setAmigos(response.data);

      // Verifica si el usuario actual está en la lista de amigos
      const amigoExistente = response.data.some(
        (amigo) => amigo.usuarioAmigo.idUsuario === usuarioActualId || amigo.usuarioSolicitante.idUsuario === usuarioActualId
      );
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
        `http://localhost:8080/amistades/${usuarioActualId}/enviar-solicitud/${usuarioId}`
      );
      setSolicitudEnviada(true);
      obtenerAmigos(); // Refresca la lista de amigos al enviar la solicitud
    } catch (error) {
      console.error("Error al enviar solicitud de amistad:", error);
    }
  };

  const handleClickOutside = (event) => {
    if (amigosRef.current && !amigosRef.current.contains(event.target)) {
      setMostrarAmigos(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
              {amigos.map((amigo) => {
                const amigoAMostrar =
                  amigo.usuarioAmigo.idUsuario === usuarioId
                    ? amigo.usuarioSolicitante
                    : amigo.usuarioAmigo;

                return (
                  <li key={amigoAMostrar.idUsuario}>
                    <Link to={`/usuario/perfil/${amigoAMostrar.idUsuario}`}>
                      <button className="boton-amigos">
                        {amigoAMostrar.fotoPerfil ? (
                          <img
                            src={`http://localhost:8080/imagen/perfil/${amigoAMostrar.idUsuario}`}
                            alt="Perfil"
                          />
                        ) : (
                          <div className="placeholder-imagen">P</div>
                        )}
                        {amigoAMostrar.nombre}
                      </button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      {usuarioId !== usuarioActualId && !esAmigo && (
        <div className="botones-container">
          {solicitudEnviada ? (
            <p>Solicitud Enviada</p>
          ) : (
            <button onClick={enviarSolicitudAmistad} className="btn-enviar-solicitud">
              Enviar Solicitud de Amistad
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Importa useNavigate para redirección
import "../css/Seguidores.css";
import { Link } from "react-router-dom";

export default function Seguidores({ usuarioId, usuarioActualId }) {
  const [seguidores, setSeguidores] = useState([]);
  const [seguidos, setSeguidos] = useState([]);
  const [esSeguido, setEsSeguido] = useState(false);
  const [mostrarSeguidores, setMostrarSeguidores] = useState(false);
  const [mostrarSeguidos, setMostrarSeguidos] = useState(false);

  const seguidoresRef = useRef(null);
  const seguidosRef = useRef(null);
  const navigate = useNavigate(); // Usa useNavigate para la redirección

  useEffect(() => {
    const verificarSeguidor = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/seguidores/${usuarioId}/seguidores`
        );
        if (Array.isArray(response.data) && response.data.length > 0) {
          setSeguidores(response.data);
          setEsSeguido(
            response.data.some(
              (seguidor) => seguidor.usuario.idUsuario === usuarioActualId
            )
          );
        } else {
          console.error(
            "La respuesta no es un array o está vacío:",
            response.data
          );
        }
      } catch (error) {
        console.error("Error al verificar el seguimiento:", error);
      }
    };
    verificarSeguidor();
  }, [usuarioId, usuarioActualId]);

  const seguirUsuario = async () => {
    if (!usuarioActualId) {
      alert("Debes iniciar sesión para seguir a un usuario.");
      navigate("/login"); // Redirige a la página de login si no está autenticado
      return;
    }

    try {
      await axios.post(
        `http://localhost:8080/seguidores/${usuarioActualId}/seguir/${usuarioId}`
      );
      setEsSeguido(true);
      actualizarSeguidores();
    } catch (error) {
      console.error("Error al seguir al usuario:", error);
    }
  };

  const dejarDeSeguirUsuario = async () => {
    if (!usuarioActualId) {
      navigate("/login"); // Redirige a la página de login si no está autenticado
      return;
    }

    try {
      await axios.delete(
        `http://localhost:8080/seguidores/${usuarioActualId}/dejar-de-seguir/${usuarioId}`
      );
      setEsSeguido(false);
      actualizarSeguidores();
    } catch (error) {
      console.error("Error al dejar de seguir al usuario:", error);
    }
  };

  const actualizarSeguidores = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/seguidores/${usuarioId}/seguidores`
      );
      if (Array.isArray(response.data)) {
        setSeguidores(response.data);
      } else {
        console.error(
          "La respuesta de seguidores no es un array:",
          response.data
        );
      }
    } catch (error) {
      console.error("Error al obtener los seguidores:", error);
    }
  };

  useEffect(() => {
    const obtenerSeguidos = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/seguidores/${usuarioId}/seguidos`
        );
        if (Array.isArray(response.data)) {
          setSeguidos(response.data);
        } else {
          console.error(
            "La respuesta de seguidos no es un array:",
            response.data
          );
        }
      } catch (error) {
        console.error("Error al obtener los seguidos:", error);
      }
    };

    obtenerSeguidos();
    actualizarSeguidores();
  }, [usuarioId]);

  const handleClickOutside = (event) => {
    if (
      seguidoresRef.current &&
      !seguidoresRef.current.contains(event.target)
    ) {
      setMostrarSeguidores(false);
    }
    if (seguidosRef.current && !seguidosRef.current.contains(event.target)) {
      setMostrarSeguidos(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="seguidores-seguidos-container">
      <div
        className="seguidores"
        onClick={() => setMostrarSeguidores(!mostrarSeguidores)}
      >
        <p>Seguidores</p>
        <p>{seguidores.length}</p>
        {mostrarSeguidores && (
          <div className="seguidores-lista" ref={seguidoresRef}>
            <h3>Seguidores</h3>
            <ul>
              {seguidores.map((seguidor) => (
                <li key={seguidor.id}>
                  
                    <Link to={`/usuario/perfil/${seguidor.usuario.idUsuario}`}>
                    <button className="boton-seguidores-seguir">
                      {seguidor.usuario.fotoPerfil ? (
                        <img
                          src={`http://localhost:8080/imagen/perfil/${seguidor.usuario.idUsuario}`}
                          alt="Perfil"
                        />
                      ) : (
                        <div className="placeholder-imagen">P</div>
                      )}
                      {seguidor.usuario.nombre}
                      </button>
                    </Link>
                  
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div
        className="seguidos"
        onClick={() => setMostrarSeguidos(!mostrarSeguidos)}
      >
        <p>Seguidos</p>
        <p>{seguidos.length}</p>
        {mostrarSeguidos && (
          <div className="seguidos-lista" ref={seguidosRef}>
            <h3>Seguidos</h3>
            <ul>
              {seguidos.map((seguido) => (
                <li key={seguido.id}>
                  
                    <Link to={`/usuario/perfil/${seguido.seguido.idUsuario}`}>
                    <button className="boton-seguidores-seguir">
                      {seguido.seguido.fotoPerfil ? (
                        <img
                          src={`http://localhost:8080/imagen/perfil/${seguido.seguido.idUsuario}`}
                          alt="Imagen de Perfil"
                        />
                      ) : (
                        <div className="placeholder-imagen">P</div>
                      )}
                      {seguido.seguido.nombre}
                      </button>
                    </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {usuarioId !== usuarioActualId && (
        <div className="botones-container">
          <button
            onClick={esSeguido ? dejarDeSeguirUsuario : seguirUsuario}
            className={esSeguido ? "btn-dejar-seguir" : "btn-seguir"}
          >
            {esSeguido ? "Dejar de Seguir" : "Seguir"}
          </button>
        </div>
      )}
    </div>
  );
}

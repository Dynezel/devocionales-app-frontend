import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../css/Comentarios.css";
import { useNavigate } from "react-router-dom";
import defaultImage from "../Images/default-image-profile.jpg";

export default function Comentarios({ devocionalId, usuarioId }) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [user, setUser] = useState(null);
  const [comentarioEditado, setComentarioEditado] = useState(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [menuActivo, setMenuActivo] = useState(null);
  const navigate = useNavigate();
  const menuRefs = useRef({});

  // Obtener usuario logueado
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("https://localhost:8080/usuario/perfil", {
          withCredentials: true,
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user", error);
      }
    };
    fetchUser();
  }, []);

  // Obtener comentarios (ya vienen como ComentarioSinDevocional con usuario)
  useEffect(() => {
    const fetchComentarios = async () => {
      try {
        const response = await axios.get(
          `https://localhost:8080/devocionales/${devocionalId}/comentarios`
        );
        setComentarios(response.data);
      } catch (error) {
        console.error("Error al cargar comentarios", error);
      }
    };
    fetchComentarios();
  }, [devocionalId]);

  const handleAgregarComentario = async () => {
    try {
      if (!user) {
        navigate("/usuario/registro");
        return;
      }

      const response = await axios.post(
        `https://localhost:8080/devocionales/${devocionalId}/comentarios`,
        { texto: nuevoComentario },
        { withCredentials: true }
      );

      setComentarios([...comentarios, response.data]); // ComentarioSinDevocional ya incluye usuario
      setNuevoComentario("");
    } catch (error) {
      console.error("Error al agregar comentario", error);
    }
  };

  const handleEliminarComentario = async (comentarioId) => {
    try {
      await axios.delete(`https://localhost:8080/comentarios/${comentarioId}`, {
        withCredentials: true,
      });
      setComentarios(comentarios.filter((c) => c.id !== comentarioId));
      setMenuActivo(null);
    } catch (error) {
      console.error("Error al eliminar comentario", error);
    }
  };

  const handleMenuClick = (comentarioId) => {
    setMenuActivo(menuActivo === comentarioId ? null : comentarioId);
  };

  const handleEditarComentario = (comentario) => {
    setComentarioEditado(comentario.id);
    setTextoEditado(comentario.texto);
  };

  const handleGuardarEdicion = async (comentarioId) => {
    try {
      await axios.put(
        `https://localhost:8080/comentarios/${comentarioId}`,
        { texto: textoEditado },
        { withCredentials: true }
      );

      setComentarios(
        comentarios.map((c) =>
          c.id === comentarioId ? { ...c, texto: textoEditado } : c
        )
      );

      setComentarioEditado(null);
      setTextoEditado("");
      setMenuActivo(null);
    } catch (error) {
      console.error("Error al editar comentario", error);
    }
  };

  // Cerrar menú si clickea afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const outsideClick = Object.values(menuRefs.current).every(
        (ref) => ref && !ref.contains(event.target)
      );
      if (outsideClick) setMenuActivo(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="comentarios-container">
      <h3 className="comentarios-header">Comentarios</h3>

      <div className="nuevo-comentario-container">
        <textarea
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          placeholder="Escribe tu comentario"
          className="nuevo-comentario"
        />
        <button
          onClick={handleAgregarComentario}
          className="agregar-comentario-boton"
          disabled={nuevoComentario.trim().length === 0}
        >
          Agregar Comentario
        </button>
      </div>

      {comentarios.length > 0 ? (
        <ul className="comentarios-lista">
          {comentarios.map((comentario) => (
            <li key={comentario.id} className="comentario-item">
              {comentario.usuario?.idUsuario && (
                <img
                  src={`https://localhost:8080/imagen/perfil/${comentario.usuario.idUsuario}`}
                  alt="Foto de perfil"
                  className="imagenComentario"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultImage;
                  }}
                />
              )}
              <div className="comentario-texto">
                <strong className="comentario-usuario">
                  {comentario.usuario.nombre}:
                </strong>{" "}
                {comentarioEditado === comentario.id ? (
                  <>
                    <textarea
                      value={textoEditado}
                      onChange={(e) => setTextoEditado(e.target.value)}
                      className="editar-comentario-textarea"
                    />
                    <button onClick={() => handleGuardarEdicion(comentario.id)}>
                      Guardar
                    </button>
                    <button onClick={() => setComentarioEditado(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  comentario.texto
                )}
              </div>
              {user &&
                (user.idUsuario === comentario.usuario?.idUsuario || user.rol === "ADMINISTRADOR") && (
                  <div
                    className="comentario-menu-container"
                    ref={(el) => (menuRefs.current[comentario.id] = el)}
                  >
                    <button
                      className="comentario-menu-button"
                      onClick={() => handleMenuClick(comentario.id)}
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {menuActivo === comentario.id && (
                      <div className="comentario-menu-dropdown">
                        {user.idUsuario === comentario.usuario?.idUsuario && (
                          <button
                            onClick={() => {
                              handleEditarComentario(comentario);
                              setMenuActivo(null);
                            }}
                          >
                            Editar
                          </button>
                        )}
                        <button
                          onClick={() => handleEliminarComentario(comentario.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay comentarios todavía</p>
      )}
    </div>
  );
}

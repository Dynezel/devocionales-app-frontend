import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../css/Comentarios.css"; // Importa los estilos CSS
import { useNavigate } from 'react-router-dom';
import defaultImage from '../Images/default-image-profile.jpg';

export default function Comentarios({ devocionalId, usuarioId }) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [user, setUser] = useState(null);
  const [comentarioEditado, setComentarioEditado] = useState(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [menuActivo, setMenuActivo] = useState(null);
  const navigate = useNavigate();
  const menuRefs = useRef({}); // Objeto para almacenar referencias de los menús desplegables

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          "https://devocionales-app-backend.onrender.com/usuario/perfil",
          { withCredentials: true }
        );
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchComentarios = async () => {
      try {
        const response = await axios.get(
          `https://devocionales-app-backend.onrender.com/devocionales/${devocionalId}/comentarios`,
          {
            params: { usuarioId },
          }
        );

        const comentariosConUsuario = await Promise.all(
          response.data.map(async (comentario) => {
            const usuarioResponse = await axios.get(
              `https://devocionales-app-backend.onrender.com/usuario/perfil/${comentario.idUsuario}`
            );
            comentario.usuario = usuarioResponse.data;
            return comentario;
          })
        );

        setComentarios(comentariosConUsuario);

        console.log(usuarioId);
      } catch (error) {
        console.error("Error al cargar comentarios", error);
      }
    };

    fetchComentarios();
  }, [devocionalId, usuarioId]);

  const handleAgregarComentario = async () => {
    try {
      // Asegúrate de que el usuario esté autenticado antes de agregar un comentario
      if (!user) {
        navigate("/usuario/registro");
        return;
      }
  
      const response = await axios.post(
        `https://devocionales-app-backend.onrender.com/devocionales/${devocionalId}/comentarios?usuarioId=${usuarioId}`,
        {
          texto: nuevoComentario,
        },
        {
          withCredentials: true,
        }
      );
  
      const nuevoComentarioConUsuario = {
        ...response.data,
        usuario: user,
      };
      setComentarios([...comentarios, nuevoComentarioConUsuario]);
      setNuevoComentario("");
    } catch (error) {
      console.error("Error al agregar comentario", error);
    }
  };

  const handleEliminarComentario = async (comentarioId) => {
    try {
      await axios.delete(`https://devocionales-app-backend.onrender.com/comentarios/${comentarioId}`, {
        withCredentials: true,
      });
      setComentarios(
        comentarios.filter((comentario) => comentario.id !== comentarioId)
      );
      setMenuActivo(null); // Cierra el menú al eliminar el comentario
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
        `https://devocionales-app-backend.onrender.com/comentarios/${comentarioId}`,
        {
          texto: textoEditado,
        },
        {
          withCredentials: true,
        }
      );
      setComentarios(
        comentarios.map((comentario) =>
          comentario.id === comentarioId
            ? { ...comentario, texto: textoEditado }
            : comentario
        )
      );
      setComentarioEditado(null);
      setTextoEditado("");
      setMenuActivo(null); // Cierra el menú al guardar la edición
    } catch (error) {
      console.error("Error al editar comentario", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Verifica si el clic se realizó fuera de todos los menús desplegables
      const outsideClick = Object.values(menuRefs.current).every(
        (ref) => ref && !ref.contains(event.target)
      );

      if (outsideClick) {
        setMenuActivo(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
          disabled={nuevoComentario.trim().length === 0} // Desactiva el botón si el texto está vacío
        >
          Agregar Comentario
        </button>
      </div>

      {comentarios.length > 0 ? (
        <ul className="comentarios-lista">
          {comentarios.map((comentario) => (
            <li key={comentario.id} className="comentario-item">
              {comentario.usuario.idUsuario && (
                <img
                    src={`https://devocionales-app-backend.onrender.com/imagen/perfil/${user.idUsuario}`}
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
                (user.idUsuario === comentario.idUsuario ||
                  user.rol === "ADMINISTRADOR") && (
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
                        {user.idUsuario === comentario.idUsuario && (
                          <button
                            onClick={() => {
                              handleEditarComentario(comentario);
                              setMenuActivo(null); // Cierra el menú al hacer clic en Editar
                            }}
                          >
                            Editar
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleEliminarComentario(comentario.id);
                          }}
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
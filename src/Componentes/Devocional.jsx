import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, Link, useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Comentarios from "./Comentarios";
import "@fortawesome/fontawesome-free/css/all.css";
import "../css/Devocional.css";

export default function Devocional() {
  const [devocional, setDevocional] = useState(null);
  const [autor, setAutor] = useState(null);
  const [comentariosVisibles, setComentariosVisibles] = useState({});
  const [meGustas, setMeGustas] = useState({});
  const [likesPorUsuario, setLikesPorUsuario] = useState({});
  const [user, setUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const { id } = useParams();
  const autorId = query.get("autorId");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/usuario/perfil",
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
    if (id) {
      const obtenerDevocional = async () => {
        try {
          const response = await axios.get(
            `http://localhost:8080/encontrar/${id}`
          );
          setDevocional(response.data);
        } catch (error) {
          console.error("Error al obtener el devocional:", error);
        }
      };

      obtenerDevocional();
    }
  }, [id]);

  useEffect(() => {
    if (autorId) {
      const obtenerAutor = async () => {
        try {
          const response = await axios.get(
            `http://localhost:8080/usuario/perfil/${autorId}`
          );
          setAutor(response.data);
        } catch (error) {
          console.error("Error al obtener el autor:", error);
        }
      };

      obtenerAutor();
    }
  }, [autorId]);

  useEffect(() => {
    const obtenerLikes = async () => {
      if (!devocional) {
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:8080/devocionales/${devocional.id}/megusta`
        );
        const likesData = response.data;
        const userLiked = user
          ? likesData.some((like) => like.usuarioId === user.idUsuario)
          : false;

        setMeGustas((prevState) => ({
          ...prevState,
          [devocional.id]: likesData.length,
        }));
        setLikesPorUsuario((prevState) => ({
          ...prevState,
          [devocional.id]: userLiked,
        }));
      } catch (error) {
        console.error("Error al obtener los 'Me Gusta':", error);
      }
    };

    obtenerLikes();
  }, [devocional, user]);

  const modules = {
    toolbar: false,
    clipboard: {
      matchVisual: false,
    },
  };

  const incrementarVistas = async (id) => {
    try {
      await axios.post(`http://localhost:8080/${id}/vistas`);
    } catch (error) {
      console.error("Error al incrementar vistas:", error);
    }
  };

  const toggleMeGusta = async (devocionalId) => {
    if (!user?.idUsuario || !autor?.idUsuario) {
      console.error("Usuario no autenticado o autor no disponible");
      return;
    }
  
    try {
      const response = await axios.post(
        `http://localhost:8080/devocionales/${devocionalId}/megusta`,
        null,
        {
          params: {
            usuarioId: user.idUsuario,
            usuarioReceptorId: autor.idUsuario // Agrega aquí el usuario receptor
          }
        }
      );
  
      const nuevoMeGusta = response.data;
      setMeGustas((prevState) => ({
        ...prevState,
        [devocionalId]: nuevoMeGusta
          ? prevState[devocionalId] + 1
          : prevState[devocionalId] - 1,
      }));
      setLikesPorUsuario((prevState) => ({
        ...prevState,
        [devocionalId]: !prevState[devocionalId],
      }));
    } catch (error) {
      console.error("Error al alternar 'Me Gusta':", error);
    }
  };

  const toggleComentarios = (devocionalId) => {
    setComentariosVisibles((prevState) => ({
      ...prevState,
      [devocionalId]: !prevState[devocionalId],
    }));
  };

  const handleEdit = () => {
    navigate(`/devocionales/modificar/${devocional.id}`);
  };

  const handleDelete = async () => {
    if (
      window.confirm("¿Estás seguro de que deseas eliminar este devocional?")
    ) {
      try {
        // Elimina todos los comentarios asociados al devocional antes de eliminar el devocional
        await axios.delete(
          `http://localhost:8080/devocionales/${devocional.id}/comentarios`,
          {
            withCredentials: true,
          }
        );

        await axios.delete(`http://localhost:8080/eliminar/${devocional.id}`, {
          withCredentials: true,
        });

        alert("Devocional eliminado con éxito");
        navigate("/");
      } catch (error) {
        console.error("Error al eliminar el devocional asad:", error);
      }
    }
  };

  const toggleMenu = () => {
    setMenuVisible((prevState) => !prevState);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const menu = document.querySelector(".menu-dropdown");
      const button = document.querySelector(".menu-button");
      if (
        menu &&
        !menu.contains(event.target) &&
        button &&
        !button.contains(event.target)
      ) {
        setMenuVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!devocional) return <p>Información del devocional no disponible.</p>;

  const { titulo, contenido, fechaCreacion } = devocional;

  // Convierte la fecha de creación
  const fecha = new Date(fechaCreacion);
  const fechaFormateada = fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaFormateada = fecha.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="devocional-container">
      <div className="devocional-header">
        <h2 className="titulo-devocional">
          <u>{titulo || "Titulo no disponible"}</u>
        </h2>

        {user &&
          (user.idUsuario ===  autorId ||
            user.rol === "ADMINISTRADOR") && (
            <div className="menu-container">
              <button className="menu-button" onClick={toggleMenu}>
                <i className="fas fa-ellipsis-v"></i>
              </button>
              {menuVisible && (
                <div className="menu-dropdown">
                  {/* El botón "Editar" solo lo verá el autor */}
                  {user.idUsuario === autor.idUsuario && (
                    <button onClick={handleEdit} className="edit-button">
                      Editar
                    </button>
                  )}

                  {/* Mostrar el botón de eliminar si el usuario es el autor o un administrador */}
                  <button onClick={handleDelete} className="delete-button">
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
      </div>
      <ReactQuill
        theme="snow"
        value={contenido || "Descripción no disponible"}
        readOnly={true}
        modules={modules}
      />
      <div className="likes-container">
        <span>Vistas: {devocional.vistas}</span>
        <button
          onClick={() => toggleMeGusta(devocional.id)}
          className={`like-button ${
            likesPorUsuario[devocional.id] ? "liked" : "not-liked"
          }`}
          disabled={!user}
        >
          <i
            className={`fa-heart ${
              likesPorUsuario[devocional.id] ? "fas" : "far"
            }`}
          ></i>
          <span> {meGustas[devocional.id] || 0} </span>
        </button>
      </div>
      <p className="devocional-fecha">
        Fecha de Creación: {fechaFormateada}, {horaFormateada}
      </p>
      <p className="devocional-autor">
        Autor:
        {autor && autor.idUsuario ? (
          <Link to={`/usuario/perfil/${autor.idUsuario}`}>
            {autor.nombre || autor.username || "Nombre no disponible"}
          </Link>
        ) : (
          "Información del autor no disponible"
        )}
      </p>
      <button
        onClick={() => toggleComentarios(devocional.id)}
        className="mostrar-comentarios-boton"
      >
        {comentariosVisibles[devocional.id]
          ? "Ocultar comentarios"
          : "Mostrar comentarios"}
      </button>
      {comentariosVisibles[devocional.id] && (
        <Comentarios
          devocionalId={devocional.id}
          usuarioId={autor?.idUsuario || null}
        />
      )}
    </div>
  );
}

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
  const [comentariosVisibles, setComentariosVisibles] = useState({});
  const [meGustas, setMeGustas] = useState({});
  const [likesPorUsuario, setLikesPorUsuario] = useState({});
  const [user, setUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const { id } = useParams();
  const navigate = useNavigate();

  // Obtener usuario autenticado
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          "https://localhost:8080/usuario/perfil",
          { withCredentials: true }
        );
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user", error);
      }
    };
    fetchUser();
  }, []);

  // Obtener devocional
  useEffect(() => {
    if (id) {
      const obtenerDevocional = async () => {
        try {
          const response = await axios.get(
            `https://localhost:8080/encontrar/${id}`
          );
          setDevocional(response.data);
        } catch (error) {
          console.error("Error al obtener el devocional:", error);
        }
      };
      obtenerDevocional();
    }
  }, [id]);

  // Obtener likes del devocional
  useEffect(() => {
    const obtenerLikes = async () => {
      if (!devocional) return;
  
      try {
        const response = await axios.get(
          `https://localhost:8080/devocionales/${devocional.id}/megusta`
        );
        const likesData = response.data;
  
        // Total de likes siempre
        setMeGustas((prev) => ({ ...prev, [devocional.id]: likesData.length }));
  
        // Solo si el usuario está logeado, verificar si ya dio like
        if (user) {
          const userLiked = likesData.some(
            (like) => like.usuario?.idUsuario === user.idUsuario
          );
          setLikesPorUsuario((prev) => ({ ...prev, [devocional.id]: userLiked }));
        }
      } catch (error) {
        console.error("Error al obtener los 'Me Gusta':", error);
      }
    };
  
    obtenerLikes();
  }, [devocional, user]);

  // Configuración de ReactQuill
  const modules = {
    toolbar: false,
    clipboard: { matchVisual: false },
  };

  // Alternar me gusta
  const toggleMeGusta = async (devocionalId) => {
    if (!user || !devocional.autor?.idUsuario) return;

    try {
      const response = await axios.post(
        `https://localhost:8080/devocionales/${devocionalId}`,
        { usuarioReceptorId: devocional.autor.idUsuario },
        { withCredentials: true }
      );

      const data = response.data; // MeGustaResponse
      setMeGustas((prev) => ({ ...prev, [devocionalId]: data.totalMeGustas }));
      setLikesPorUsuario((prev) => ({ ...prev, [devocionalId]: data.meGusta }));
    } catch (error) {
      console.error("Error al alternar 'Me Gusta':", error);
    }
  };

  // Toggle comentarios
  const toggleComentarios = (devocionalId) => {
    setComentariosVisibles((prev) => ({
      ...prev,
      [devocionalId]: !prev[devocionalId],
    }));
  };

  // Editar devocional
  const handleEdit = () => {
    navigate(`/devocionales/modificar/${devocional.id}`);
  };

  // Eliminar devocional
  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este devocional?")) {
      try {
        await axios.delete(
          `https://localhost:8080/devocionales/${devocional.id}/comentarios`,
          { withCredentials: true }
        );
        await axios.delete(`https://localhost:8080/eliminar/${devocional.id}`, {
          withCredentials: true,
        });
        alert("Devocional eliminado con éxito");
        navigate("/");
      } catch (error) {
        console.error("Error al eliminar el devocional:", error);
      }
    }
  };

  // Toggle menú de opciones
  const toggleMenu = () => setMenuVisible((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const menu = document.querySelector(".menu-dropdown");
      const button = document.querySelector(".menu-button");
      if (menu && !menu.contains(event.target) && button && !button.contains(event.target)) {
        setMenuVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!devocional) return <p>Información del devocional no disponible.</p>;

  // Formatear fecha y hora
  const fecha = new Date(devocional.fechaCreacion);
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
          <u>{devocional.titulo || "Titulo no disponible"}</u>
        </h2>

        {user && (user.idUsuario === devocional.autor.idUsuario || user.rol === "ADMINISTRADOR") && (
          <div className="menu-container">
            <button className="menu-button" onClick={toggleMenu}>
              <i className="fas fa-ellipsis-v"></i>
            </button>
            {menuVisible && (
              <div className="menu-dropdown">
                {user.idUsuario === devocional.autor.idUsuario && (
                  <button onClick={handleEdit} className="edit-button">Editar</button>
                )}
                <button onClick={handleDelete} className="delete-button">Eliminar</button>
              </div>
            )}
          </div>
        )}
      </div>

      <ReactQuill
        theme="snow"
        value={devocional.contenido || "Descripción no disponible"}
        readOnly={true}
        modules={modules}
      />

      <div className="likes-container">
        <span>Vistas: {devocional.vistas}</span>
        <button
          onClick={() => toggleMeGusta(devocional.id)}
          className={`like-button ${likesPorUsuario[devocional.id] ? "liked" : "not-liked"}`}
          disabled={!user}
        >
          <i className={`fa-heart ${likesPorUsuario[devocional.id] ? "fas" : "far"}`}></i>
          <span> {meGustas[devocional.id] || 0} </span>
        </button>
      </div>

      <p className="devocional-fecha">
        Fecha de Creación: {fechaFormateada}, {horaFormateada}
      </p>
      <p className="devocional-autor">
        Autor:
        {devocional.autor?.idUsuario ? (
          <Link to={`/usuario/perfil/${devocional.autor.idUsuario}`}>
            {devocional.autor.nombre || devocional.autor.username || "Nombre no disponible"}
          </Link>
        ) : (
          "Información del autor no disponible"
        )}
      </p>

      <button
        onClick={() => toggleComentarios(devocional.id)}
        className="mostrar-comentarios-boton"
      >
        {comentariosVisibles[devocional.id] ? "Ocultar comentarios" : "Mostrar comentarios"}
      </button>

      {comentariosVisibles[devocional.id] && (
        <Comentarios
          devocionalId={devocional.id}
          usuarioId={devocional.autor?.idUsuario || null}
        />
      )}
    </div>
  );
}

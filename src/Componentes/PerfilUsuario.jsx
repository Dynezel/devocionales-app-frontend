import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Comentarios from "./Comentarios";
import Amigos from "./Amigos";
import MensajeriaPopup from "./Mensajeria";
import ConfiguracionUsuario from "./ConfiguracionUsuario";
import bannerDefault from "../Images/banner-default.png";
import defaultImage from "../Images/default-image-profile.jpg";
import "../css/PerfilUsuario.css";

export default function PerfilUsuario() {
  const { idUsuario } = useParams();
  const navigate = useNavigate();

  const [usuarioActual, setUsuarioActual] = useState(null); // Usuario logueado
  const [usuarioPerfil, setUsuarioPerfil] = useState(null); // Usuario del perfil que se visita
  const [mostrarMensajeria, setMostrarMensajeria] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [imagenPerfil, setImagenPerfil] = useState(null);
  const [banner, setBanner] = useState(null);

  // Lógica de mensajería
  const handleEnviarMensaje = () => {
    if (!usuarioActual) {
      alert("Debes estar logeado para enviar un mensaje.");
      navigate("/login");
      return;
    }
    setMostrarMensajeria(true);
  };
  const cerrarMensajeria = () => setMostrarMensajeria(false);

  const modules = { toolbar: false };

  // Obtener usuario logueado
  useEffect(() => {
    const fetchUsuarioActual = async () => {
      try {
        const res = await axios.get("https://localhost:8080/usuario/perfil", {
          withCredentials: true,
        });
        setUsuarioActual(res.data);
      } catch (err) {
        console.error("Error al obtener usuario actual:", err);
      }
    };
    fetchUsuarioActual();
  }, []);

  // Obtener usuario del perfil visitado con devocionales
  useEffect(() => {
    const fetchUsuarioPerfil = async () => {
      if (!idUsuario) return;
      try {
        const res = await axios.get(
          `https://localhost:8080/usuario/perfil/${idUsuario}`
        );
        setUsuarioPerfil(res.data);
        // Configurar imágenes
        setImagenPerfil(
          res.data.fotoPerfil
            ? `https://localhost:8080/imagen/perfil/${res.data.idUsuario}`
            : defaultImage
        );
        setBanner(
          res.data.bannerPerfil
            ? `https://localhost:8080/imagen/banner/${res.data.idUsuario}`
            : bannerDefault
        );
      } catch (err) {
        console.error("Error al obtener perfil del usuario:", err);
      }
    };
    fetchUsuarioPerfil();
  }, [idUsuario]);

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "Fecha no disponible";
    const fecha = new Date(fechaISO);
    const fechaFormateada = fecha.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const horaFormateada = fecha.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${fechaFormateada} ${horaFormateada}`;
  };

  if (!usuarioPerfil) return <p>Cargando perfil...</p>;


  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <div className="banner-picture-container">
          <img
            className="banner-picture"
            src={banner || bannerDefault}
            alt="Banner de Usuario"
          />
        </div>
        <div className="perfil-info">
          <div className="perfil-main">
            <img
              className="profile-picture"
              src={imagenPerfil || defaultImage}
              alt="Imagen de Perfil"
            />
            <div className="perfil-details">
              <h2 className="perfil-nombre">{usuarioPerfil.nombre}</h2>
              <h4 className="perfil-username">@{usuarioPerfil.nombreUsuario}</h4>
              <div className="perfil-bio">
                <p className="bio">{usuarioPerfil.biografia}</p>
              </div>
              <Amigos
                usuarioId={usuarioPerfil.idUsuario}
                usuarioActualId={usuarioActual ? usuarioActual.idUsuario : null}
              />
            </div>

            {usuarioActual &&
              (usuarioActual.idUsuario === usuarioPerfil.idUsuario ||
                usuarioActual.rol === "ADMINISTRADOR") && (
                <button
                  className="editar-perfil-button"
                  onClick={() => setShowConfig(true)}
                >
                  Editar Perfil
                </button>
              )}

            {usuarioPerfil.idUsuario !== (usuarioActual && usuarioActual.idUsuario) && (
              <button className="btn-seguir" onClick={handleEnviarMensaje}>
                Enviar un mensaje
              </button>
            )}
            {mostrarMensajeria && (
              <MensajeriaPopup
                usuarioId={usuarioPerfil.idUsuario}
                usuarioActualId={usuarioActual.idUsuario}
                onClose={cerrarMensajeria}
              />
            )}
          </div>
        </div>
      </div>

      <div className="perfil-body">
        <div className="perfil-devocionales">
          <h3>
            <u>Devocionales Creados</u>
          </h3>
          {usuarioPerfil.devocionales && usuarioPerfil.devocionales.length > 0 ? (
            usuarioPerfil.devocionales.map((devocional, index) => (
              <div key={devocional.id}>
                {index !== 0 && <hr className="devocional-separador" />}
                <div className="devocional-item">
                  <div className="devocional-content">
                    <h2 className="devocional-titulo">
                      <u>{devocional.titulo || "Título no disponible"}</u>
                    </h2>
                    <ReactQuill
                      theme="snow"
                      value={devocional.contenido || "Descripción no disponible"}
                      readOnly
                      modules={modules}
                      className="devocional-descripcion"
                    />
                    <p className="devocional-fecha">
                      <strong>Fecha de Creación:</strong> {formatearFecha(devocional.fechaCreacion)}
                    </p>
                    <p className="devocional-autor">
                      <strong>Autor:</strong>{" "}
                      <Link to={`/usuario/perfil/${usuarioPerfil.idUsuario}`}>
                        {usuarioPerfil.nombre || "Nombre no disponible"}
                      </Link>
                    </p>
                    <Comentarios
                      devocionalId={devocional.id}
                      usuarioId={usuarioPerfil.idUsuario}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Este usuario no ha creado ningún devocional aún.</p>
          )}
        </div>
      </div>

      {showConfig && (
        <ConfiguracionUsuario
          user={usuarioPerfil}
          setShowConfig={setShowConfig}
          setUser={setUsuarioPerfil}
          setImagenPerfil={setImagenPerfil}
        />
      )}
    </div>
  );
}

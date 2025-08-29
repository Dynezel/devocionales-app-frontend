import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Comentarios from "./Comentarios";
import "../css/PerfilUsuario.css";
import bannerDefault from "../Images/banner-default.png";
import ConfiguracionUsuario from "./ConfiguracionUsuario";
import Amigos from "./Amigos";
import defaultImage from '../Images/default-image-profile.jpg';

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [imagenPerfil, setImagenPerfil] = useState(null);
  const [banner, setBanner] = useState(null);
  const [error, setError] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const navigate = useNavigate();

  const modules = {
    toolbar: false,
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userResponse = await axios.get(
          "https://localhost:8080/usuario/perfil",
          { withCredentials: true }
        );
        setUser(userResponse.data);

        if (userResponse.data.fotoPerfil) {
          cargarImagenPerfil(userResponse.data.idUsuario);
        }

        if (userResponse.data.bannerPerfil) {
          await cargarBanner(userResponse.data.idUsuario);
        }
      } catch (error) {
        console.error("Error fetching user", error);
        setError("Error al cargar el perfil.");
      }
    };

    fetchUser();
  }, []);

  const cargarImagenPerfil = async (idUsuario) => {
    try {
      const response = await axios.get(
        `https://localhost:8080/imagen/perfil/${idUsuario}`,
        { responseType: "arraybuffer", withCredentials: true }
      );
      const blob = new Blob([response.data], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setImagenPerfil(url);
    } catch (error) {
      console.error("Error al cargar la imagen de perfil:", error);
      setImagenPerfil(defaultImage)
    }
  };

  const cargarBanner = async (idUsuario) => {
    try {
      const bannerResponse = await axios.get(
        `https://localhost:8080/imagen/perfil/banner/${idUsuario}`,
        { responseType: "arraybuffer", withCredentials: true }
      );
      const bannerBlob = new Blob([bannerResponse.data], {
        type: "image/jpeg",
      });
      const bannerUrl = URL.createObjectURL(bannerBlob);
      setBanner(bannerUrl);
    } catch (error) {
      console.error("Error al cargar el banner:", error);
    }
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "Fecha no disponible";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("es-AR") + " " + fecha.toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="perfil-container">
      {user ? (
        <>
          <div className="perfil-header">
            <div className="banner-picture-container">
              <img
                className="banner-picture"
                src={banner ? banner : bannerDefault}
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
                  <h2 className="perfil-nombre">{user.nombre}</h2>
                  <h4 className="perfil-username">@{user.nombreUsuario}</h4>
                  <div className="seguidores-container">
                    <Amigos
                      usuarioId={user.idUsuario}
                      usuarioActualId={user.idUsuario}
                    />
                  </div>
                  <div className="perfil-bio">
                    <p className="bio">{user.biografia}</p>
                  </div>
                </div>
                <button
                  className="editar-perfil-button"
                  onClick={() => setShowConfig(true)}
                >
                  Editar Perfil
                </button>
              </div>
            </div>
          </div>

          {/* Sección de Devocionales */}
          <div className="perfil-devocionales">
            <h3>
              <u>Devocionales Creados</u>
            </h3>
            {user.devocionales && user.devocionales.length > 0 ? (
              user.devocionales.map((devocional, index) => (
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
                        readOnly={true}
                        modules={modules}
                        className="devocional-descripcion"
                      />
                      <p className="devocional-fecha">
                        <strong>Fecha de Creación:</strong>{" "}
                        {formatearFecha(devocional.fechaCreacion)}
                      </p>
                      <p className="devocional-autor">
                        <strong>Autor:</strong>{" "}
                        <Link to={`/usuario/perfil/${user.idUsuario}`}>
                          {user.nombre || "Nombre no disponible"}
                        </Link>
                      </p>
                      <Comentarios
                        devocionalId={devocional.id}
                        usuarioId={user.idUsuario}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>Este usuario no ha creado ningún devocional aún.</p>
            )}
          </div>

          {showConfig && (
            <ConfiguracionUsuario
              user={user}
              setShowConfig={setShowConfig}
              setUser={setUser}
              setImagenPerfil={setImagenPerfil}
              setBanner={setBanner}
            />
          )}
        </>
      ) : (
        <p>{error ? error : "Cargando perfil..."}</p>
      )}
    </div>
  );
}
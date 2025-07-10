import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Comentarios from "./Comentarios";
import Seguidores from "./Seguidores";
import "../css/PerfilUsuario.css";
import MensajeriaPopup from "./Mensajeria";
import bannerDefault from "../Images/banner-default.png";
import ConfiguracionUsuario from "./ConfiguracionUsuario"; // Importar el componente de configuración
import Amigos from "./Amigos";
import defaultImage from '../Images/default-image-profile.jpg';

export default function PerfilUsuario() {
  const { idUsuario } = useParams(); // Captura el idUsuario desde la URL
  const [user, setUser] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [imagenPerfil, setImagenPerfil] = useState(null);
  const [banner, setBanner] = useState(null);
  const [mostrarMensajeria, setMostrarMensajeria] = useState(false);
  const [error, setError] = useState(null);
  const [showConfig, setShowConfig] = useState(false); // Estado para mostrar el overlay

  const handleEnviarMensaje = () => {
    if (!usuario) {
      alert("Debes estar logeado para enviar un mensaje.");
      window.location.href = "/login";
      return;
    }
    setMostrarMensajeria(true);
  };

  const cerrarMensajeria = () => {
    setMostrarMensajeria(false);
  };

  const modules = {
    toolbar: false,
  };

  // Llama a los datos del usuario actual
  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const response = await axios.get(
          "https://devocionales-app-backend.onrender.com/usuario/perfil",
          { withCredentials: true }
        );
        setUsuario(response.data);
      } catch (error) {
        console.error("Error fetching user", error);
        setError("Error fetching user");
      }
    };

    fetchUsuario();
  }, []);

  // Carga al Perfil de un Usuario especifico
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `https://devocionales-app-backend.onrender.com/usuario/perfil/${idUsuario}`
        );
        setUser(response.data);

        if (response.data.fotoPerfil) {
          cargarImagenPerfil(response.data.idUsuario);
        }
      } catch (error) {
        console.error("Error fetching user", error);
        setError("Error fetching user profile");
      }
    };

    if (idUsuario) {
      fetchUser();
    }
  }, [idUsuario]);

  const cargarImagenPerfil = async (idUsuario) => {
    try {
      const response = await axios.get(
        `https://devocionales-app-backend.onrender.com/imagen/perfil/${idUsuario}`,
        {
          responseType: "arraybuffer",
        }
      );
      const blob = new Blob([response.data], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setImagenPerfil(url);
    } catch (error) {
      console.error("Error al cargar la imagen de perfil:", error);
      setImagenPerfil(defaultImage)
    }
  };

  return (
    <div className="perfil-container">
      {user && (
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
                  <div className="perfil-bio">
                    <p className="bio">{user.biografia}</p>
                  </div>
                  <Amigos
                    usuarioId={user.idUsuario}
                    usuarioActualId={usuario ? usuario.idUsuario : null}
                    onLoginRequired={() => history.push("/login")}
                  />
                </div>
                <div>
                  {usuario &&
                    usuario.rol &&
                    (user.idUsuario === usuario.idUsuario ||
                      usuario.rol === "ADMINISTRADOR") && (
                      <button
                        className="editar-perfil-button"
                        onClick={() => setShowConfig(true)} // Mostrar el overlay
                      >
                        Editar Perfil
                      </button>
                    )}

                  <div className="botones-container">
                    {user.idUsuario !== (usuario && usuario.idUsuario) && (
                      <button
                        className="btn-seguir"
                        onClick={handleEnviarMensaje}
                      >
                        Enviar un mensaje
                      </button>
                    )}
                    {mostrarMensajeria && (
                      <MensajeriaPopup
                        usuarioId={idUsuario}
                        usuarioActualId={usuario.idUsuario}
                        onClose={cerrarMensajeria}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="perfil-body">
              <div className="perfil-devocionales">
                <h3>
                  <u>Devocionales Creados</u>
                </h3>
                {user.devocionales.length > 0 ? (
                  user.devocionales.map((devocional, index) => (
                    <div>
                      {index !== 0 && <hr className="devocional-separador" />}
                      <div key={devocional.id} className="devocional-item">
                        <div className="devocional-content">
                          <h2 className="devocional-titulo">
                            <u>{devocional.nombre || "Título no disponible"}</u>
                          </h2>
                          <ReactQuill
                            theme="snow"
                            value={
                              devocional.descripcion ||
                              "Descripción no disponible"
                            }
                            readOnly={true}
                            modules={modules}
                            className="devocional-descripcion"
                          />
                          <p className="devocional-fecha">
                            <strong>Fecha de Creación:</strong>{" "}
                            {devocional.fechaCreacion || "Fecha no disponible"}
                          </p>
                          <p className="devocional-autor">
                            <strong>Autor:</strong>
                            {user.idUsuario ? (
                              <Link to={`/usuario/perfil/${user.idUsuario}`}>
                                {user.nombre || "Nombre no disponible"}
                              </Link>
                            ) : (
                              "Información del autor no disponible"
                            )}
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
            </div>
          </div>
        </>
      )}

      {showConfig && (
        <ConfiguracionUsuario
          user={user}
          setShowConfig={setShowConfig}
          setUser={setUser}
          setImagenPerfil={setImagenPerfil} // Actualizar la imagen localmente
        />
      )}
    </div>
  );
}

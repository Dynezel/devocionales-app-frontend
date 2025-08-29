import React, { useState } from "react";
import axios from "axios";
import "../css/ConfiguracionUsuario.css";
import bannerDefault from '../Images/banner-default.png'; // Imagen por defecto

const ConfiguracionUsuario = ({ user, setShowConfig, setUser, setImagenPerfil, setBanner }) => {
  const [nombre, setNombre] = useState(user.nombre);
  const [celular, setCelular] = useState(user.celular);
  const [biografia, setBiografia] = useState(user.biografia)
  const [imagenPerfil, setImagenPerfilState] = useState(null);
  const [banner, setBannerState] = useState(null);
  const [error, setError] = useState(null);

  const handleModificarPerfil = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("celular", celular);
    formData.append("biografia", biografia)
    if (imagenPerfil) {
      formData.append("imagenPerfil", imagenPerfil);
    }
    if (banner) {
      formData.append("banner", banner);
    }

    try {
      const response = await axios.post(
        `https://localhost:8080/usuario/perfil/modificar/${user.idUsuario}`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Perfil modificado correctamente");

      // Actualizar el estado de usuario con los cambios de nombre y celular
      setUser({ ...user, nombre, celular, biografia });

      // Actualizar las imágenes de perfil y banner
      if (imagenPerfil) {
        const imagenUrl = URL.createObjectURL(imagenPerfil);
        setImagenPerfil(imagenUrl);
      }

      if (banner) {
        const bannerUrl = URL.createObjectURL(banner);
        setBanner(bannerUrl);
      }

      setShowConfig(false);
    } catch (error) {
      console.error("Error modificando el perfil", error);
      setError("Error modificando el perfil");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (e.target.name === "imagenPerfil") {
        setImagenPerfilState(file);
      } else if (e.target.name === "banner") {
        setBannerState(file);
      }
    }
  };

  // Manejadores de clic para las imágenes
  const handleProfilePictureClick = () => {
    document.getElementById("profileInput").click(); // Simula el clic en el input de imagen de perfil
  };

  const handleBannerClick = () => {
    document.getElementById("bannerInput").click(); // Simula el clic en el input de banner
  };

  const handleEliminarPerfil = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar tu perfil?")) {
      try {
        await axios.delete(
          `https://localhost:8080/usuario/eliminar/${user.idUsuario}`,
          { withCredentials: true }
        );
        alert("Perfil eliminado correctamente");
        navigate("/"); // Redirigir al usuario después de eliminar
      } catch (error) {
        console.error("Error eliminando el perfil", error);
        alert("Error eliminando el perfil");
      }
    }
  };

  return (
    <div className="configuracion-overlay">
      <div className="configuracion-container">
        <h2>Editar Perfil</h2>
        <form onSubmit={handleModificarPerfil}>
          <label>
            Nombre:
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>
          <label>
            Numero de Telefono:
            <input
              type="text"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
            />
          </label>

          <label>
            Biografia:
            <textarea
              type="text"
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
            />
          </label>

          {/* Imagen de Perfil */}
          <div className="profile-picture-container-configuracion" onClick={handleProfilePictureClick}>
            <img
              className="profile-picture-configuracion"
              src={imagenPerfil ? URL.createObjectURL(imagenPerfil) : (user.fotoPerfil ? `https://localhost:8080/imagen/perfil/${user.idUsuario}` : "default-profile.png")} 
              alt="Imagen de Perfil"
            />
            <input
              type="file"
              id="profileInput"
              name="imagenPerfil"
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {/* Banner */}
          <div className="banner-picture-container-configuracion" onClick={handleBannerClick}>
            <img
              className="banner-pictur-configuracione"
              src={banner ? URL.createObjectURL(banner) : (user.bannerPerfil ? `https://localhost:8080/imagen/perfil/banner/${user.idUsuario}` : bannerDefault)} 
              alt="Banner de Usuario"
            />
            <input
              type="file"
              id="bannerInput"
              name="banner"
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          <button
          className="eliminar-perfil-button"
          onClick={handleEliminarPerfil}
        >
          Eliminar Perfil
        </button>

          <button type="submit">Guardar Cambios</button>
          <button
            type="button"
            onClick={() => setShowConfig(false)}
          >
            Cancelar
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default ConfiguracionUsuario;
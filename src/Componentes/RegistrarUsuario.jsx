import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import imageDefault from '../Images/default-image-profile.jpg'
import bannerDefault from "../Images/banner-default.png";

export default function RegistrarUsuario() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [contrasenia2, setContrasenia2] = useState("");
  const [celular, setCelular] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      // Validar campos obligatorios y contraseñas coincidentes
      if (!nombre || !email || !contrasenia) {
        setError("Por favor, completa todos los campos.");
        return;
      }

      if (contrasenia !== contrasenia2) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      const formData = new FormData();
      if (archivo) formData.append("archivo", archivo);
      if (banner) formData.append("banner", banner);
      formData.append("nombre", nombre);
      formData.append("email", email);
      formData.append("nombreUsuario", nombreUsuario);
      formData.append("celular", celular);
      formData.append("contrasenia", contrasenia);
      formData.append("contrasenia2", contrasenia2);

      // Enviar solicitud POST al backend para registrar el usuario
      try {
        const response = await axios.post(
          "https://devocionales-app-backend.onrender.com/usuario/registro",
          formData, // Usamos formData en lugar de un objeto plano

        );
        console.log("Se ha registrado con exito al usuario", response.data);
        if (response.status === 200) {
          // Redirigir a la página principal
          navigate('/login');
        }
      }
      catch (error) {
        console.error("Error al registrar usuario:", error);
        setError("Error al registrar usuario. Por favor, intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error al registrar usuario numero 2:", error);
      setError("Error al registrar usuario. Por favor, intenta nuevamente.");
    };
  }


  return (
    <form className="formularioRegistro" onSubmit={handleSignUp} encType="multipart/form-data">
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <label htmlFor="nombre">Nombre:</label>
        <input
          type="text"
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="email">Correo Electrónico:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="nombreUsuario">Nombre de Usuario (Ejemplo: <br />@NombreOriginal23):</label>
        <input
          type="nombreUsuario"
          id="nombreUsuario"
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="celular">Número de Teléfono:</label>
        <input
          type="tel"
          id="celular"
          value={celular}
          onChange={(e) => setCelular(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="contrasenia">Contraseña:</label>
        <input
          type="password"
          id="contrasenia"
          value={contrasenia}
          onChange={(e) => setContrasenia(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="contrasenia2">Confirmar Contraseña:</label>
        <input
          type="password"
          id="contrasenia2"
          value={contrasenia2}
          onChange={(e) => setContrasenia2(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="archivo">Imagen de Perfil:</label>
        <input
          type="file"
          id="archivo"
          onChange={(e) => setArchivo(e.target.files[0])} // Capturamos el archivo seleccionado
        />
      </div>
      <div className="form-group">
        <label htmlFor="banner">Banner de Perfil:</label>
        <input
          type="file"
          id="banner"
          onChange={(e) => setBanner(e.target.files[0])} // Campo opcional para el banner
        />
      </div>
      <button type="submit">Registrarse</button>
    </form>
  );
}
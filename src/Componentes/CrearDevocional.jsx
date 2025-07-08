import axios from "axios";
import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";

export default function CrearDevocional() {
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const URL = "https://localhost:8080/devocionales/registro";

    try {
      const response = await axios.post(
        URL,
        {
          titulo,
          contenido,
          fechaCreacion: new Date().toISOString(), // Enviar la fecha actual en formato ISO
        },
        { withCredentials: true } // Asegurarse de que las credenciales se envíen con la solicitud
      );

      console.log("Respuesta del servidor: ", response.data);
      navigate("/");
    } catch (error) {
      console.error("Se ha producido un error al crear el Devocional: ", error);
    }setTitulo
  };

  return (
    <form onSubmit={handleSubmit} className="devocional-container">
      <h3> <u> Crear Devocional </u> </h3>
      <div>
        <label htmlFor="nombreCreacion"> <u> <strong> Titulo: </strong></u></label>
        <input
          type="text"
          id="nombreCreacion"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          required
          className="titulo-crear"
        />
      </div>
      <div className="separador"> </div>
      <div className="reactQuill-crear-modificar">
        <label htmlFor="descripcion">Contenido:</label>
        <ReactQuill
          theme="snow"
          value={contenido}
          onChange={(value) => setContenido(value)}
          required
        />
      </div>
      
      <button type="submit">Enviar</button>
    </form>
  );
}

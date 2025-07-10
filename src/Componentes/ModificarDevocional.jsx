import axios from "axios";
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useNavigate } from "react-router";
import ReactQuill from "react-quill";


export default function ModificarDevocional() {
  const { id } = useParams();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const navigate = useNavigate(); // Obtener el objeto de historial

  useEffect(() => {
    const obtenerDevocional = async () => {
      try {
        const response = await axios.get(`https://devocionales-app-backend.onrender.com/encontrar/${id}`);
        const { nombre, descripcion } = response.data;
        setNombre(nombre);
        setDescripcion(descripcion);
      } catch (error) {
        console.error("Error al obtener el devocional:", error);
      }
    };
  
    obtenerDevocional();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const URL = `https://devocionales-app-backend.onrender.com/modificar/${id}`;

    try {
      const response = await axios.put(URL, {
        nombre,
        descripcion,
      });
      console.log("Respuesta del servidor: ", response.data);
      // Redirigir a la ruta "/"
      navigate("/");
    } catch (error) {
      console.log("Se ha producido un error al cargar el Devocional: ", error);
    }
  };

 return (
    <form onSubmit={handleSubmit} className="devocional-container">

      <h3> <u> Modificar Devocional </u> </h3>
      <div>
        <label htmlFor="nombreCreacion"> <u> <strong> Titulo Nuevo: </strong></u></label>
        <input
          type="text"
          id="nombreCreacion"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          required
          className="titulo-crear"
        />
      </div>
      <div className="separador"> </div>
      <div className="reactQuill-crear-modificar">
        <label htmlFor="descripcion">Contenido Nuevo:</label>
        <ReactQuill
          theme="snow"
          value={descripcion}
          onChange={(value) => setDescripcion(value)}
          required
        />
      </div>
      
      <button type="submit">Enviar</button>
    </form>
  );
}

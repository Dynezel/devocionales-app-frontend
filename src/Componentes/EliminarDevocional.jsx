import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function CrearTarea() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleEliminar = async (e) => {
    e.preventDefault();;

    const URL = `https://devocionales-app-backend.onrender.com/devocionales/eliminar/${id}`;

    try {
      const response = await axios.delete(URL)
      console.log("Respuesta del servidor: ", response.data);
      navigate("/")
    } catch (error) {
      console.log("Se ha producido un error al cargar el Devocional: ", error);
    }
  };

  return (
    <div>
      <h2>¿Estás seguro que deseas eliminar esta tarea?</h2>
      <button onClick={handleEliminar}>Eliminar</button>
    </div>
  );
}
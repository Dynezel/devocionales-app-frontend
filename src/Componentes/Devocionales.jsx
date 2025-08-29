import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Comentarios from "./Comentarios";
import "@fortawesome/fontawesome-free/css/all.css";
import BibliaAPI from "./BibliaAPI";

export default function Devocionales() {
  const [devocionales, setDevocionales] = useState([]);
  const [devocionalExpandido, setDevocionalExpandido] = useState(null);
  const [filtroTitulo, setFiltroTitulo] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const navigate = useNavigate();

  const modules = {
    toolbar: false,
    clipboard: {
      matchVisual: false,
    },
  };

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const response = await axios.get(
          "https://localhost:8080/devocionales/listar",
          { withCredentials: true }
        );
        setDevocionales(response.data);
      } catch (error) {
        console.error("Error al obtener devocionales:", error);
      }
    };

    obtenerDatos();
  }, []);

  useEffect(() => {
    const handleBusquedaTitulo = async () => {
      try {
        if (filtroTitulo.trim() === "") {
          setResultadosBusqueda(devocionales);
        } else {
          const response = await axios.get(
            "https://localhost:8080/devocionales/buscar",
            { params: { titulo: filtroTitulo } }
          );
          setResultadosBusqueda(response.data);
        }
      } catch (error) {
        console.error("Error al buscar devocionales:", error);
      }
    };

    handleBusquedaTitulo();
  }, [devocionales, filtroTitulo]);

  // Si hay un filtro de búsqueda, se filtran los resultados, sino, se muestran los devocionales
  const devocionalesAMostrar = filtroTitulo.trim()
    ? resultadosBusqueda
    : devocionales;

  const handleDevocionalClick = (id) => {
    navigate(`/devocional/${id}`);
    incrementarVistas(id);
    setDevocionalExpandido(id);
  };

  const incrementarVistas = async (id) => {
    try {
      await axios.post(
        `https://localhost:8080/${id}/vistas`
      );
    } catch (error) {
      console.error("Error al incrementar vistas:", error);
    }
  };

  const renderDevocionalContent = (devocional) => {
    if (!devocional) return <p>Información del devocional no disponible.</p>;
    console.log("Devocional moment: " , devocional);

    return (
      <div className="devocional-container">
        <h2>
          <u>{devocional.titulo || "Título no disponible"}</u>
        </h2>
        <ReactQuill
          theme="snow"
          value={devocional.contenido || "Descripción no disponible"}
          readOnly={true}
          modules={modules}
        />
        <p className="devocional-fecha">
          Fecha de Creación:{" "}
          {devocional.fechaCreacion
            ? new Date(devocional.fechaCreacion).toLocaleString()
            : "Fecha no disponible"}
        </p>
        <p className="devocional-autor">
          Autor:{" "}
          {devocional.autor && devocional.autor.idUsuario ? (
            <Link to={`/usuario/perfil/${devocional.autor.idUsuario}`}>
              {devocional.autor.nombre ||
                devocional.autor.username ||
                "Nombre no disponible"}
            </Link>
          ) : (
            "Información del autor no disponible"
          )}
        </p>
      </div>
    );
  };

  return (
    <div className="devocionales-container">
      <div className="devocionales">
        <input
          type="text"
          placeholder="Buscar por título"
          value={filtroTitulo}
          onChange={(e) => setFiltroTitulo(e.target.value)}
          className="busqueda-input"
        />
        {devocionalesAMostrar.map((devocional) => (
          <div key={devocional.id || devocional.id} className="devocional">
            <h3
              className="titulo"
              onClick={() =>
                handleDevocionalClick(
                  devocional.id
                )
              }
              style={{ cursor: "pointer" }}
            >
              {devocional.titulo || "Título no disponible"}
            </h3>
            {devocionalExpandido === (devocional.id || devocional.id) &&
              renderDevocionalContent(devocional)}
          </div>
        ))}
      </div>
      <div className="versiculos-container">
        <BibliaAPI />
      </div>
    </div>
  );
}
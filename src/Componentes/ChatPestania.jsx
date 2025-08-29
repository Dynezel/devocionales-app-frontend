import React, { useEffect, useState } from "react";
import axios from "axios";
import '../css/ChatPestania.css';  // Asegúrate de agregar los estilos aquí

export default function ChatPestania({ usuarioActualId, usuarioDestinoId, nombreDestino, cerrarPestania }) {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");

  useEffect(() => {
    const obtenerMensajes = async () => {
      try {
        const response = await axios.get(`https://devocionales-app-backend.onrender.com/mensajes/conversacion/${usuarioActualId}/${usuarioDestinoId}`);
        setMensajes(response.data);
      } catch (error) {
        console.error("Error al obtener los mensajes:", error);
      }
    };

    obtenerMensajes();
  }, [usuarioActualId, usuarioDestinoId]);

  const enviarMensaje = async () => {
    if (nuevoMensaje.trim()) {
      try {
        const response = await axios.post("https://devocionales-app-backend.onrender.com/mensajes/enviar", {
          emisorId: usuarioActualId,
          receptorId: usuarioDestinoId,
          contenido: nuevoMensaje,
        });

        setMensajes([...mensajes, response.data]);
        setNuevoMensaje("");
      } catch (error) {
        console.error("Error al enviar el mensaje:", error);
      }
    }
  };

  return (
    <div className="chat-pestania">
      <div className="chat-header">
        <span>Mensajes con {nombreDestino}</span>
        <button onClick={cerrarPestania}>Cerrar</button>
      </div>
      <div className="chat-mensajes">
        {mensajes.map((mensaje) => (
          <div key={mensaje.id} className={`mensaje ${mensaje.emisor.id === usuarioActualId ? "propio" : "ajeno"}`}>
            <span>{mensaje.contenido}</span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input 
          type="text"
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          placeholder="Escribe tu mensaje..."
        />
        <button onClick={enviarMensaje}>Enviar</button>
      </div>
    </div>
  );
}

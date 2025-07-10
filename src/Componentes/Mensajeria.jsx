import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import defaultImage from '../Images/default-image-profile.jpg';

import "../css/Mensajeria.css";

// Función para formatear la fecha de envío
const formatFechaEnvio = (fechaEnvio) => {
  const fecha = new Date(fechaEnvio);
  const opcionesFecha = { day: '2-digit', month: 'long' };
  const opcionesHora = { hour: '2-digit', minute: '2-digit' };

  return {
    fecha: fecha.toLocaleDateString('es-ES', opcionesFecha),
    hora: fecha.toLocaleTimeString('es-ES', opcionesHora),
  };
};

export default function Mensajeria({ usuarioId, usuarioActualId, onClose }) {
  const [conversacion, setConversacion] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [minimizado, setMinimizado] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [imagenPerfilUsuario, setImagenPerfilUsuario] = useState(null);
  const [imagenPerfilOtroUsuario, setImagenPerfilOtroUsuario] = useState(null);
  const popupRef = useRef(null);
  const mensajesEndRef = useRef(null); // Nueva referencia para el último mensaje
  const [dragging, setDragging] = useState(false); // Estado para controlar el arrastre
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // Estado para almacenar el desplazamiento inicial
  const stompClientRef = useRef(null);

  useEffect(() => {
    const socket = new SockJS(`https://devocionales-app-backend.onrender.com/ws-notifications?userId=${usuarioActualId}`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("WebSocket conectado");

        stompClient.subscribe(`/user/queue/messages`, (message) => {
          const nuevo = JSON.parse(message.body);
          // Solo mostrar si el mensaje es para esta conversación
          if (
            (nuevo.emisor.idUsuario === usuarioId &&
              nuevo.receptor.idUsuario === usuarioActualId) ||
            (nuevo.emisor.idUsuario === usuarioActualId &&
              nuevo.receptor.idUsuario === usuarioId)
          ) {
            setConversacion((prev) => [...prev, nuevo]);
          }
        });
      },
      onStompError: (frame) => {
        console.error("Error en STOMP:", frame);
      },
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
    };
  }, [usuarioId, usuarioActualId]);

  useEffect(() => {
    const obtenerConversacion = async () => {
      try {
        const response = await axios.get("https://devocionales-app-backend.onrender.com/mensajes/conversacion", {
          params: {
            emisorId: usuarioActualId,
            receptorId: usuarioId,
          },
          headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        }
        });
  setConversacion(response.data);
} catch (error) {
  console.error("Error al obtener la conversación:", error);
}
    };

const obtenerNombreUsuario = async () => {
  try {
    const response = await axios.get(
      `https://devocionales-app-backend.onrender.com/usuario/perfil/${usuarioId}`
    );
    setNombreUsuario(response.data.nombre);
  } catch (error) {
    console.error("Error al obtener el nombre del usuario:", error);
  }
};

const cargarImagenPerfil = async (idUsuario, setImagenPerfil) => {
  try {
    const response = await axios.get(
      `https://devocionales-app-backend.onrender.com/imagen/perfil/${idUsuario}`,
      { responseType: "arraybuffer" }
    );
    const blob = new Blob([response.data], { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);
    setImagenPerfil(url);
  } catch (error) {
    console.error("Error al cargar la imagen de perfil:", error);
  }
};

obtenerConversacion();
obtenerNombreUsuario();
cargarImagenPerfil(usuarioActualId, setImagenPerfilUsuario);
cargarImagenPerfil(usuarioId, setImagenPerfilOtroUsuario);
  }, [usuarioId, usuarioActualId]);

useEffect(() => {
  if (mensajesEndRef.current) {
    mensajesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [conversacion, minimizado]); // Ejecuta el scroll cuando cambia la conversación o se maximiza la ventana

const enviarMensaje = () => {
  if (nuevoMensaje.trim() === "") return;
  const mensaje = {
    emisorId: usuarioActualId,
    receptorId: usuarioId,
    contenido: nuevoMensaje,
  };
  if (stompClientRef.current && stompClientRef.current.connected) {
    stompClientRef.current.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(mensaje),
    });
    setNuevoMensaje("");
  } else {
    console.error("STOMP no está conectado");
  }
};

const toggleMinimizado = () => {
  setMinimizado(!minimizado);
  if (minimizado && mensajesEndRef.current) {
    setTimeout(() => {
      mensajesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }
};

const handleMouseDown = (e) => {
  if (e.target.closest(".popup-header")) {
    setDragging(true);
    const rect = popupRef.current.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }
};

const handleMouseMove = (e) => {
  if (dragging) {
    const x = e.clientX - offset.x;
    const y = e.clientY - offset.y;
    popupRef.current.style.left = `${x}px`;
    popupRef.current.style.top = `${y}px`;
  }
};

const handleMouseUp = () => {
  setDragging(false);
};

useEffect(() => {
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };
}, [dragging, offset]);

useEffect(() => {
  // Inicializar la posición del popup en la esquina inferior derecha de la ventana
  const ajustarPosicionInicial = () => {
    if (popupRef.current) {
      const { innerWidth, innerHeight } = window;
      const { clientWidth, clientHeight } = popupRef.current;
      popupRef.current.style.left = `${innerWidth - clientWidth - 17}px`;
      popupRef.current.style.top = `${innerHeight - clientHeight - 60}px`;
    }
  };
  ajustarPosicionInicial();
  window.addEventListener("resize", ajustarPosicionInicial);
  return () => window.removeEventListener("resize", ajustarPosicionInicial);
}, []);

return (
  <div
    className={`mensajeria-popup ${minimizado ? "minimizado" : ""}`}
    ref={popupRef}
    style={{ position: 'fixed', left: '20px', top: '20px' }} // Establece una posición inicial
  >
    <div className="popup-header" onMouseDown={handleMouseDown}>
      <span>{nombreUsuario || "Seleccione una conversación"}</span>
      <div className="popup-buttons">
        <button onClick={toggleMinimizado}>
          {minimizado ? "▢" : "—"}
        </button>
        <button onClick={onClose}>✕</button>
      </div>
    </div>
    {!minimizado && (
      <div className="popup-body">
        <div className="mensajes">
          {conversacion.map((mensaje, index) => {
            const fechaFormateada = formatFechaEnvio(mensaje.fechaEnvio);
            const mostrarFecha =
              index === 0 ||
              formatFechaEnvio(conversacion[index - 1].fechaEnvio).fecha !==
              fechaFormateada.fecha;

            return (
              <React.Fragment key={mensaje.id}>
                {mostrarFecha && (
                  <div className="mensaje-fecha-separador">
                    {fechaFormateada.fecha}
                  </div>
                )}
                <div
                  className={`mensaje ${mensaje.emisor.idUsuario == usuarioActualId
                      ? "enviado"
                      : "recibido"
                    }`}
                >
                  {mensaje.emisor.idUsuario == usuarioActualId ? (
                    <div className="mensaje-contenido enviado">
                      <div className="mensaje-texto">
                        {mensaje.contenido}
                      </div>
                      <img
                        src={imagenPerfilUsuario || defaultImage}
                        alt="Tu Imagen de Perfil"
                        className="profile-picture profile-picture-usuario"
                      />
                    </div>
                  ) : (
                    <div className="mensaje-contenido recibido">
                      <img
                        src={imagenPerfilOtroUsuario}
                        alt="Imagen de Perfil del Otro Usuario"
                        className="profile-picture profile-picture-otro"
                      />
                      <div className="mensaje-texto">
                        {mensaje.contenido}
                      </div>
                    </div>
                  )}
                  <div className="mensaje-fecha">
                    {fechaFormateada.hora}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={mensajesEndRef} /> {/* Referencia al final de la conversación */}
        </div>
        <input
          type="text"
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button onClick={enviarMensaje}>Enviar</button>
      </div>
    )}
  </div>
);
}

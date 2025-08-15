import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import useProfileImage from "../hooks/useProfileImage";
import { Virtuoso } from "react-virtuoso";
import "../css/Mensajeria.css";

const PAGE_SIZE = 20;
const FLUSH_INTERVAL_MS = 100;

const formatFechaEnvio = (fechaEnvio) => {
  const fecha = new Date(fechaEnvio);
  const opcionesFecha = { day: "2-digit", month: "long" };
  const opcionesHora = { hour: "2-digit", minute: "2-digit" };
  return {
    fecha: fecha.toLocaleDateString("es-ES", opcionesFecha),
    hora: fecha.toLocaleTimeString("es-ES", opcionesHora),
  };
};

const MensajeItem = React.memo(function MensajeItem({
  mensaje,
  esActual,
  imagenUsuario,
  imagenOtro,
  mostrarFecha,
  fechaTexto,
  horaTexto,
}) {
  return (
    <>
      {mostrarFecha && <div className="mensaje-fecha-separador">{fechaTexto}</div>}
      <div className={`mensaje ${esActual ? "enviado" : "recibido"}`}>
        {esActual ? (
          <div className="mensaje-contenido enviado">
            <div className="mensaje-texto">{mensaje.contenido}</div>
            <img
              src={imagenUsuario}
              alt="Tu Imagen de Perfil"
              className="profile-picture profile-picture-usuario"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="mensaje-contenido recibido">
            <img
              src={imagenOtro}
              alt="Imagen de Perfil del Otro Usuario"
              className="profile-picture profile-picture-otro"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div className="mensaje-texto">{mensaje.contenido}</div>
          </div>
        )}
        <div className="mensaje-fecha">{horaTexto}</div>
      </div>
    </>
  );
});

export default function Mensajeria({ usuarioId, usuarioActualId, onClose }) {
  const [conversacion, setConversacion] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [minimizado, setMinimizado] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const imagenPerfilUsuario = useProfileImage(usuarioActualId);
  const imagenPerfilOtroUsuario = useProfileImage(usuarioId);

  const popupRef = useRef(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const stompClientRef = useRef(null);
  const messageBufferRef = useRef([]);
  const virtuosoRef = useRef(null);

  // ===== Obtener nombre usuario =====
  useEffect(() => {
    let cancel = false;
    const fetchNombre = async () => {
      try {
        const resp = await axios.get(
          `https://devocionales-app-backend.onrender.com/usuario/perfil/${usuarioId}`
        );
        if (!cancel) setNombreUsuario(resp.data.nombre || "");
      } catch (e) {
        if (!cancel) setNombreUsuario("");
      }
    };
    if (usuarioId) fetchNombre();
    return () => { cancel = true; };
  }, [usuarioId]);

  // ===== Carga inicial de conversación =====
  const fetchPage = useCallback(
    async (pagina) => {
      const resp = await axios.get(
        "https://devocionales-app-backend.onrender.com/mensajes/conversacion",
        {
          params: {
            emisorId: usuarioActualId,
            receptorId: usuarioId,
            page: pagina,
            size: PAGE_SIZE,
          },
        }
      );
      return resp.data || [];
    },
    [usuarioActualId, usuarioId]
  );

  const loadInitial = useCallback(async () => {
    const data = await fetchPage(0);
    setConversacion(data);
    setPage(1);
    setHasMore(data.length === PAGE_SIZE);
  }, [fetchPage]);

  useEffect(() => {
    if (usuarioId && usuarioActualId) {
      setConversacion([]);
      setPage(0);
      setHasMore(true);
      loadInitial();
    }
  }, [usuarioId, usuarioActualId, loadInitial]);

  // ===== Cargar mensajes antiguos =====
  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const data = await fetchPage(page);
      if (data.length > 0) {
        setConversacion((prev) => [...data, ...prev]);
        setPage((p) => p + 1);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Error al cargar mensajes antiguos:", e);
    } finally {
      setLoadingOlder(false);
    }
  }, [fetchPage, hasMore, loadingOlder, page]);

  // ===== WebSocket + buffer =====
  useEffect(() => {
    const socket = new SockJS(
      `https://devocionales-app-backend.onrender.com/ws-notifications?userId=${usuarioActualId}`
    );
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe(`/user/queue/messages`, (message) => {
          const body = message.isBinaryBody && message._binaryBody
            ? new TextDecoder().decode(message._binaryBody)
            : message.body;
          const nuevo = JSON.parse(body);

          const receptorId = Number(usuarioId);
          const emisorId = Number(usuarioActualId);
          const pertenece =
            (nuevo.emisor.idUsuario === receptorId &&
              nuevo.receptor.idUsuario === emisorId) ||
            (nuevo.emisor.idUsuario === emisorId &&
              nuevo.receptor.idUsuario === receptorId);

          if (pertenece) messageBufferRef.current.push(nuevo);
        });
      },
      onStompError: (frame) => console.error("Error STOMP:", frame),
    });

    stompClient.activate();
    stompClientRef.current = stompClient;
    return () => stompClient.deactivate();
  }, [usuarioId, usuarioActualId]);

  // ===== Vaciar buffer =====
  useEffect(() => {
    const interval = setInterval(() => {
      if (messageBufferRef.current.length > 0) {
        const batch = messageBufferRef.current;
        messageBufferRef.current = [];
        setConversacion((prev) => [...prev, ...batch]);
      }
    }, FLUSH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // ===== Enviar mensaje =====
  const enviarMensaje = () => {
    if (!nuevoMensaje.trim()) return;

    const tempMensaje = {
      emisor: { idUsuario: usuarioActualId },
      receptor: { idUsuario: usuarioId },
      contenido: nuevoMensaje,
      fechaEnvio: new Date().toISOString(),
      id: Date.now(),
    };

    setConversacion((prev) => [...prev, tempMensaje]);
    setNuevoMensaje("");

    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({
          emisorId: usuarioActualId,
          receptorId: usuarioId,
          contenido: tempMensaje.contenido,
        }),
      });
    }
  };

  // ===== Minimizar y drag =====
  const toggleMinimizado = () => setMinimizado((m) => !m);

  const handleMouseDown = (e) => {
    if (e.target.closest(".popup-header")) {
      draggingRef.current = true;
      const rect = popupRef.current.getBoundingClientRect();
      offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  };
  const handleMouseMove = (e) => {
    if (draggingRef.current && popupRef.current) {
      popupRef.current.style.left = `${e.clientX - offsetRef.current.x}px`;
      popupRef.current.style.top = `${e.clientY - offsetRef.current.y}px`;
    }
  };
  const handleMouseUp = () => { draggingRef.current = false; };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Posición inicial
  useEffect(() => {
    const ajustarPosicion = () => {
      if (popupRef.current) {
        const { innerWidth, innerHeight } = window;
        const { clientWidth, clientHeight } = popupRef.current;
        popupRef.current.style.left = `${innerWidth - clientWidth - 17}px`;
        popupRef.current.style.top = `${innerHeight - clientHeight - 60}px`;
      }
    };
    ajustarPosicion();
    window.addEventListener("resize", ajustarPosicion);
    return () => window.removeEventListener("resize", ajustarPosicion);
  }, []);

  return (
    <div
      className={`mensajeria-popup ${minimizado ? "minimizado" : ""}`}
      ref={popupRef}
    >
      <div className="popup-header" onMouseDown={handleMouseDown}>
        <span>{nombreUsuario || "Seleccione una conversación"}</span>
        <div className="popup-buttons">
          <button onClick={toggleMinimizado}>{minimizado ? "▢" : "—"}</button>
          <button onClick={onClose}>✕</button>
        </div>
      </div>

      {!minimizado && (
        <div className="popup-body">
          <div className="mensajes-container" style={{ position: "relative", height: "400px" }}>
            {loadingOlder && (
              <div
                className="mensaje-fecha-separador"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                }}
              >
                Cargando mensajes antiguos...
              </div>
            )}

            <Virtuoso
              ref={virtuosoRef}
              className="mensajes"
              style={{ height: "100%", paddingTop: loadingOlder ? "25px" : "0" }}
              data={conversacion}
              followOutput="auto"
              atTopStateChange={async (atTop) => {
                if (atTop && hasMore && !loadingOlder) {
                  await loadOlder();
                  if (virtuosoRef.current) {
                    virtuosoRef.current.scrollToIndex({
                      index: PAGE_SIZE,
                      align: "start",
                      behavior: "auto",
                    });
                  }
                }
              }}
              itemContent={(index, mensaje) => {
                const fechaForm = formatFechaEnvio(mensaje.fechaEnvio);
                const mostrarFecha =
                  index === 0 ||
                  formatFechaEnvio(conversacion[index - 1]?.fechaEnvio).fecha !==
                  fechaForm.fecha;
                const esActual = Number(mensaje.emisor.idUsuario) === Number(usuarioActualId);

                return (
                  <MensajeItem
                    key={mensaje.id}
                    mensaje={mensaje}
                    esActual={esActual}
                    imagenUsuario={imagenPerfilUsuario}
                    imagenOtro={imagenPerfilOtroUsuario}
                    mostrarFecha={mostrarFecha}
                    fechaTexto={fechaForm.fecha}
                    horaTexto={fechaForm.hora}
                  />
                );
              }}
            />
          </div>

          <div className="input-row">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe un mensaje..."
              onKeyDown={(e) => { if (e.key === "Enter") enviarMensaje(); }}
            />
            <button onClick={enviarMensaje}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}
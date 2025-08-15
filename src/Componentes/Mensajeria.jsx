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
      {mostrarFecha && (
        <div className="mensaje-fecha-separador">{fechaTexto}</div>
      )}
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
  const [initialLoaded, setInitialLoaded] = useState(false);

  const imagenPerfilUsuario = useProfileImage(usuarioActualId);
  const imagenPerfilOtroUsuario = useProfileImage(usuarioId);

  const stompClientRef = useRef(null);
  const messageBufferRef = useRef([]);
  const virtuosoRef = useRef(null);

  // ===== Obtener nombre usuario =====
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const resp = await axios.get(
          `https://devocionales-app-backend.onrender.com/usuario/perfil/${usuarioId}`
        );
        if (!cancel) setNombreUsuario(resp.data.nombre || "");
      } catch {
        if (!cancel) setNombreUsuario("");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [usuarioId]);

  // ===== Fetch mensajes =====
  const fetchMensajes = useCallback(async (pagina) => {
    if (!hasMore && pagina !== 0) return;

    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `https://devocionales-app-backend.onrender.com/mensajes/conversacion`,
        {
          params: { emisorId, receptorId, page: pagina, size: 20 },
        }
      );

      if (pagina === 0) {
        setMensajes(data.content);
      } else {
        setMensajes((prev) => [...data.content, ...prev]);
      }

      setHasMore(!data.last); // El backend indica si es la última página
      setPage(pagina);
    } catch (error) {
      console.error("Error cargando mensajes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [emisorId, receptorId, hasMore]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      fetchMensajes(0);
      initialLoadDone.current = true;
    }
  }, [fetchMensajes]);

  // ===== Cargar mensajes más antiguos =====
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
    } finally {
      setLoadingOlder(false);
    }
  }, [fetchPage, hasMore, loadingOlder, page]);

  // ===== WebSocket =====
  useEffect(() => {
    const socket = new SockJS(
      `https://devocionales-app-backend.onrender.com/ws-notifications?userId=${usuarioActualId}`
    );
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe(`/user/queue/messages`, (message) => {
          const body =
            message.isBinaryBody && message._binaryBody
              ? new TextDecoder().decode(message._binaryBody)
              : message.body;
          const nuevo = JSON.parse(body);

          const pertenece =
            (nuevo.emisor.idUsuario === Number(usuarioId) &&
              nuevo.receptor.idUsuario === Number(usuarioActualId)) ||
            (nuevo.emisor.idUsuario === Number(usuarioActualId) &&
              nuevo.receptor.idUsuario === Number(usuarioId));

          if (pertenece) messageBufferRef.current.push(nuevo);
        });
      },
    });

    stompClient.activate();
    stompClientRef.current = stompClient;
    return () => stompClient.deactivate();
  }, [usuarioId, usuarioActualId]);

  // ===== Flush buffer =====
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

  return (
    <div className={`mensajeria-popup ${minimizado ? "minimizado" : ""}`}>
      <div className="popup-header">
        <span>{nombreUsuario || "Seleccione una conversación"}</span>
        <div className="popup-buttons">
          <button onClick={() => setMinimizado((m) => !m)}>
            {minimizado ? "▢" : "—"}
          </button>
          <button onClick={onClose}>✕</button>
        </div>
      </div>

      {!minimizado && (
        <div className="popup-body">
          {isLoading && (
            <div className="loader-fixed-top">
              Cargando Mensajes...
            </div>
          )}
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: "100%" }}
            data={mensajes}
            firstItemIndex={Math.max(0, mensajes.length - 1)}
            startReached={() => {
              if (!isLoading && hasMore) {
                fetchMensajes(page + 1);
              }
            }}
            itemContent={(index, mensaje) => (
              <div style={{ padding: "10px" }}>{mensaje.texto}</div>
            )}
          />

          <div className="input-row">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe un mensaje..."
              onKeyDown={(e) => {
                if (e.key === "Enter") enviarMensaje();
              }}
            />
            <button onClick={enviarMensaje}>Enviar</button>
          </div>
        </div>
      )
      }
    </div >
  );
}

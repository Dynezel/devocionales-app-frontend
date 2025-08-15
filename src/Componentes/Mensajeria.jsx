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

export default function Mensajeria({ usuarioId, usuarioActualId, onClose }) {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [minimizado, setMinimizado] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const imagenPerfilUsuario = useProfileImage(usuarioActualId);
  const imagenPerfilOtroUsuario = useProfileImage(usuarioId);

  const stompClientRef = useRef(null);
  const messageBufferRef = useRef([]);
  const virtuosoRef = useRef(null);
  const cargadoInicial = useRef(false);

  // Obtener nombre del otro usuario
  useEffect(() => {
    if (!usuarioId) return;
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
    return () => { cancel = true; };
  }, [usuarioId]);

  // Fetch de mensajes paginados
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

  // Manejo de scroll infinito con Virtuoso
  const handleStartReached = useCallback(async () => {
    if (loadingOlder || !hasMore) return;

    setLoadingOlder(true);
    try {
      const data = await fetchPage(page);
      if (data.length > 0) {
        setMensajes((prev) => [...data.reverse(), ...prev]);
        setPage((p) => p + 1);
      } else {
        setHasMore(false);
      }
    } finally {
      setLoadingOlder(false);
    }
  }, [page, fetchPage, loadingOlder, hasMore]);

  // Carga inicial solo una vez cuando Virtuoso se monta
  useEffect(() => {
    setMensajes([]);
    setPage(0);
    setHasMore(true);
    cargadoInicial.current = false;
  }, [usuarioId, usuarioActualId]);

  // WebSocket
  useEffect(() => {
    if (!usuarioId || !usuarioActualId) return;
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

  // Flush buffer de mensajes
  useEffect(() => {
    const interval = setInterval(() => {
      if (messageBufferRef.current.length > 0) {
        const batch = messageBufferRef.current;
        messageBufferRef.current = [];
        setMensajes((prev) => [...prev, ...batch]);
      }
    }, FLUSH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Enviar mensaje
  const enviarMensaje = () => {
    if (!nuevoMensaje.trim()) return;
    const tempMensaje = {
      emisor: { idUsuario: usuarioActualId },
      receptor: { idUsuario: usuarioId },
      contenido: nuevoMensaje,
      fechaEnvio: new Date().toISOString(),
      id: Date.now(),
    };
    setMensajes((prev) => [...prev, tempMensaje]);
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
          <div className="mensajes-container" style={{ position: "relative", height: "400px" }}>
            {/* Loader fijo */}
            {loadingOlder && (
              <div className="loader-fixed-top">Cargando mensajes...</div>
            )}

            <Virtuoso
              ref={virtuosoRef}
              className="mensajes"
              style={{ height: "100%" }}
              data={mensajes}
              firstItemIndex={hasMore ? PAGE_SIZE * page : 0}
              startReached={() => {
                if (!cargadoInicial.current) {
                  cargadoInicial.current = true;
                }
                handleStartReached();
              }}
              itemContent={(index, mensaje) => {
                const esActual = mensaje.emisor?.idUsuario === usuarioActualId;
                const { fecha, hora } = formatFechaEnvio(mensaje.fechaEnvio);
                return (
                  <div className={`mensaje ${esActual ? "enviado" : "recibido"}`}>
                    {!esActual && (
                      <img
                        src={imagenPerfilOtroUsuario}
                        alt="Perfil otro usuario"
                        className="profile-picture profile-picture-otro"
                      />
                    )}
                    <div className="mensaje-texto">{mensaje.contenido}</div>
                    {esActual && (
                      <img
                        src={imagenPerfilUsuario}
                        alt="Tu perfil"
                        className="profile-picture profile-picture-usuario"
                      />
                    )}
                    <div className="mensaje-fecha">{hora}</div>
                  </div>
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

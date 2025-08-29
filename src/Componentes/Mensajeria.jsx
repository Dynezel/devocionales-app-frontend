import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import useProfileImage from "../hooks/useProfileImage";
import { Virtuoso } from "react-virtuoso";
import "../css/Mensajeria.css";

const PAGE_SIZE = 20;
const FLUSH_INTERVAL_MS = 300;

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
  const [cargando, setCargando] = useState(false);
  const inicialCargado = useRef(false);

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
          `https://localhost:8080/usuario/perfil/${usuarioId}`
        );
        if (!cancel) setNombreUsuario(resp.data.nombre || "");
      } catch {
        if (!cancel) setNombreUsuario("");
      }
    })();
    return () => { cancel = true; };
  }, [usuarioId]);

  // ===== Fetch mensajes =====
  const fetchMessages = useCallback(async (beforeId) => {
    if (cargando) return [];
    setCargando(true);
    try {
      const resp = await axios.get(
        "https://localhost:8080/mensajes/conversacion",
        {
          params: {
            emisorId: usuarioActualId,
            receptorId: usuarioId,
            size: PAGE_SIZE,
            beforeMessageId: beforeId, // solo mensajes más antiguos
          },
        }
      );
      return resp.data || [];
    } catch {
      return [];
    } finally {
      setCargando(false);
    }
  }, [usuarioActualId, usuarioId, cargando]);

  // ===== Carga inicial =====
  const loadInitial = useCallback(async () => {
    const data = await fetchMessages(undefined); // sin beforeId = últimos mensajes
    setConversacion(data);
    setHasMore(data.length === PAGE_SIZE);
  }, [fetchMessages]);

  useEffect(() => {
    if (!usuarioId || !usuarioActualId) return;
    if (inicialCargado.current) return;
    inicialCargado.current = true;

    setConversacion([]);
    setHasMore(true);
    loadInitial();
  }, [usuarioId, usuarioActualId, loadInitial]);

  // ===== Cargar mensajes antiguos =====
  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const oldestId = conversacion[0]?.id;
      const olderMessages = await fetchMessages(oldestId);
      if (olderMessages.length > 0) {
        setConversacion(prev => [...olderMessages, ...prev]);
      } else {
        setHasMore(false);
      }
    } finally {
      setLoadingOlder(false);
    }
  }, [conversacion, fetchMessages, hasMore, loadingOlder]);

  // ===== WebSocket =====
  useEffect(() => {
    const socket = new SockJS(
      `https://localhost:8080/ws-notifications?userId=${usuarioActualId}`
    );
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe("/user/queue/messages", (message) => {
          const body =
            message.isBinaryBody && message._binaryBody
              ? new TextDecoder().decode(message._binaryBody)
              : message.body;
          const nuevo = JSON.parse(body);

          const pertenece =
            (nuevo.emisorId === Number(usuarioId) &&
              nuevo.receptorId === Number(usuarioActualId)) ||
            (nuevo.emisorId === Number(usuarioActualId) &&
              nuevo.receptorId === Number(usuarioId));

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
        setConversacion(prev => [...prev, ...batch]);
        setTimeout(() => {
          if (virtuosoRef.current) {
            virtuosoRef.current.scrollToIndex({ index: conversacion.length + batch.length - 1 });
          }
        }, 0);
      }
    }, FLUSH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [conversacion.length]);

  // ===== Enviar mensaje =====
  const enviarMensaje = () => {
    if (!nuevoMensaje.trim()) return;
    const tempMensaje = {
      emisorId: usuarioActualId,
      receptorId: usuarioId,
      contenido: nuevoMensaje,
      fechaEnvio: new Date().toISOString(),
      id: Date.now(),
    };
    setConversacion(prev => [...prev, tempMensaje]);
    setNuevoMensaje("");

    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(tempMensaje),
      });
    }
  };

  return (
    <div className={`mensajeria-popup ${minimizado ? "minimizado" : ""}`}>
      <div className="popup-header">
        <span>{nombreUsuario || "Seleccione una conversación"}</span>
        <div className="popup-buttons">
          <button onClick={() => setMinimizado(m => !m)}>{minimizado ? "▢" : "—"}</button>
          <button onClick={onClose}>✕</button>
        </div>
      </div>
      {!minimizado && (
        <div className="popup-body">
          {loadingOlder && <div className="loader-fixed-top">Cargando mensajes...</div>}
          <div className="mensajes-container" style={{ position: "relative", height: "400px" }}>
            <Virtuoso
              ref={virtuosoRef}
              firstItemIndex={0}
              style={{ height: "100%" }}
              className="mensajes"
              data={conversacion || []}
              followOutput="auto"
              atTopStateChange={(atTop) => { if (atTop) loadOlder(); }}
              initialTopMostItemIndex={conversacion.length > 0 ? conversacion.length - 1 : 0}
              itemContent={(index, mensaje) => {
                const fechaForm = formatFechaEnvio(mensaje.fechaEnvio);
                const mostrarFecha =
                  index === 0 || formatFechaEnvio(conversacion[index - 1]?.fechaEnvio).fecha !== fechaForm.fecha;
                const esActual = Number(mensaje.emisorId) === Number(usuarioActualId);
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
              onChange={e => setNuevoMensaje(e.target.value)}
              placeholder="Escribe un mensaje..."
              onKeyDown={e => { if (e.key === "Enter") enviarMensaje(); }}
            />
            <button onClick={enviarMensaje}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}

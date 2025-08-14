import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import useProfileImage from "../hooks/useProfileImage";
import { Virtuoso } from "react-virtuoso";
import "../css/Mensajeria.css";

// ==== Config ====
const PAGE_SIZE = 20;
const FLUSH_INTERVAL_MS = 100; // buffer flush frequency

// ==== Helpers ====
const formatFechaEnvio = (fechaEnvio) => {
  const fecha = new Date(fechaEnvio);
  const opcionesFecha = { day: "2-digit", month: "long" };
  const opcionesHora = { hour: "2-digit", minute: "2-digit" };
  return {
    fecha: fecha.toLocaleDateString("es-ES", opcionesFecha),
    hora: fecha.toLocaleTimeString("es-ES", opcionesHora),
  };
};

const isNearBottom = (el, threshold = 80) => {
  if (!el) return false;
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
};

// ==== Item memoizado ====
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
  const imagenPerfilUsuario = useProfileImage(usuarioActualId);
  const imagenPerfilOtroUsuario = useProfileImage(usuarioId);
  const mensajesRef = useRef(null);
  const mensajesEndRef = useRef(null);
  const popupRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [page, setPage] = useState(0);            // página actual ya cargada (0 = la primera, los últimos N mensajes)
  const [hasMore, setHasMore] = useState(true);   // si quedan más antiguos
  const [loadingOlder, setLoadingOlder] = useState(false);
  const stompClientRef = useRef(null);
  const messageBufferRef = useRef([]);            // buffer de mensajes entrantes
  const lastUserScrollNearBottom = useRef(true);  // trackea si el usuario estaba cerca del final
  const virtuosoRef = useRef(null);

  // ===== Obtener nombre usuario (título) =====
  useEffect(() => {
    let cancel = false;
    const obtenerNombreUsuario = async () => {
      try {
        const resp = await axios.get(
          `https://devocionales-app-backend.onrender.com/usuario/perfil/${usuarioId}`
        );
        if (!cancel) setNombreUsuario(resp.data.nombre || "");
      } catch (e) {
        if (!cancel) setNombreUsuario("");
        console.error("Error al obtener el nombre del usuario:", e);
      }
    };
    if (usuarioId) obtenerNombreUsuario();
    return () => { cancel = true; };
  }, [usuarioId]);

  // ===== Carga inicial de conversación (últimos PAGE_SIZE) =====
  const fetchPage = useCallback(
    async (pagina) => {
      const params = {
        emisorId: usuarioActualId,
        receptorId: usuarioId,
        page: pagina,
        size: PAGE_SIZE,
      };
      const resp = await axios.get(
        "https://devocionales-app-backend.onrender.com/mensajes/conversacion",
        { params }
      );
      return resp.data || [];
    },
    [usuarioActualId, usuarioId]
  );

  const loadInitial = useCallback(async () => {
    try {
      const data = await fetchPage(0);
      setConversacion(data);
      setPage(1);
      setHasMore(data.length === PAGE_SIZE);
      // Scroll al final tras la carga inicial
      requestAnimationFrame(() => {
        if (mensajesRef.current) {
          mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
        }
      });
    } catch (e) {
      console.error("Error al cargar conversación inicial:", e);
    }
  }, [fetchPage]);

  useEffect(() => {
    if (usuarioId && usuarioActualId) {
      setConversacion([]);
      setPage(0);
      setHasMore(true);
      loadInitial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId, usuarioActualId]);

  // ===== Cargar más antiguos al hacer scroll arriba =====
  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const container = mensajesRef.current;
      const prevScrollHeight = container?.scrollHeight ?? 0;

      const data = await fetchPage(page);
      if (data.length > 0) {
        setConversacion((prev) => [...data, ...prev]); // prepend
        setPage((p) => p + 1);

        // Mantener posición de scroll (no "salta")
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Error al cargar mensajes antiguos:", e);
    } finally {
      setLoadingOlder(false);
    }
  }, [fetchPage, hasMore, loadingOlder, page]);

  useEffect(() => {
    const container = mensajesRef.current;
    if (!container) return;

    const onScroll = () => {
      // si llega al tope, pedir más antiguos
      if (container.scrollTop === 0 && hasMore && !loadingOlder) {
        loadOlder();
      }
      // track si está cerca del final
      lastUserScrollNearBottom.current = isNearBottom(container);
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [hasMore, loadOlder, loadingOlder]);

  // ===== WebSocket + Buffer =====
  useEffect(() => {
    const socket = new SockJS(
      `https://devocionales-app-backend.onrender.com/ws-notifications?userId=${usuarioActualId}`
    );
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe(`/user/queue/messages`, (message) => {
          let body = message.body;
          if (message.isBinaryBody && message._binaryBody) {
            body = new TextDecoder().decode(message._binaryBody);
          }
          const nuevo = JSON.parse(body);

          const receptorId = Number(usuarioId);
          const emisorId = Number(usuarioActualId);
          const pertenece =
            (nuevo.emisor.idUsuario === receptorId &&
              nuevo.receptor.idUsuario === emisorId) ||
            (nuevo.emisor.idUsuario === emisorId &&
              nuevo.receptor.idUsuario === receptorId);

          if (pertenece) {
            messageBufferRef.current.push(nuevo); // buffer, no setea estado directo
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

  // Vaciar buffer cada X ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (messageBufferRef.current.length > 0) {
        const batch = messageBufferRef.current;
        messageBufferRef.current = [];
        setConversacion((prev) => [...prev, ...batch]);

        // autoscroll si el usuario está abajo
        requestAnimationFrame(() => {
          const container = mensajesRef.current;
          if (container && lastUserScrollNearBottom.current) {
            container.scrollTop = container.scrollHeight;
          }
        });
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
      id: Date.now(), // temporal, evita key duplicada
    };

    // pinta inmediato
    setConversacion((prev) => [...prev, tempMensaje]);

    // si el user está abajo, mantener auto-scroll
    requestAnimationFrame(() => {
      const container = mensajesRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    });

    setNuevoMensaje("");

    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({
          emisorId: usuarioActualId,
          receptorId: usuarioId,
          contenido: tempMensaje.contenido,
        }),
      });
    } else {
      console.error("STOMP no está conectado");
    }
  };

  // ===== Minimizar / Drag =====
  const toggleMinimizado = () => {
    setMinimizado((m) => !m);
    if (mensajesEndRef.current && !minimizado) {
      requestAnimationFrame(() => {
        const container = mensajesRef.current;
        if (container) container.scrollTop = container.scrollHeight;
      });
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
    if (dragging && popupRef.current) {
      const x = e.clientX - offset.x;
      const y = e.clientY - offset.y;
      popupRef.current.style.left = `${x}px`;
      popupRef.current.style.top = `${y}px`;
    }
  };
  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, offset]);

  // Posición inicial (esquina inferior derecha)
  useEffect(() => {
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
      style={{ position: "fixed", left: "20px", top: "20px" }}
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
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: "400px" }}
            data={conversacion}
            startReached={loadOlder}
            followOutput={"auto"} // auto-scroll solo si estás abajo
            itemContent={(index, mensaje) => {
              const fechaForm = formatFechaEnvio(mensaje.fechaEnvio);
              const mostrarFecha =
                index === 0 ||
                formatFechaEnvio(conversacion[index - 1]?.fechaEnvio).fecha !== fechaForm.fecha;
              const esActual =
                Number(mensaje.emisor.idUsuario) === Number(usuarioActualId);

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
      )}
    </div>
  );
}

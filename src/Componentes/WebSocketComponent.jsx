import React, { useEffect } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function WebSocketComponent({ usuarioId, onNewNotification }) {
  useEffect(() => {
    if (!usuarioActualId) {
      alert("usuarioActualId no definido, WebSocket no se inicia");
      return;
    }
    const socket = new SockJS(`https://devocionales-app-backend.onrender.com/ws-notifications?userId=${usuarioId}`);
    alert("Connecting to:", `https://devocionales-app-backend.onrender.com/ws-notifications?userId=${usuarioId}`);
    const stompClient = Stomp.over(socket);
    console.log("Inicializando WebSocket con usuarioActualId:", usuarioActualId);
    if (!usuarioActualId) {
      alert("usuarioActualId no está definido, no se conecta WebSocket");
      return;
    }
    stompClient.connect({}, (frame) => {
      console.log('Connected: ' + frame);

      stompClient.subscribe(`/topic/notifications/${usuarioId}`, (messageOutput) => {
        const notification = JSON.parse(messageOutput.body);
        onNewNotification(notification);
      });
    });

    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, [usuarioId, onNewNotification]);

  return null;
}

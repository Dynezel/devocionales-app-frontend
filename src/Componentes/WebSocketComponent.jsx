import React, { useEffect } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function WebSocketComponent({ usuarioId, onNewNotification }) {
  useEffect(() => {
    const socket = new SockJS(`https://devocionales-app-backend.onrender.com/ws-notifications?userId=${usuarioId}`);
    console.log("Connecting to:", `https://devocionales-app-backend.onrender.com/ws-notifications?userId=${usuarioId}`);
    const stompClient = Stomp.over(socket);

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

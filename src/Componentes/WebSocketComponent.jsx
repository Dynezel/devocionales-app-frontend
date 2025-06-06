import React, { useEffect } from 'react';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function WebSocketComponent({ usuarioId, onNewNotification }) {
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws-notifications');
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

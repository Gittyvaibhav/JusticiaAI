import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  const token = localStorage.getItem('token');

  if (!token) {
    return null;
  }

  if (!socket) {
    socket = io('http://localhost:5000', {
      autoConnect: false,
      auth: {
        token,
      },
    });
  }

  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

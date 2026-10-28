import { io } from 'socket.io-client';

let socket = null;
const listeners = new Map();

export function connectSocket() {
  if (socket) socket.disconnect();

  socket = io(window.location.origin, {
    path: '/api/query/socket.io',
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    notify('connection', { connected: true });
  });

  socket.on('disconnect', () => {
    notify('connection', { connected: false });
  });

  socket.on('stats', (data) => {
    notify('stats', data);
  });

  socket.on('alert', (data) => {
    notify('alert', data);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onSocketEvent(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);

  return () => {
    listeners.get(event)?.delete(callback);
  };
}

function notify(event, data) {
  listeners.get(event)?.forEach(cb => cb(data));
}

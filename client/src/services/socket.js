// client/src/services/socket.js
import { io } from "socket.io-client"; // Standard ESM import

// Default to the backend server URL (where the Socket.IO server lives).
// This avoids trying to connect directly to Vite's dev server (which doesn't speak Socket.IO).
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000";

// In Vite dev mode, the dev server proxy may not fully support websocket upgrades.
// Using polling + disabling upgrades removes the "WebSocket is closed before the connection is established" noise.
const isDev = import.meta.env.DEV;

// Use polling in development (Vite proxy can be flaky for WS upgrades) and websocket in prod.
// Polling avoids "WebSocket is closed before the connection is established" errors during dev.
const transports = isDev ? ["polling"] : ["websocket"];

export const socket = io(SOCKET_URL, {
  transports,
  upgrade: false,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.5,
  timeout: 20000,
});

socket.on('connect', () => {
  // Show the effective options used by the socket (especially useful when the actual transport/upgrade differs from local variables).
  console.log('SocketIO: connected', {
    url: socket.io.uri,
    opts: socket.io.opts,
    transport: socket.io.engine.transport.name,
  });
});

socket.on('disconnect', (reason) => {
  console.log('SocketIO: disconnected', reason);
});

socket.on('reconnect_attempt', (attempt) => {
  console.log('SocketIO: reconnect attempt', attempt);
});

socket.on('reconnect_failed', () => {
  console.error('SocketIO: reconnect failed');
});

// Helpful debug logging for connection issues
socket.on('connect_error', (err) => {
  console.error('Socket.IO connect_error:', err);
});

socket.on('connect_timeout', (timeout) => {
  console.error('Socket.IO connect_timeout:', timeout);
});

// Adding a check to ensure 'io' exists before running
if (typeof io === 'undefined') {
    console.error("🚨 Socket.io client library failed to load!");
}
// client/src/services/socket.js
import { io } from "socket.io-client"; // Standard ESM import

// Use the app's origin by default (works seamlessly in dev + production),
// and fall back to a custom URL via Vite env (VITE_SOCKET_URL).
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

// In Vite dev mode, the dev server proxy may not fully support websocket upgrades.
// Using polling avoids the "WebSocket is closed before the connection is established" noise.
const transports = import.meta.env.DEV ? ["polling"] : ["polling", "websocket"];

export const socket = io(SOCKET_URL, {
  transports,
  autoConnect: true,
  reconnectionAttempts: 5,
});

socket.on('connect', () => {
  console.log('SocketIO: connected', { transports });
});

socket.on('disconnect', (reason) => {
  console.log('SocketIO: disconnected', reason);
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
// client/src/services/socket.js
import { io } from "socket.io-client"; // Standard ESM import

// Default to the backend server URL (where the Socket.IO server lives).
// This avoids trying to connect directly to Vite's dev server (which doesn't speak Socket.IO).
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000";

// In Vite dev mode, the dev server proxy may not fully support websocket upgrades.
// Using polling + disabling upgrades removes the "WebSocket is closed before the connection is established" noise.
const isDev = import.meta.env.DEV;

// Force WebSocket transport only (skip polling entirely) so we can verify the connection is truly using WS.
// If this fails, the client will emit a connect_error and we can see the exact reason.
const transports = ["websocket"];

export const socket = io(SOCKET_URL, {
  transports,
  upgrade: false,      // No upgrade phase (we start with websocket right away)
  autoConnect: true,
  reconnectionAttempts: 5,
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
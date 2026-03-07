// client/src/services/socket.js
import { io } from "socket.io-client"; // Standard ESM import

const SOCKET_URL = "http://127.0.0.1:5000";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
  reconnectionAttempts: 5,
});

// Adding a check to ensure 'io' exists before running
if (typeof io === 'undefined') {
    console.error("🚨 Socket.io client library failed to load!");
}
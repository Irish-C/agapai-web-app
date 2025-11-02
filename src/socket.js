// src/socket.js
import { io } from "socket.io-client";

// Connect to Flask backend
export const socket = io("http://localhost:5000", {
  transports: ["websocket"], // Force websocket (faster, avoids polling)
  reconnection: true,        // Auto-reconnect if backend restarts
});
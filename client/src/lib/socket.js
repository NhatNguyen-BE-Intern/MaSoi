import { io } from "socket.io-client";

let socketInstance = null;

export const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    // If running Next.js dev server on port 3001, connect to backend on port 3000
    if (window.location.port === "3001") {
      const hostname = window.location.hostname;
      return `http://${hostname}:3000`;
    }
    // When running in production (e.g. Render) where frontend is served by Express
    return window.location.origin;
  }
  return "http://localhost:3000";
};

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(getBackendUrl(), {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 5,
    });
  }
  return socketInstance;
};

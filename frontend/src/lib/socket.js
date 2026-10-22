import { io } from "socket.io-client";

let socketInstance = null;

export const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  if (typeof window !== "undefined") {
    // If running on a frontend dev server (port 3000, 3001, etc.), connect to backend on port 5000
    if (window.location.port && window.location.port !== "5000") {
      const hostname = window.location.hostname || "localhost";
      return `http://${hostname}:5000`;
    }
    // When running in production (e.g. Render) where frontend is served directly by backend
    return window.location.origin;
  }
  return "http://localhost:5000";
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

import { io } from "socket.io-client";

let socketInstance = null;

export const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    // If the frontend is accessed from mobile via local IP (e.g. 192.168.1.15:3001),
    // connect socket to that same IP on port 3000
    const hostname = window.location.hostname;
    return `http://${hostname}:3000`;
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

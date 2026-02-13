import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";

let socket = null;

export const initializeSocket = () => {
  if (socket) return socket;

  const user = useUserStore.getState().user;
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  //  CONNECT
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("user_connected", user._id);
  });

  //  ERROR
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  //  DISCONNECT
  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected reason:", reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

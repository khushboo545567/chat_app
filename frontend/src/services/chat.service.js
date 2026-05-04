import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";

let socket = null;
let intentionalDisconnect = false;

//  Initialize Socket
export const initializeSocket = () => {
  if (socket) return socket;

  const user = useUserStore.getState().user;

  if (!user?._id) {
    console.warn(" Socket not initialized: user not available");
    return null;
  }

  intentionalDisconnect = false;

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  //  CONNECT
  socket.on("connect", () => {
    console.log(" Socket connected:", socket.id);

    //  Always check before emit (extra safety)
    if (socket && user?._id) {
      socket.emit("user_connected", user._id);
    }
  });

  //  ERROR
  socket.on("connect_error", (error) => {
    console.error(" Socket connection error:", error.message);
  });

  //  DISCONNECT
  socket.on("disconnect", (reason) => {
    console.log(" Socket disconnected:", reason);

    if (!intentionalDisconnect) {
      socket = null; // allow reconnection later
    }
  });

  return socket;
};

//  Get socket safely
export const getSocket = () => {
  if (!socket) {
    console.warn(" Socket not initialized");
  }
  return socket;
};

//  Safe Emit (VERY IMPORTANT)
export const emitEvent = (event, data) => {
  if (!socket) {
    console.warn(` Cannot emit "${event}" → socket is null`);
    return;
  }

  socket.emit(event, data);
};

//  Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    intentionalDisconnect = true;
    socket.disconnect();
    socket = null;
    console.log(" Socket disconnected intentionally");
  }
};

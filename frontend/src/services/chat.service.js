import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";

let socket = null;
let intentionalDisconnect = false;
export const initializeSocket = () => {
  if (socket) return socket;
  intentionalDisconnect = false;

  const user = useUserStore.getState().user;
  if (!user?._id) {
    console.warn("initializeSocket: no user, aborting");
    return null;
  }
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  //  CONNECT
  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    console.log("user conneccted and there org id is :", user?._id);
    socket.emit("user_connected", user?._id);
  });

  //  ERROR
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  //  DISCONNECT
  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected reason:", reason);
    if (!intentionalDisconnect) {
      socket = null; // allow re-init on accidental disconnect
    }
  });

  return socket;
};

// export const getSocket = () => {
//   // if (!socket) {
//   //   return initializeSocket();
//   // }
//   // return socket;
//   return socket; // never auto-reinitialize — call initializeSocket() explicitly
// };

export const getSocket = () => {
  if (!socket) {
    console.warn("Socket not initialized");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    intentionalDisconnect = true;
    socket.disconnect();
    socket = null;
  }
};

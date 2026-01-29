import { io } from "socket.io-client";

export const socket = io(
  "https://realtime-chat-application26.onrender.com",
  {
    transports: ["websocket"],
    autoConnect: true
  }
);

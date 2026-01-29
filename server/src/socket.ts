import { Server, Socket } from "socket.io";

export function setupSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("join_room", ({ roomId, role }) => {
      socket.join(roomId);
      socket.data.role = role;
    });

    socket.on("send_message", (data) => {
      io.to(data.roomId).emit("receive_message", data);
    });

    socket.on("send_popup", (data) => {
      io.to(data.roomId).emit("receive_message", data);
    });

    socket.on("send_confirmation", (data) => {
      io.to(data.roomId).emit("receive_message", data);
    });
  });
}
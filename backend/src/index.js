import app from "./app.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import http from "http";
import inilizeSocket from "./service/socket.service.js";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 5000;

// CREATE SINGLE HTTP SERVER
const server = http.createServer(app);

// INITIALIZE SOCKET WITH SAME SERVER
const io = inilizeSocket(server);

// to access io in diffrent files
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = socketUserMap;
  next();
});

// OPTIONAL: make io accessible in app
app.set("io", io);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log("Server is listening on port", PORT);
    });
  })
  .catch((error) => {
    console.log("Error while starting server:", error);
  });

// import express from "express";
// import cookieParser from "cookie-parser";
// import cors from "cors";
// import authroute from "./routes/auth.routes.js";
// import errorHandler from "./middleware/error.middleware.js";
// import { inilizeSocket } from "./service/socket.service.js";
// import http from "http";

// const app = express();
// app.use(
//   cors({
//     origin: "*",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   }),
// );
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// const server = http.createServer(app);
// const io = inilizeSocket(server);

// app.use((req, res, next) => {
//   req.io = io;
//   req.socketUserMap = io.socketUserMap;
//   next();
// });

// // listen to the server not by app

// // ROUTES
// app.use("/api/v1/auth", authroute);

// app.use(errorHandler);
// export default app;

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authroute from "./routes/auth.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import messageRoute from "./routes/message.routes.js";
import statusRoute from "./routes/status.routes.js";

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ROUTES
app.use("/api/v1/auth", authroute);
app.use("/api/v1/message", messageRoute);
app.use("/api/v1/status", statusRoute);

// ERROR HANDLER
app.use(errorHandler);

export default app;

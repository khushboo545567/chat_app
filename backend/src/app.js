import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authroute from "./routes/auth.routes.js";
import errorHandler from "./middleware/error.middleware.js";
const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ROUTES
app.use("/api/v1/auth", authroute);

app.use(errorHandler);
export default app;

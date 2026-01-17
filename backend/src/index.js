import app from "./app.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("server is listening on ", PORT);
    });
  })
  .catch((error) => {
    console.log("error occurs while server is running !", error);
  });

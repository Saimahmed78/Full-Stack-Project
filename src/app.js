import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/auth.routes.js";
import { ApiError } from "./utils/ApiError.js";
import dbConnection from "./db/dbConnection.js";
import healthCheck from "./controllers/healthCheckControllers.js";
import cookieParser from "cookie-parser";

dotenv.config({
  path: ".env", // relative path is /home/saimahmed/Desktop/Folder/.env
});
const app = express();

app.use(
  cors({
    origin: ["http://localhost:4000", "http://localhost:8000"],
    credentials: true,
    methods: ["PUT", "DELETE", "UPDATE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
dbConnection();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/v1/healthCheck", healthCheck);
app.use("/api/v1/users", userRoutes);
app.use((err, req, res, next) => {
  console.error("💥 Error Middleware Triggered:", err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message, // ✅ Add this line
      statusCode: err.statusCode,
      errors: err.errors || [], // ✅ Optional: only if you're using .errors in your ApiError
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    statusCode: 500,
  });
});

export default app;

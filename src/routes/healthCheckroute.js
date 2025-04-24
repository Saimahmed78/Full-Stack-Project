import { Router } from "express";
import healthCheck from "../controllers/healthCheckControllers.js";

const router = Router();

router.get("/", healthCheck);

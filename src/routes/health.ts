import { Router, Request, Response } from "express";
import db from "../services/database";

const router = Router();

// Health check básico
router.get("/", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    service: "Backend API",
    timestamp: new Date().toISOString(),
    database: "Supabase + Prisma",
  });
});

// Health check de la base de datos
router.get("/database", async (req: Request, res: Response) => {
  try {
    const isHealthy = await db.healthCheck();
    
    if (isHealthy) {
      res.json({
        status: "OK",
        database: "Connected",
        timestamp: new Date().toISOString(),
        provider: "Supabase PostgreSQL",
      });
    } else {
      res.status(503).json({
        status: "ERROR",
        database: "Disconnected",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      database: "Error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

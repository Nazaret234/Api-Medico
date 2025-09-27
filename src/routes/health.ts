import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /api/health
 * Endpoint para verificar el estado de la API
 */
router.get("/", (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    responseTime: process.hrtime(),
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    status: "OK",
  };

  res.status(200).json({
    success: true,
    data: healthCheck,
  });
});

export default router;

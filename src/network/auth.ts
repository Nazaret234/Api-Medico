import { Router, Request, Response } from "express";
import { validateGoogleToken as ValidateGoogleToken } from "../services/passport";
import { tokenBlacklistService } from "../services/tokenBlacklist";
import { authenticateJWT } from "../services/passport";
import { authorize } from "../middlewares/authorization";

const router: Router = Router();

// Interfaz para el payload del JWT
interface JWTPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  roleName: string;
  iat: number;
  exp: number;
  jti?: string;
}

async function validateTokenGoogle(req: Request, res: Response) {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({
      success: false,
      error: "El token de Google es requerido",
    });
  }
  try {
    const tokenJWT = await ValidateGoogleToken(idToken);
    return res.status(200).json({
      success: true,
      data: { token: tokenJWT },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Token de Google inválido",
    });
  }
}

/**
 * Cerrar sesión individual (revocar token actual)
 * Compatible con Zero Trust: audita la acción y valida el usuario
 */
async function logout(req: Request, res: Response) {
  try {
    const user = req.user as JWTPayload;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    // Extraer el token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Token no encontrado",
      });
    }

    const token = authHeader.substring(7);
    const tokenId = user.jti || token;

    // Revocar el token específico
    await tokenBlacklistService.revokeToken(
      tokenId,
      user.userId,
      "user_logout"
    );

    // Log de auditoría Zero Trust
    console.info(
      `[LOGOUT] Usuario ${user.email} cerró sesión desde IP: ${req.ip}`
    );

    return res.status(200).json({
      success: true,
      message: "Sesión cerrada exitosamente",
    });
  } catch (error) {
    console.error("[ERROR] Error en logout:", error);
    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
}

/**
 * Cerrar todas las sesiones del usuario
 * Compatible con Zero Trust: revoca todas las sesiones por seguridad
 */
async function logoutAll(req: Request, res: Response) {
  try {
    const user = req.user as JWTPayload;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    // Revocar todos los tokens del usuario
    await tokenBlacklistService.revokeAllUserTokens(
      user.userId,
      "user_logout_all"
    );

    // Log de auditoría Zero Trust
    console.info(
      `[LOGOUT_ALL] Usuario ${user.email} cerró todas sus sesiones desde IP: ${req.ip}`
    );

    return res.status(200).json({
      success: true,
      message: "Todas las sesiones han sido cerradas",
    });
  } catch (error) {
    console.error("[ERROR] Error en logout completo:", error);
    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
}

/**
 * Obtener estadísticas de sesiones (solo para administradores)
 */
async function getSessionStats(req: Request, res: Response) {
  try {
    const user = req.user as JWTPayload;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    // Solo administradores pueden ver estadísticas
    if (user.roleName !== "ADMIN") {
      console.warn(
        `[SECURITY] Usuario no admin ${user.email} intentó ver estadísticas desde IP: ${req.ip}`
      );
      return res.status(403).json({
        success: false,
        error: "Acceso denegado",
      });
    }

    const stats = await tokenBlacklistService.getStats();

    // Log de acceso administrativo
    console.info(
      `[ADMIN_ACCESS] ${user.email} consultó estadísticas de sesiones desde IP: ${req.ip}`
    );

    return res.status(200).json({
      success: true,
      data: stats,
      message: "Estadísticas obtenidas exitosamente",
    });
  } catch (error) {
    console.error("[ERROR] Error al obtener estadísticas:", error);
    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
}

/**
 * Revocar token de otro usuario (solo para administradores)
 * Implementa Zero Trust: solo admins pueden revocar tokens ajenos
 */
async function revokeUserSessions(req: Request, res: Response) {
  try {
    const user = req.user as JWTPayload;
    const { targetUserId, reason = "admin_revocation" } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    // Solo administradores pueden revocar sesiones de otros usuarios
    if (user.roleName !== "ADMIN") {
      console.warn(
        `[SECURITY] Usuario no admin ${user.email} intentó revocar sesiones desde IP: ${req.ip}`
      );
      return res.status(403).json({
        success: false,
        error: "Acceso denegado",
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: "ID de usuario objetivo requerido",
      });
    }

    // Revocar todas las sesiones del usuario objetivo
    await tokenBlacklistService.revokeAllUserTokens(
      targetUserId,
      `admin_revocation_by_${user.userId}_${reason}`
    );

    // Log de auditoría crítico
    console.warn(
      `[ADMIN_REVOKE] Admin ${user.email} revocó todas las sesiones del usuario ${targetUserId} desde IP: ${req.ip} - Razón: ${reason}`
    );

    return res.status(200).json({
      success: true,
      message: `Sesiones del usuario ${targetUserId} han sido revocadas`,
    });
  } catch (error) {
    console.error("[ERROR] Error al revocar sesiones de usuario:", error);
    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
}

// Rutas públicas (sin autenticación)
router.post("/validateTokenGoogle", validateTokenGoogle);

// Rutas protegidas (requieren autenticación + autorización)
router.post("/logout", authenticateJWT, authorize(), logout);
router.post("/logout-all", authenticateJWT, authorize(), logoutAll);
router.get("/session-stats", authenticateJWT, authorize(), getSessionStats);
router.post(
  "/revoke-user-sessions",
  authenticateJWT,
  authorize(),
  revokeUserSessions
);

export default router;

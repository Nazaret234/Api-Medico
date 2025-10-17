import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { tokenBlacklistService } from "../services/tokenBlacklist";

const prisma = new PrismaClient();

// Interfaz para el payload del JWT (lo que viene en el token)
interface JWTPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  roleName: string;
  iat: number;
  exp: number;
  jti?: string; // JWT ID para identificación única del token
}

/**
 * Middleware de autorización con principios de Zero Trust
 * Valida permisos granulares basados en el método HTTP y el rol del usuario
 * Incluye validación de tokens revocados
 */
export const authorize = () => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // El usuario viene del JWT payload gracias a passport
      const user = req.user as JWTPayload;

      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      // Extraer el token JWT del header para verificar si está revocado
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const tokenId = user.jti || token; // Usar JWT ID o el token completo
        const issuedAt = new Date(user.iat * 1000); // Convertir de timestamp Unix

        // Verificar si el token está revocado (Zero Trust: validar cada request)
        const isRevoked = await tokenBlacklistService.isTokenRevoked(
          tokenId,
          user.userId,
          issuedAt
        );

        if (isRevoked) {
          console.warn(
            `[SECURITY] Token revocado usado por ${user.email} desde IP: ${req.ip}`
          );
          res.status(401).json({
            success: false,
            message: "Sesión revocada. Por favor, inicia sesión nuevamente.",
          });
          return;
        }
      }

      // El usuario viene del JWT payload gracias a passport
      const userPayload = req.user as JWTPayload;

      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
        return;
      }

      // Obtener permisos del rol desde la base de datos
      const rolePermissions = await prisma.roles.findUnique({
        where: { id: user.roleId },
      });

      if (!rolePermissions) {
        // Log de intento de acceso no autorizado
        console.warn(
          `[SECURITY] Acceso denegado para usuario con rol inexistente: ${user.email} (roleId: ${user.roleId}) desde IP: ${req.ip}`
        );
        res.status(403).json({
          success: false,
          message: "Acceso denegado: rol no válido",
        });
        return;
      }

      // Validar permisos según el método HTTP (principio de menor privilegio)
      const method = req.method.toLowerCase();

      let hasPermission = false;

      switch (method) {
        case "get":
          hasPermission = rolePermissions.canGet;
          break;
        case "post":
          hasPermission = rolePermissions.canPost;
          break;
        case "put":
          hasPermission = rolePermissions.canPut;
          break;
        case "patch":
          hasPermission = rolePermissions.canPatch;
          break;
        case "delete":
          hasPermission = rolePermissions.canDelete;
          break;
        default:
          hasPermission = false;
      }

      if (!hasPermission) {
        // Log de intento de acceso no autorizado (monitoreo)
        console.warn(
          `[SECURITY] Acceso denegado: ${user.email} (${
            user.roleName
          }) intentó ${method.toUpperCase()} en ${req.originalUrl} desde IP: ${
            req.ip
          }`
        );

        res.status(403).json({
          success: false,
          message: `Acceso denegado: no tienes permisos para realizar ${method.toUpperCase()}`,
        });
        return;
      }

      // Log de acceso autorizado (auditoría)
      console.info(
        `[ACCESS] ${user.email} (${
          user.roleName
        }) ejecutó ${method.toUpperCase()} en ${req.originalUrl} desde IP: ${
          req.ip
        }`
      );

      // Agregar información del rol al request para uso posterior
      (req as any).userRole = rolePermissions;
      (req as any).userInfo = user;

      next();
    } catch (error) {
      console.error(`[ERROR] Error en autorización:`, error);
      res.status(500).json({
        success: false,
        message: "Error interno de autorización",
      });
    }
  };
};

/**
 * Middleware específico para validar que el usuario solo acceda a sus propios recursos
 * Implementa el principio de menor privilegio a nivel de datos
 */
export const authorizeOwnResource = (userIdParam: string = "id") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userInfo = (req as any).userInfo as JWTPayload;
    const resourceUserId = req.params[userIdParam];
    const userRole = (req as any).userRole;

    // Los ADMIN pueden acceder a cualquier recurso
    if (userRole && userRole.role === "ADMIN") {
      console.info(
        `[ACCESS] Admin ${userInfo?.email} accedió a recurso de usuario ${resourceUserId}`
      );
      next();
      return;
    }

    // Los usuarios normales solo pueden acceder a sus propios recursos
    if (userInfo?.userId !== resourceUserId) {
      console.warn(
        `[SECURITY] Usuario ${userInfo?.email} intentó acceder a recurso ajeno: ${resourceUserId} desde IP: ${req.ip}`
      );
      res.status(403).json({
        success: false,
        message: "Acceso denegado: solo puedes acceder a tus propios recursos",
      });
      return;
    }

    next();
  };
};

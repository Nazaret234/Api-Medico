import { PrismaClient } from "@prisma/client";

/**
 * Servicio para gestión de tokens revocados (blacklist)
 * Implementa principios de Zero Trust para el manejo de sesiones
 * Híbrido: Intenta usar BD, fallback a memoria si falla
 */

interface RevokedToken {
  tokenId: string;
  userId: string;
  reason: string;
  revokedAt: Date;
  revokeAllBefore?: Date;
}

class TokenBlacklistService {
  private prisma = new PrismaClient();
  private revokedTokens: Map<string, RevokedToken> = new Map();
  private userRevokeAll: Map<string, Date> = new Map();
  private useDatabase = true; // Flag para controlar si usar BD o memoria

  /**
   * Revocar un token específico (logout individual)
   */
  async revokeToken(
    tokenId: string,
    userId: string,
    reason: string = "logout"
  ): Promise<void> {
    try {
      if (this.useDatabase) {
        try {
          // Intentar usar la base de datos
          await this.prisma.revokedToken.create({
            data: {
              tokenId,
              userId,
              reason,
              revokedAt: new Date(),
            },
          });
          console.info(
            `[TOKEN_REVOKED] (BD) Token ${tokenId.substring(
              0,
              8
            )}... revocado para usuario ${userId} - Razón: ${reason}`
          );
          return;
        } catch (dbError) {
          console.warn(
            "[WARNING] Base de datos no disponible, usando memoria:",
            dbError
          );
          this.useDatabase = false; // Cambiar a memoria por esta sesión
        }
      }

      // Fallback a memoria
      const revokedToken: RevokedToken = {
        tokenId,
        userId,
        reason,
        revokedAt: new Date(),
      };

      this.revokedTokens.set(tokenId, revokedToken);
      console.info(
        `[TOKEN_REVOKED] (MEM) Token ${tokenId.substring(
          0,
          8
        )}... revocado para usuario ${userId} - Razón: ${reason}`
      );
    } catch (error) {
      console.error("[ERROR] Error al revocar token:", error);
      throw new Error("Error al revocar token");
    }
  }

  /**
   * Revocar todas las sesiones de un usuario (logout completo)
   */
  async revokeAllUserTokens(
    userId: string,
    reason: string = "logout_all"
  ): Promise<void> {
    try {
      const revokeDate = new Date();

      if (this.useDatabase) {
        try {
          // Intentar usar la base de datos
          await this.prisma.revokedToken.create({
            data: {
              tokenId: `ALL_${userId}_${Date.now()}`,
              userId,
              reason,
              revokedAt: revokeDate,
              revokeAllBefore: revokeDate,
            },
          });
          console.info(
            `[ALL_TOKENS_REVOKED] (BD) Todas las sesiones revocadas para usuario ${userId} - Razón: ${reason}`
          );
          return;
        } catch (dbError) {
          console.warn(
            "[WARNING] Base de datos no disponible para revoke all, usando memoria:",
            dbError
          );
          this.useDatabase = false;
        }
      }

      // Fallback a memoria
      this.userRevokeAll.set(userId, revokeDate);
      console.info(
        `[ALL_TOKENS_REVOKED] (MEM) Todas las sesiones revocadas para usuario ${userId} - Razón: ${reason}`
      );
    } catch (error) {
      console.error("[ERROR] Error al revocar todas las sesiones:", error);
      throw new Error("Error al revocar sesiones");
    }
  }

  /**
   * Verificar si un token está revocado
   */
  async isTokenRevoked(
    tokenId: string,
    userId: string,
    issuedAt: Date
  ): Promise<boolean> {
    try {
      // Verificar revocación específica del token
      const specificRevocation = this.revokedTokens.get(tokenId);
      if (specificRevocation) {
        return true;
      }

      // Verificar revocación general de todos los tokens del usuario
      const userRevokeDate = this.userRevokeAll.get(userId);
      if (userRevokeDate && userRevokeDate >= issuedAt) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("[ERROR] Error al verificar token revocado:", error);
      // En caso de error, por seguridad consideramos el token como válido
      // para no bloquear usuarios legítimos
      return false;
    }
  }

  /**
   * Limpiar tokens revocados antiguos (mantenimiento)
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let deletedCount = 0;

      // Limpiar tokens específicos antiguos
      for (const [tokenId, token] of this.revokedTokens.entries()) {
        if (token.revokedAt < thirtyDaysAgo) {
          this.revokedTokens.delete(tokenId);
          deletedCount++;
        }
      }

      // Limpiar revocaciones generales antiguas
      for (const [userId, revokeDate] of this.userRevokeAll.entries()) {
        if (revokeDate < thirtyDaysAgo) {
          this.userRevokeAll.delete(userId);
          deletedCount++;
        }
      }

      console.info(
        `[CLEANUP] ${deletedCount} tokens revocados antiguos eliminados`
      );
    } catch (error) {
      console.error("[ERROR] Error en limpieza de tokens:", error);
    }
  }

  /**
   * Obtener estadísticas de tokens revocados
   */
  async getStats(): Promise<{ totalRevoked: number; userRevokeAlls: number }> {
    return {
      totalRevoked: this.revokedTokens.size,
      userRevokeAlls: this.userRevokeAll.size,
    };
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
export default tokenBlacklistService;

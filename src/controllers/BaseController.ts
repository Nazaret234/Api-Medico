import { Request, Response } from "express";
import { ApiResponse } from "../types";

export class BaseController {
  /**
   * Envía una respuesta exitosa
   */
  protected sendSuccess<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      ...(message && { message }),
      ...(data !== undefined && { data }),
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Envía una respuesta de error
   */
  protected sendError(
    res: Response,
    error: string,
    statusCode: number = 400
  ): Response {
    const response: ApiResponse = {
      success: false,
      error,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Maneja errores de manera consistente
   */
  protected handleError(res: Response, error: any): Response {
    console.error("Error en controlador:", error);

    if (error.name === "ValidationError") {
      return this.sendError(res, "Datos de entrada inválidos", 400);
    }

    return this.sendError(res, "Error interno del servidor", 500);
  }
}

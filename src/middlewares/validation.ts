import { Request, Response, NextFunction } from "express";

/**
 * Middleware para validar que el cuerpo de la petición no esté vacío
 */
export const validateBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: "El cuerpo de la petición no puede estar vacío",
    });
  }
  next();
};

/**
 * Middleware para validar campos requeridos
 */
export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];

    fields.forEach((field) => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Campos requeridos faltantes: ${missingFields.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Middleware para validar email
 */
export const validateEmail = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Formato de email inválido",
      });
    }
  }

  next();
};


import { Request, Response, NextFunction } from "express";
import { encrypt, decrypt } from "../utils/Cryp";

export const decryptRequestMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body.data === "string") {
    try {
      req.body = JSON.parse(decrypt(req.body.data));
    } catch (err) {
      res.status(400).json({ error: "Invalid encrypted data" });
      return; // 👈 Importante: cortar ejecución aquí
    }
  }
  next();
};

export const encryptResponseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  res.json = function (body: any) {
    const encrypted = encrypt(JSON.stringify(body));
    return originalJson.call(this, { data: encrypted });
  };
  next();
};
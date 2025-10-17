import { Request, Response, NextFunction } from "express";
import { encrypt, decrypt } from "../utils/Cryp";

export const decryptRequestMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log("🔒 Middleware de desencriptación - req.body:", req.body);
  if (req.body && typeof req.body.data === "string") {
    console.log("🔒 Desencriptando datos de la solicitud...");
    try {
      const decryptedData = decrypt(req.body.data);
      req.body = JSON.parse(decryptedData);
      console.log("✅ Datos desencriptados exitosamente:", req.body);
    } catch (err) {
      console.error("❌ Error de desencriptación:", err);
      res.status(400).json({ error: "Invalid encrypted data" });
      return;
    }
  } else {
    console.log(
      "⚠️ No hay datos encriptados para procesar o formato incorrecto"
    );
  }
  next();
};

export const encryptResponseMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;
  res.json = function (body: any) {
    const encrypted = encrypt(JSON.stringify(body));
    return originalJson.call(this, { data: encrypted });
  };
  next();
};

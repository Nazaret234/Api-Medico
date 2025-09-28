import { Request, Response, NextFunction } from "express";
import { encrypt, decrypt } from "./Crypto";

// Middleware para desencriptar el body entrante
export const decryptRequestMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body.data === "string") {
        try {
            req.body = JSON.parse(decrypt(req.body.data));
        } catch (err) {
            return res.status(400).json({ error: "Invalid encrypted data" });
        }
    }
    next();
};

// Middleware para encriptar la respuesta saliente
export const encryptResponseMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function (body: any) {
        const encrypted = encrypt(JSON.stringify(body));
        return originalJson.call(this, { data: encrypted });
    };
    next();
};

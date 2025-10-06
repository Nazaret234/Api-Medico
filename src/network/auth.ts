import { Router, Request, Response } from "express";
import { validateGoogleToken as ValidateGoogleToken } from "../services/passport";

const router: Router = Router();

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

router.post("/validateTokenGoogle", validateTokenGoogle);

export default router;

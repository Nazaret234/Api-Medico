import { Router, Response, Request } from "express";
import { authenticateJWT } from "../services/passport";

const router: Router = Router();

async function getUser(req: Request, res: Response) {
  const { user } = req;
  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Usuario no autenticado",
    });
  }
  return res.status(200).json({
    success: true,
    data: user,
  });
}

router.get("/me", authenticateJWT, getUser);

export default router;

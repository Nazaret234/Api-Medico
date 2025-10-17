import { Router, Response, Request } from "express";
import { authenticateJWT } from "../services/passport";
import { userController } from "../controllers/UserController";

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
router.post("/consent", userController.giveConsent.bind(userController));
router.post("/withdraw-consent", userController.withdrawConsent.bind(userController));
router.get("/datos", userController.exportUserData.bind(userController));
router.delete("/deleteData", userController.deleteData.bind(userController));

export default router;

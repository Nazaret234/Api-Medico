import { Router, Response, Request } from "express";

const router: Router = Router();

async function getUser(req: Request, res: Response) {
  // Con Zero Trust, el user ya viene validado por los middlewares
  const userInfo = (req as any).userInfo; // JWT payload
  const userRole = (req as any).userRole; // Permisos del rol

  if (!userInfo) {
    return res.status(401).json({
      success: false,
      error: "Usuario no autenticado",
    });
  }

  // Log de acceso (auditoría)
  console.info(
    `[USER_ACCESS] ${userInfo.email} accedió a su perfil desde IP: ${req.ip}`
  );

  return res.status(200).json({
    success: true,
    data: {
      id: userInfo.userId,
      email: userInfo.email,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      role: userInfo.roleName,
      permissions: {
        canGet: userRole.canGet,
        canPost: userRole.canPost,
        canPut: userRole.canPut,
        canPatch: userRole.canPatch,
        canDelete: userRole.canDelete,
      },
    },
  });
}

router.get("/me", getUser);

export default router;

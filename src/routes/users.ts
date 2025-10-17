import { Router } from "express";
import { userController } from "../controllers/UserController";
import { authenticateJWT } from "../services/passport";
import { authorize, authorizeOwnResource } from "../middlewares/authorization";

const router = Router();

// Aplicar autenticación JWT a todas las rutas de usuarios
router.use(authenticateJWT);

// Aplicar autorización basada en permisos a todas las rutas
router.use(authorize());

// Rutas de usuarios con Zero Trust
router.get("/", userController.getAllUsers.bind(userController)); // Solo users con canGet=true
router.get("/profile", userController.getProfile.bind(userController)); // Perfil propio
router.get(
  "/:id",
  authorizeOwnResource(),
  userController.getUserById.bind(userController)
); // Solo su propio recurso o admin
router.post("/", userController.createUser.bind(userController)); // Solo users con canPost=true
router.put(
  "/:id",
  authorizeOwnResource(),
  userController.updateUser.bind(userController)
); // Solo su propio recurso + canPut=true
router.delete(
  "/:id",
  authorizeOwnResource(),
  userController.deleteUser.bind(userController)
); // Solo su propio recurso + canDelete=true

export default router;

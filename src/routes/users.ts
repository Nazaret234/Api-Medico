import { Router } from "express";
import { userController } from "../controllers/UserController";

const router = Router();

// Rutas de usuarios
router.get("/", userController.getAllUsers.bind(userController));
router.get("/profile", userController.getProfile.bind(userController));
router.get("/:id", userController.getUserById.bind(userController));
router.post("/", userController.createUser.bind(userController));
router.put("/:id", userController.updateUser.bind(userController));
router.delete("/:id", userController.deleteUser.bind(userController));

export default router;

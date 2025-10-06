import { Application } from "express";
import routes from "./constants.json";
import {
  decryptRequestMiddleware,
  encryptResponseMiddleware,
} from "../middlewares/Encryp";
import userNetwork from "../network/user";
import authNetwork from "../network/auth";

// Nuevas rutas con Prisma
import healthRoutes from "./health";
import usersRoutes from "./users";
import patientsRoutes from "./patients";
import doctorsRoutes from "./doctors";
import appointmentsRoutes from "./appointments";

function router(app: Application) {
  // Rutas de health check (públicas)
  app.use("/api/health", healthRoutes);

  // Rutas públicas (sin cifrado)
  app.use("/api/users", usersRoutes);
  app.use("/api/patients", patientsRoutes);
  app.use("/api/doctors", doctorsRoutes);
  app.use("/api/appointments", appointmentsRoutes);

  // Rutas existentes con cifrado (mantener compatibilidad)
  app.use(
    routes.encryptedRoutes.users,
    decryptRequestMiddleware,
    encryptResponseMiddleware,
    userNetwork
  );
  app.use(
    routes.encryptedRoutes.login,
    decryptRequestMiddleware,
    encryptResponseMiddleware,
    authNetwork
  );
}

export default router;

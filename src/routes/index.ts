import { Application } from "express";
import routes from "./constants.json";
import {
  decryptRequestMiddleware,
  encryptResponseMiddleware,
} from "../middlewares/Encryp";
import { authenticateJWT } from "../services/passport";
import { authorize, authorizeOwnResource } from "../middlewares/authorization";
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

  // Rutas existentes con cifrado (mantener compatibilidad) + Zero Trust

  // Ruta de login (pública, solo cifrado)
  app.use(
    routes.encryptedRoutes.login,
    decryptRequestMiddleware,
    encryptResponseMiddleware,
    authNetwork
  );

  // Rutas de usuarios cifradas (requieren autenticación + autorización)
  app.use(
    routes.encryptedRoutes.users,
    decryptRequestMiddleware,
    authenticateJWT,
    authorize(),
    encryptResponseMiddleware,
    userNetwork
  );

  // Otras rutas cifradas con Zero Trust
  app.use(
    routes.encryptedRoutes.patients,
    decryptRequestMiddleware,
    authenticateJWT,
    authorize(),
    encryptResponseMiddleware,
    patientsRoutes
  );
  app.use(
    routes.encryptedRoutes.appointments,
    decryptRequestMiddleware,
    authenticateJWT,
    authorize(),
    encryptResponseMiddleware,
    appointmentsRoutes
  );
  app.use(
    routes.encryptedRoutes.doctors,
    decryptRequestMiddleware,
    authenticateJWT,
    authorize(),
    encryptResponseMiddleware,
    doctorsRoutes
  );

  // Rutas de auth cifradas para compatibilidad con app móvil (ahora en authNetwork)
  app.use(
    "/auth/encrypt",
    decryptRequestMiddleware,
    encryptResponseMiddleware,
    authNetwork
  );
}

export default router;

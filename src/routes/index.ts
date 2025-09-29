import { Application } from "express";
import routes from "./constants.json";
import {
  decryptRequestMiddleware,
  encryptResponseMiddleware,
} from "../middlewares/Encryp";
import userNetwork from "../network/user";
import authNetwork from "../network/auth";

function router(app: Application) {
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

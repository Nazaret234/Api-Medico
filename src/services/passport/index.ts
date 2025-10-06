import jwt from "jsonwebtoken";
import "dotenv/config";
import { OAuth2Client } from "google-auth-library";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const { GOOGLE_CLIENT_ID, SECRET_JWT_KEY } = process.env;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Validar token de Google, registrar usuario si no existe, y devolver JWT
const validateGoogleToken = async (token: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID || "",
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid Google token payload");
    }

    const { sub, email, given_name, family_name, picture } = payload;

    // Buscar si el usuario ya existe en la base de datos
    let user = await prisma.user.findUnique({
      where: { email: email || "" },
    });

    // Si no existe, crearlo
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email || "",
          firstName: given_name || "",
          lastName: family_name || "",
          role: "PATIENT",
        },
      });
    }

    // Generar JWT con los datos del usuario
    const tokenJWT = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      SECRET_JWT_KEY || "",
      { expiresIn: "7d" }
    );

    return tokenJWT;
  } catch (error) {
    console.error("Error validating Google token:", error);
    throw new Error("Invalid Google token");
  }
};

// Configurar estrategia JWT de Passport
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: SECRET_JWT_KEY || "",
    },
    (jwtPayload, done) => {
      if (jwtPayload) {
        return done(null, jwtPayload);
      } else {
        return done(null, false);
      }
    }
  )
);

const authenticateJWT = passport.authenticate("jwt", { session: false });

export { validateGoogleToken, authenticateJWT };

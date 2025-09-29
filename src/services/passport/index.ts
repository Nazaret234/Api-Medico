import jwt from "jsonwebtoken";
import "dotenv/config";
import { OAuth2Client } from "google-auth-library";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

const { GOOGLE_CLIENT_ID, SECRET_JWT_KEY } = process.env;

const client = new OAuth2Client(GOOGLE_CLIENT_ID); // si no funciona qui es

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

    const tokenJWT = jwt.sign(
      {
        userId: sub,
        email,
        firstName: given_name,
        lastName: family_name,
        picture,
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

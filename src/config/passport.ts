import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import prisma from "./prisma"; 
import bcrypt from "bcrypt";

passport.use(
  new LocalStrategy(
    { usernameField: "username" },
    async (username: string, password: string, done: any) => {
      try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
          return done(null, false, { message: "No such username." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as any).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
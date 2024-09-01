import express from "express";
import passport from "passport";
import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import { User } from "@prisma/client";

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log(username, email, password);

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await prisma.user.findUnique({where: {email}});
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,

      }
    })
    res.status(201).json({ message: 'User registered successfully'});
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err: Error, user: User, info: any) => {
    if (err) {
      return res.status(500).json({ message: "Login Failed: Unknown Error" });
    }
    if (!user) {
      return res.status(400).json({ message: info.message || "Login Failed" });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Login Failed: Unknown Error" });
      }
      return res.status(200).json({ message: "Logged in", user: req.user });
    });
  })(req, res, next);
});


router.post('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

export default router;
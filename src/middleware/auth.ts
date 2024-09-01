import passport = require("passport");
import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";

export default (req: Request, res: Response, next: NextFunction) => {
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};
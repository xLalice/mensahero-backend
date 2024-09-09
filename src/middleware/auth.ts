import { Request, Response, NextFunction } from "express";

export default (req: Request, res: Response, next: NextFunction) => {
  
  if (req.isAuthenticated()) {
    return next();
  }
  console.log(req.user);
  res.status(401).json({ message: 'Unauthorized' });
};
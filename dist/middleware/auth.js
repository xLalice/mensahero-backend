"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    console.log(req.user);
    res.status(401).json({ message: 'Unauthorized' });
};

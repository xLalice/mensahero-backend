"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const prisma_1 = __importDefault(require("../config/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = express_1.default.Router();
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await prisma_1.default.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            }
        });
        res.status(201).json({ message: 'User registered successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
router.post('/login', (req, res, next) => {
    passport_1.default.authenticate('local', (err, user, info) => {
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
router.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("../middleware/multer"));
const auth_1 = __importDefault(require("../middleware/auth"));
const prisma_1 = __importDefault(require("../config/prisma"));
const cloudinary_1 = require("../config/cloudinary");
const router = express_1.default.Router();
router.get("/friends", auth_1.default, async (req, res) => {
    try {
        const userId = req.user.id;
        const userWithFriends = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                friends: {
                    select: {
                        id: true,
                        username: true,
                        profilePic: true,
                    },
                },
                friendOf: {
                    select: {
                        id: true,
                        username: true,
                        profilePic: true,
                    },
                },
            },
        });
        if (!userWithFriends) {
            return res.status(404).json({ error: "User not found" });
        }
        const allFriends = [...userWithFriends.friends, ...userWithFriends.friendOf];
        const uniqueFriends = Array.from(new Set(allFriends.map(f => f.id)))
            .map(id => allFriends.find(f => f.id === id));
        res.json({ friends: uniqueFriends });
    }
    catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});
router.get('/potential-friends', auth_1.default, async (req, res) => {
    try {
        const userId = req.user.id;
        const users = await prisma_1.default.user.findMany({
            where: {
                id: { not: userId },
                AND: [
                    {
                        friends: {
                            none: {
                                id: userId,
                            },
                        },
                    },
                    {
                        friendOf: {
                            none: {
                                id: userId,
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                username: true,
                profilePic: true,
            },
        });
        if (!users.length) {
            return res.status(404).json({ error: "No potential friends found" });
        }
        ``;
        res.json({ potentialFriends: users });
    }
    catch (error) {
        console.error("Error fetching potential friends:", error);
        res.status(500).json({ error: 'Error fetching potential friends' });
    }
});
router.post('/add-friend/', auth_1.default, async (req, res) => {
    try {
        const userId = req.user.id;
        const friendId = req.body.friendId;
        if (userId === friendId) {
            return res.status(400).json({ error: "You can't add yourself as a friend" });
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                friends: {
                    connect: { id: friendId }
                },
            },
            include: {
                friends: true
            }
        });
        res.json({ message: "Friend added successfully", user: updatedUser });
    }
    catch (error) {
        console.error("Error adding friend:", error);
        res.status(500).json({ error: 'Error adding friend' });
    }
});
router.put("/:id/profile-picture", auth_1.default, multer_1.default.single("profilePic"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const result = await (0, cloudinary_1.imageUploader)(req.file.buffer, "/profile_pictures", "");
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                profilePic: result.secure_url,
            },
            select: {
                username: true,
                profilePic: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Server error:", error);
        res
            .status(500)
            .json({ message: "Server error", error: error.toString() });
    }
});
// Get current user's profile
router.get("/profile", auth_1.default, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findFirst({
            where: { id: req.user.id },
            select: { username: true, profilePic: true, email: true },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
// Get user by ID
router.get("/:id", auth_1.default, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { username: true, profilePic: true, password: false },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
// Update user by ID
router.put("/:userId", auth_1.default, async (req, res) => {
    try {
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                ...req.body,
            },
            select: { password: false, username: true, profilePic: true },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
// Get all users
router.get("/", auth_1.default, async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            where: { NOT: { id: req.user.id } },
            select: { id: true, profilePic: true, username: true },
        });
        res.json(users);
    }
    catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.default = router;

import express from "express";
import upload from "../middleware/multer";
import auth from "../middleware/auth";
import prisma from "../config/prisma";
import {imageUploader} from "../config/cloudinary";

const router = express.Router();

router.get("/friends", auth, async (req, res) => {
 
  try {
    const userId = (req.user as any).id;

    const userWithFriends = await prisma.user.findUnique({
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
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});


router.get('/potential-friends', auth, async (req, res) => {
  try {
    const userId = (req.user as any).id;

    const users = await prisma.user.findMany({
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
``
    res.json({ potentialFriends: users });
  } catch (error) {
    console.error("Error fetching potential friends:", error);
    res.status(500).json({ error: 'Error fetching potential friends' });
  }
});

router.post('/add-friend/', auth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const friendId = req.body.friendId;

    if (userId === friendId) {
      return res.status(400).json({ error: "You can't add yourself as a friend" });
    }

    const updatedUser = await prisma.user.update({
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
  } catch (error) {
    console.error("Error adding friend:", error);
    res.status(500).json({ error: 'Error adding friend' });
  }
});

router.put(
  "/:id/profile-picture",
  auth,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const result = await imageUploader(req.file.buffer, "/profile_pictures", "")

      const user = await prisma.user.update({
        where: { id: (req.user as any).id },
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
    } catch (error: any) {
      console.error("Server error:", error);
      res
        .status(500)
        .json({ message: "Server error", error: error.toString() });
    }
  }
);

// Get current user's profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: (req.user as any).id },
      select: { password: false, username: true, profilePic: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req.user as any).id },
      select: { username: true, profilePic: true, password: false },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update user by ID
router.put("/:userId", auth, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: (req.user as any).id },
      data: {
        ...req.body,
      },
      select: { password: false, username: true, profilePic: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all users
router.get("/", auth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {NOT: {id: (req.user as any).id}},
      select: { id: true  , profilePic: true, username: true },
    });
    res.json(users);
  } catch (error: any) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



export default router;

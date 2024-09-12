import express from "express";
import auth from "../middleware/auth";
import prisma from "../config/prisma";
import upload from "../middleware/multer";
import { imageUploader } from "../config/cloudinary";

const router = express.Router();

router.get("/:conversationId", auth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const conversationId = parseInt(req.params.conversationId);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePic: true,
              },
            },
          },
        },
        messages: {
          include: {
            sender: false
          },
          orderBy: {
            timestamp: "asc",
          },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isUserInConversation = conversation.participants.some(
      (participant) => participant.userId === userId
    );

    if (!isUserInConversation) {
      return res
        .status(401)
        .json({ message: "User not part of the conversation" });
    }

    const isGroupChat = conversation._count.participants > 2;

    const participants = conversation.participants.map((participant) => ({
      id: participant.user.id,
      username: participant.user.username,
      profilePic: participant.user.profilePic,
    }));

    res.json({
      id: conversation.id,
      isGroupChat,
      groupName: isGroupChat ? conversation.groupName : null,
      groupImage: isGroupChat ? conversation.groupImage : null,
      participants,
      messages: conversation.messages
    });
  } catch (error: any) {
    console.error("Error fetching conversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all conversations for the current user
router.get("/", auth, async (req, res) => {
  try {
    const currentUserId = (req.user as any).id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: currentUserId,
          },
        },
      },
      include: {
        lastMessage: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [
        {
          lastMessage: {
            timestamp: "desc",
          },
        },
        {
          createdAt: "desc",
        },
      ],
    });


    const formattedConversations = conversations.map((conversation) => {
      const otherParticipants = conversation.participants
        .filter((participant) => participant.userId !== currentUserId)
        .map((participant) => ({
          userId: participant.user.id,
          username: participant.user.username,
          profilePic: participant.user.profilePic,
        }));

      const isGroupChat = conversation.participants.length > 2;
      if (!isGroupChat) {
        return {
          id: conversation.id,
          profilePic: otherParticipants[0].profilePic,
          username: otherParticipants[0].username,
          lastMessage: conversation.lastMessage,
        };
      } else {
        return {
          id: conversation.id,
          participants: otherParticipants,
          groupName: conversation.groupName,
          groupImage: conversation.groupImage,
          lastMessage: conversation.lastMessage,
        };
      }
    });

    res.json(formattedConversations);
  } catch (error: any) {
    console.error("Error fetching conversations:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// Create a new conversation
router.post("/", auth, upload.single("groupImage"), async (req, res) => {
  try {

    const participants = JSON.parse(req.body.participants); 
    const groupName = req.body.groupName;

    if (!Array.isArray(participants)) {
      return res
        .status(400)
        .json({ message: "Participants should be an array" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              every: {
                userId: {
                  in: participants,
                },
              },
            },
          },
          {
            participants: {
              none: {
                userId: {
                  notIn: participants,
                },
              },
            },
          },
        ],
      },
      include: {
        participants: true,
      },
    });

    if (
      existingConversation &&
      existingConversation.participants.length === participants.length
    ) {
      return res.status(200).json(existingConversation);
    }

    // Handle file upload
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await imageUploader(
      req.file?.buffer,
      "/profile-pictures",
      ""
    );

    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          create: participants.map((userId: number) => ({
            userId,
          })),
        },
        groupImage: result.secure_url,
        groupName: groupName,
      },
      include: {
        participants: true,
      },
    });

    return res.status(201).json(newConversation);
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

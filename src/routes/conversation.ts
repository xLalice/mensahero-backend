import express from "express";
import auth from "../middleware/auth";
import prisma from "../config/prisma";

const router = express.Router();

router.get('/:conversationId', auth, async (req, res) => {
	try {
		const userId = (req.user as any).id;
		const conversation = await prisma.conversation.findUnique({
			where: { id: parseInt(req.params.conversationId) },
			include: {
				participants: true,
				messages: {
					orderBy: {
						timestamp: "asc"
					}
				}
			}
		});
		if (!conversation) {
			return res.status(404).json({ message: 'Conversation not found' });
		}

		const filtered = conversation.participants.find((participant) => participant.id !== userId)
		res.json(conversation);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Get conversations
router.get('/user/:currentUserId', auth, async (req, res) => {
	try {
		const conversations = await prisma.conversation.findMany({
			where: {
				participants: {
					some: {
						id: parseInt(req.params.currentUserId)
					}
				}
			},
			include: {
				lastMessage: true,
				participants: true
			},
			orderBy: {
				lastMessage: {
					timestamp: "desc"
				}
			}
		})
		res.json(conversations);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Create conversation
router.post('/', auth, async (req, res) => {
	const participants = req.body.participants.map((item: any) => parseInt(item));  
	
	if (!req.user) return;

	try {
		let existingConversation = await prisma.conversation.findFirst({
			where: {
				participants: {
					every: {
						id: {
							in: participants
						}
					}
				}
			}
		})
		
		if (existingConversation) {
			return res.status(200).json(existingConversation)
		}

		const newConversation = await prisma.conversation.create({
			data: {
				participants: {
					connect: participants.map((id: number) => ({ id }))
				}
			}
		});

		return res.status(201).json(newConversation);
	} catch (error: any) {
		console.error('Error creating conversation:', error);  
		res.status(500).json({ message: error.message });
	}
});

export default router;

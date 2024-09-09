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
				participants: {
					include: {
						user: {
							select: {
								id: true,
								username: true,
								profilePic: true
							}
						}
					}
				},
				messages: {
					include: {
						sender: {
							select: {
								username: true,
								profilePic: true
							}
						}
					},
					orderBy: {
						timestamp: 'asc',
					},
				},
			},
		});

		if (!conversation) {
			return res.status(404).json({ message: 'Conversation not found' });
		}
		const participantIds = conversation.participants.map(participant => participant.userId);
		if (!participantIds.includes(userId)) {
			return res.status(401).json({ message: 'User not part of conversation' });
		}
		
		const participants = conversation.participants.map(p => (p.user));


		console.log("Conversation", {conversation: {
			id: conversation.id,
			participants,
			messages: conversation.messages
		}});
		
		res.json({
			id: conversation.id,
			participants,
			messages: conversation.messages,
		});

	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});


// Get conversations
router.get('/user/:currentUserId', auth, async (req, res) => {
    try {
        const currentUserId = parseInt(req.params.currentUserId);

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: currentUserId
                    }
                }
            },
            include: {
                lastMessage: true,
                participants: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: [
                {
                    lastMessage: {
						timestamp: "desc"
					}
                },
                {
                    createdAt: 'desc'
                }
            ]
        });

        const formattedConversations = conversations.map(conversation => {
            const otherParticipant = conversation.participants.find(participant => participant.userId !== currentUserId);

            return {
                id: conversation.id,
                username: otherParticipant?.user.username,
                profilePic: otherParticipant?.user.profilePic,
				userId: otherParticipant?.user.id,
                lastMessage: conversation.lastMessage,
				
            };
        });
        res.json(formattedConversations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});



router.post('/', auth, async (req, res) => {
	const participants = req.body.participants.map((item: any) => parseInt(item));
  
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  
	try {
	  // Check if a conversation with the given participants already exists
	  let existingConversation = await prisma.conversation.findFirst({
		where: {
		  AND: [
			{
			  participants: {
				every: {
				  userId: {
					in: participants
				  }
				}
			  }
			},
			{
			  participants: {
				none: {
				  userId: {
					notIn: participants
				  }
				}
			  }
			}
		  ]
		},
		include: {
		  participants: true
		}
	  });
  
	  if (existingConversation) {
		return res.status(200).json(existingConversation);
	  }
  
  
	  const newConversation = await prisma.conversation.create({
		data: {
		  participants: {
			create: participants.map((userId: number) => ({
			  userId
			}))
		  }
		},
		include: {
		  participants: true
		}
	  });
  
	  return res.status(201).json(newConversation);
	} catch (error: any) {
	  console.error('Error creating conversation:', error);  
	  res.status(500).json({ message: error.message });
	}
  });
  
  

export default router;

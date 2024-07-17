const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('./src/models/User');
const Conversation = require('./src/models/Conversation');
const Message = require('./src/models/Message');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);
const NUM_USERS = 10;
const NUM_CONVERSATIONS = 20;
const MAX_MESSAGES_PER_CONVERSATION = 50;

async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    // Create users
    const users = [];
    for (let i = 0; i < NUM_USERS; i++) {
      const user = new User({
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: 'password123', // This will be hashed by the pre-save hook
        profilePic: faker.image.avatar(),
      });
      await user.save();
      users.push(user);
    }

    // Create conversations and messages
    for (let i = 0; i < NUM_CONVERSATIONS; i++) {
      // Select two random users for each conversation
      const [user1, user2] = faker.helpers.arrayElements(users, 2);
      
      const conversation = new Conversation({
        participants: [user1._id, user2._id],
      });

      const messages = [];
      const numMessages = faker.number.int({ min: 1, max: MAX_MESSAGES_PER_CONVERSATION });
      for (let j = 0; j < numMessages; j++) {
        const sender = faker.helpers.arrayElement([user1, user2]);
        const message = new Message({
          conversationId: conversation._id,
          senderId: sender._id,
          content: faker.lorem.sentence(),
          timestamp: faker.date.past(),
        });
        await message.save();
        messages.push(message);
      }

      // Sort messages by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);

      // Set the last message
      conversation.lastMessage = messages[messages.length - 1]._id;
      conversation.createdAt = messages[0].timestamp;

      await conversation.save();
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.disconnect();
  }
}

seedDatabase();
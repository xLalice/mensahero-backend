const express = require('express');
const mongoose = require('mongoose');
const passport = require('./src/config/passport');
const cors = require('cors');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));
app.use(express.json());
app.use(passport.initialize());

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

const authRoutes = require('./src/routes/auth');
const messageRoutes = require('./src/routes/messages');
const userRoutes = require('./src/routes/users');
const conversationRoutes = require('./src/routes/conversation');

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
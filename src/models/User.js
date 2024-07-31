const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { transformAuthInfo } = require('passport');

const userSchema = new mongoose.Schema({
    username: { 
      type: String,
      required: true, 
      unique: true,
      trim: true,
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true
    },
    password: { 
      type: String, 
      required: true 
    },
    profilePic: { 
      type: String, 
      default: 'https://reshttps://i.sstatic.net/l60Hf.png.cloudinary.com/dq9j3qjg3/image/upload/v1666668106/mensahero/ProfilePic_dq9j3q.png' 
    },
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
  }, { timestamps: true });

userSchema.pre('save', async function(next) {
  const user = this;
  if (!user.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(user.password, salt);
  user.password = hash;
  next();
});

userSchema.virtual('isOnline').get(function() {
  return this.lastActive > Date.now() - 5 * 60 * 1000;
});

userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };
  
  module.exports = mongoose.model('User', userSchema);
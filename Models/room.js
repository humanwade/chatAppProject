const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      default: null, 
    },
    participantsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, 
  }
);

roomSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

roomSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Room', roomSchema);
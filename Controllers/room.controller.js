const Room = require("../Models/room");

const roomController = {};

// get All chat rooms
roomController.getAllRooms = async () => {
  // Never expose hashed room passwords to clients
  const roomList = await Room.find({}).select("-password");
  return roomList;
};

// create chat room
roomController.createRoom = async (name, password = null) => {
  const newRoom = await Room.create({ name, password: password || null });
  return newRoom;
};

// check duplicated 
roomController.createRoomIfNotExists = async (name, password = null) => {
  const existing = await Room.findOne({ name });
  if (!existing) {
    const created = await Room.create({ name, password: password || null });
    return created;
  }
  return existing;
};

// verify room password (used before joining a room)
roomController.checkPassword = async (name, candidatePassword) => {
  const room = await Room.findOne({ name });
  if (!room) throw new Error("Room not found");

  // If room has no password, allow join
  if (!room.password) return true;

  // Password-protected rooms require a candidate password
  if (!candidatePassword) return false;

  return await room.comparePassword(candidatePassword);
};

module.exports = roomController;

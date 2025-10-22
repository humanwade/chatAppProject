const Room = require("../Models/room");

const roomController = {};

// get All chat rooms
roomController.getAllRooms = async () => {
  const roomList = await Room.find({});
  return roomList;
};

// create chat room
roomController.createRoom = async (name) => {
  const newRoom = await Room.create({ name });
  return newRoom;
};

// check duplicated 
roomController.createRoomIfNotExists = async (name) => {
  const existing = await Room.findOne({ name });
  if (!existing) {
    const created = await Room.create({ name });
    return created;
  }
  return existing;
};

module.exports = roomController;
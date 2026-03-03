const Room = require("../Models/room");

const roomController = {};

// get All chat rooms
roomController.getAllRooms = async () => {
  // Never expose hashed room passwords to clients; return a safe summary.
  const rooms = await Room.find({}).select(
    "name password participantsCount createdAt updatedAt"
  );
  return rooms.map((room) => ({
    _id: room._id,
    name: room.name,
    hasPassword: Boolean(room.password),
    participantsCount: room.participantsCount ?? 0,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  }));
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

// set participants count based on current sockets
// and optionally delete room if empty (except Guidelines)
roomController.setParticipants = async (name, count) => {
  if (!name) return { deleted: false, room: null };

  const room = await Room.findOne({ name });
  if (!room) return { deleted: false, room: null };

  const prevCount = room.participantsCount ?? 0;
  const safeCount = Math.max(0, Number.isFinite(count) ? count : 0);
  room.participantsCount = safeCount;
  await room.save();

  // Delete only when we actually transition to 0 (last member left).
  if (prevCount > 0 && safeCount === 0 && room.name !== "Guidelines") {
    await Room.deleteOne({ _id: room._id });
    return { deleted: true, room: null };
  }

  return { deleted: false, room };
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

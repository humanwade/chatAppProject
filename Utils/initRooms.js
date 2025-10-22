const Room = require("../Models/room");

const initRooms = async () => {
  try {
    const existingRooms = await Room.find();
    if (existingRooms.length === 0) {
      await Room.create([
        { name: "Web Development" },
        { name: "Java Team Project" },
        { name: "Questions" },
      ]);
      console.log("Rooms are generated");
    } else {
      console.log("Rooms are already existed");
    }
  } catch (err) {
    console.error("Error :", err);
  }
};

module.exports = initRooms;
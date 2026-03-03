const Room = require("../Models/room");
const Chat = require("../Models/chat");

const initRooms = async () => {
  try {
    // Remove legacy Korean default room
    const deleted = await Room.deleteOne({ name: "공지방" });
    if (deleted.deletedCount > 0) {
      console.log("Legacy room '공지방' has been removed.");
    }

    // Ensure default notice room exists
    let noticeRoom = await Room.findOne({ name: "Guidelines" });

    if (!noticeRoom) {
      noticeRoom = await Room.create({ name: "Guidelines", password: null });

      // Seed basic guideline messages as system messages
      await Chat.create([
        {
          chat: "Welcome! This room is for announcements and usage guidelines.",
          room: "Guidelines",
          user: { id: null, name: "system" },
        },
        {
          chat: "1) Please communicate with mutual respect.\n2) Do not share any personal information.\n3) No advertising or spamming allowed.",
          room: "Guidelines",
          user: { id: null, name: "system" },
        },
      ]);

      console.log("Default notice room 'Guidelines' has been created.");
    } else {
      console.log("Default notice room 'Guidelines' already exists.");
    }
  } catch (err) {
    console.error("Error during initRooms:", err);
  }
};

module.exports = initRooms;
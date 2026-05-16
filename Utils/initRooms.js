const Room = require("../Models/room");
const Chat = require("../Models/chat");

const GUIDELINES_NAME = "Guidelines";

const GUIDELINES_SEED_CHATS = [
  "Welcome! This room is for announcements and usage guidelines.",
  "1) Please communicate with mutual respect. 2) Do not share any personal information. 3) No advertising or spamming allowed.",
  "Join with a password or create a private room to start chatting.",
];

/** One-time text updates for installs that already had Guidelines + legacy seed copy. */
async function migrateGuidelinesAnnouncements() {
  const legacySecond =
    "1) Please communicate with mutual respect.\n2) Do not share any personal information.\n3) No advertising or spamming allowed.";
  await Chat.updateMany(
    { room: GUIDELINES_NAME, "user.name": "system", chat: legacySecond },
    { $set: { chat: GUIDELINES_SEED_CHATS[1] } }
  );

  const third = GUIDELINES_SEED_CHATS[2];
  const hasThird = await Chat.exists({ room: GUIDELINES_NAME, chat: third });
  if (!hasThird) {
    await Chat.create({
      chat: third,
      room: GUIDELINES_NAME,
      user: { id: null, name: "system" },
    });
  }
}

/** Remove duplicate system rows that match the same seed text (keeps oldest). */
async function dedupeGuidelinesSeedMessages() {
  for (const text of GUIDELINES_SEED_CHATS) {
    const rows = await Chat.find({
      room: GUIDELINES_NAME,
      "user.name": "system",
      chat: text,
    }).sort({ createdAt: 1 });

    if (rows.length <= 1) continue;

    const [, ...extras] = rows;
    const ids = extras.map((d) => d._id);
    const deleted = await Chat.deleteMany({ _id: { $in: ids } });
    if (deleted.deletedCount > 0) {
      console.log(
        `[initRooms] Guidelines: removed ${deleted.deletedCount} duplicate(s) for seed line starting "${text.slice(0, 36)}…"`
      );
    }
  }
}

const initRooms = async () => {
  try {
    // Remove legacy Korean default room
    const deleted = await Room.deleteOne({ name: "공지방" });
    if (deleted.deletedCount > 0) {
      console.log("Legacy room '공지방' has been removed.");
    }

    // Ensure default notice room exists
    let noticeRoom = await Room.findOne({ name: GUIDELINES_NAME });

    if (!noticeRoom) {
      noticeRoom = await Room.create({ name: GUIDELINES_NAME, password: null });

      await Chat.create(
        GUIDELINES_SEED_CHATS.map((chat) => ({
          chat,
          room: GUIDELINES_NAME,
          user: { id: null, name: "system" },
        }))
      );

      console.log("Default notice room 'Guidelines' has been created.");
    } else {
      console.log("Default notice room 'Guidelines' already exists.");
    }

    await migrateGuidelinesAnnouncements();
    await dedupeGuidelinesSeedMessages();
  } catch (err) {
    console.error("Error during initRooms:", err);
  }
};

module.exports = initRooms;
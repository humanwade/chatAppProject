require("dotenv").config();
const mongoose = require("mongoose");
const Room = require("./Models/room");

async function main() {
  const uri = process.env.MONGO_URI || process.env.DB;
  if (!uri) {
    console.error("Missing MONGO_URI/DB env for Mongo connection.");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const targetName = "Guide LIne";

  const totalBefore = await Room.countDocuments();
  const allBefore = await Room.find({}, "name");
  console.log("TOTAL BEFORE:", totalBefore);
  console.log(
    "NAMES BEFORE:",
    allBefore.map((r) => r.name)
  );

  // Delete all rooms except the target
  const toDelete = await Room.find({ name: { $ne: targetName } }, "name");
  console.log(
    "DELETING ROOMS:",
    toDelete.map((r) => r.name)
  );
  await Room.deleteMany({ name: { $ne: targetName } });

  // Ensure target room exists
  let guide = await Room.findOne({ name: targetName });
  if (!guide) {
    guide = await Room.create({ name: targetName, password: null });
    console.log("CREATED GUIDE ROOM");
  }

  const remaining = await Room.find({}, "name");
  console.log(
    "REMAINING ROOMS:",
    remaining.map((r) => r.name)
  );
  console.log("TOTAL AFTER:", remaining.length);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("manageRooms error:", err);
  process.exit(1);
});


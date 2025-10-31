const { createServer } = require("http");
const app = require("./app");
const { Server } = require("socket.io");
require("dotenv").config();
const initRooms = require("./Utils/initRooms");
require("./Models/room");

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

initRooms();

require("./Utils/io")(io);

httpServer.listen(process.env.PORT, () => {
  console.log("server listening on port", process.env.PORT);
});

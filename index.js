const { createServer } = require("http");
const path = require("path");
const app = require("./app");
const { Server } = require("socket.io");
// Always load repo-root .env (not chatapp-client/.env) so ADMIN_PASSWORD etc. apply to this server.
require("dotenv").config({ path: path.join(__dirname, ".env") });
const initRooms = require("./Utils/initRooms");
require("./Models/room");

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  }
});

initRooms();

require("./Utils/io")(io);

httpServer.listen(process.env.PORT, () => {
  console.log("server listening on port", process.env.PORT);
});

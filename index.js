const { createServer } = require("http");
const app = require("./app");
const { Server } = require("socket.io");
require("dotenv").config();
const initRooms = require("./Utils/initRooms");
require("./Models/room");


const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://132.145.108.97:3001", 
        methods: ["GET", "POST"]
    }
});

initRooms();

require("./Utils/io")(io);

httpServer.listen(process.env.PORT, () => {
    console.log("server listening on port", process.env.PORT);
});
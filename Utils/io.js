const chatController = require("../Controllers/chat.controller");
const userController = require("../Controllers/user.controller");
const roomController = require("../Controllers/room.controller");

module.exports = function (io) {
    io.on("connection", async (socket) => {
        console.log("Client connected:", socket.id);

        try {
            const rooms = await roomController.getAllRooms();
            socket.emit("roomList", rooms);
        } catch (error) {
            console.error("roomList error:", error);
        }

        socket.on("login", async (userName, cb) => {
            const user = await userController.saveUser(userName, socket.id);
            cb({ ok: true, data: user });
        });

        socket.on("joinRoom", async (roomName, cb) => {
            try {
                const user = await userController.checkUser(socket.id);

                await socket.join(roomName);
                await userController.updateRoom(socket.id, roomName);

                const chats = await chatController.getChatsByRoom(roomName);
                socket.emit("chatHistory", chats);

                const enterMsg = {
                    chat: `${user.name} has entered the room`,
                    user: { id: null, name: "system" },
                };
                io.to(roomName).emit("message", enterMsg);

                cb({ ok: true });
            } catch (err) {
                console.error("joinRoom error:", err);
                cb({ ok: false, error: err.message });
            }
        });

        socket.on("leaveRoom", async (cb) => {
            try {
                const user = await userController.checkUser(socket.id);

                if (user.room) {
                    const roomName = user.room;
                    await socket.leave(roomName);

                    const leaveMessage = {
                        chat: `${user.name} has left the room`,
                        user: { id: null, name: "system" },
                    };

                    io.to(roomName).emit("message", leaveMessage);

                    user.room = null;
                    await user.save();

                    cb({ ok: true });
                } else {
                    cb({ ok: false, error: "User not in any room." });
                }
            } catch (err) {
                cb({ ok: false, error: err.message });
            }
        });

        socket.on("sendMessage", async (message, cb) => {
            try {
                const user = await userController.checkUser(socket.id);
                const newMessage = await chatController.saveChat(message, user);
                io.to(user.room).emit("message", newMessage);
                cb({ ok: true });
            } catch (error) {
                cb({ ok: false, error: error.message });
            }
        });

        socket.on("disconnect", async () => {
            try {
                const user = await userController.checkUser(socket.id);

                if (user.room) {
                    const systemMessage = {
                        chat: `${user.name} has left the room`,
                        user: { id: null, name: "system" },
                    };
                    io.to(user.room).emit("message", systemMessage);
                }

                user.online = false;
                user.token = null;
                await user.save();

                console.log(`${user.name} disconnected`);
            } catch (error) {
                console.error("disconnect error:", error.message);
            }
        });
    });
};
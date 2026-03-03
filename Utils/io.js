const chatController = require("../Controllers/chat.controller");
const userController = require("../Controllers/user.controller");
const roomController = require("../Controllers/room.controller");
const Room = require("../Models/room");

module.exports = function (io) {
    const getRoomSocketCount = async (roomName) => {
        if (!roomName) return 0;
        const socketIds = await io.in(roomName).allSockets();
        return socketIds.size;
    };

    const syncRoomParticipants = async (roomName) => {
        try {
            if (!roomName) return { roomName, count: 0, deleted: false };
            const count = await getRoomSocketCount(roomName);
            const { deleted } = await roomController.setParticipants(roomName, count);
            console.log(`[rooms] ${roomName} participants=${count} deleted=${deleted}`);
            return { roomName, count, deleted };
        } catch (err) {
            console.error("syncRoomParticipants error:", err);
            return { roomName, count: 0, deleted: false, error: err?.message };
        }
    };

    const getRoomsSnapshot = async () => {
        return roomController.getAllRooms();
    };

    const broadcastRooms = async () => {
        const snapshot = await getRoomsSnapshot();
        io.emit("roomList", snapshot);
        io.emit("roomsUpdated", snapshot);
    };

    io.on("connection", async (socket) => {
        console.log("Client connected:", socket.id);

        try {
            // Best-effort: refresh counts from live sockets (handles stale DB after restarts)
            const rooms = await Room.find({}, "name");
            await Promise.all(rooms.map((r) => syncRoomParticipants(r.name)));

            const snapshot = await getRoomsSnapshot();
            socket.emit("roomList", snapshot);
            socket.emit("roomsUpdated", snapshot);
        } catch (error) {
            console.error("roomList error:", error);
        }

        socket.on("login", async (userName, cb) => {
            const user = await userController.saveUser(userName, socket.id);
            cb({ ok: true, data: user });
        });

        socket.on("createRoom", async (roomName, password, cb) => {
            if (typeof password === "function") {
                cb = password;
                password = undefined;
            }
            const safeCb = typeof cb === "function" ? cb : () => {};

            try {
                const name = typeof roomName === "string" ? roomName.trim() : "";
                if (!name) return safeCb({ ok: false, error: "Room name is required." });

                const existing = await Room.findOne({ name }).select("_id");
                if (existing) return safeCb({ ok: false, error: "Room already exists." });

                const created = await roomController.createRoom(name, password);

                await broadcastRooms();

                safeCb({
                    ok: true,
                    data: {
                        _id: created._id,
                        name: created.name,
                        hasPassword: Boolean(created.password),
                    },
                });
            } catch (err) {
                console.error("createRoom error:", err);
                safeCb({ ok: false, error: err.message });
            }
        });

        socket.on("joinRoom", async (roomName, password, cb) => {
            if (typeof password === "function") {
                cb = password;
                password = undefined;
            }
            const safeCb = typeof cb === "function" ? cb : () => {};

            try {
                const targetRoom = typeof roomName === "string" ? roomName.trim() : "";
                const passwordOk = await roomController.checkPassword(targetRoom, password);
                if (!passwordOk) {
                    return safeCb({ ok: false, error: "Invalid password." });
                }

                const user = await userController.checkUser(socket.id);

                const previousRoom = user.room;
                if (previousRoom && previousRoom !== targetRoom) {
                    await socket.leave(previousRoom);
                    await syncRoomParticipants(previousRoom);
                }

                await socket.join(targetRoom);
                await userController.updateRoom(socket.id, targetRoom);
                await syncRoomParticipants(targetRoom);

                const chats = await chatController.getChatsByRoom(targetRoom);
                socket.emit("chatHistory", chats);

                const enterMsg = {
                    chat: `${user.name} has entered the room`,
                    user: { id: null, name: "system" },
                };
                io.to(targetRoom).emit("message", enterMsg);

                await broadcastRooms();

                safeCb({ ok: true });
            } catch (err) {
                console.error("joinRoom error:", err);
                safeCb({ ok: false, error: err.message });
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
                    await syncRoomParticipants(roomName);
                    await broadcastRooms();

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

                const roomName = user.room;

                if (roomName) {
                    const systemMessage = {
                        chat: `${user.name} has left the room`,
                        user: { id: null, name: "system" },
                    };
                    io.to(roomName).emit("message", systemMessage);
                }

                user.online = false;
                user.token = null;
                user.room = null;
                await user.save();
                if (roomName) {
                    await syncRoomParticipants(roomName);
                }

                await broadcastRooms();

                console.log(`${user.name} disconnected`);
            } catch (error) {
                console.error("disconnect error:", error.message);
            }
        });

        // ---- WebRTC signaling (Simple-peer) ----
        socket.on("video:invite", async ({ roomName }) => {
            try {
                const rn = typeof roomName === "string" ? roomName.trim() : "";
                if (!rn) return;
                let fromName = "Someone";
                try {
                    const u = await userController.checkUser(socket.id);
                    fromName = u?.name || fromName;
                } catch (_) {}
                socket.to(rn).emit("video:invite", {
                    roomName: rn,
                    fromId: socket.id,
                    fromName,
                });
            } catch (err) {
                console.error("video:invite error:", err);
            }
        });

        socket.on("video:join", async ({ roomName }) => {
            try {
                const rn = typeof roomName === "string" ? roomName.trim() : "";
                if (!rn) return;

                const videoRoom = `video:${rn}`;
                socket.join(videoRoom);
                socket.data.videoRoom = videoRoom;
                socket.data.videoRoomName = rn;

                const ids = await io.in(videoRoom).allSockets();
                const allIds = [...ids];
                const others = allIds.filter((id) => id !== socket.id);

                const peers = await Promise.all(
                    others.map(async (id) => {
                        try {
                            const u = await userController.checkUser(id);
                            return { socketId: id, name: u?.name };
                        } catch (_) {
                            return { socketId: id, name: "Guest" };
                        }
                    })
                );

                socket.emit("video:peers", { roomName: rn, peers });
            } catch (err) {
                console.error("video:join error:", err);
            }
        });

        socket.on("video:signal", async ({ roomName, to, signal }) => {
            try {
                const rn = typeof roomName === "string" ? roomName.trim() : "";
                if (!rn || !to || !signal) return;

                let fromName = "Guest";
                try {
                    const u = await userController.checkUser(socket.id);
                    fromName = u?.name || fromName;
                } catch (_) {}

                io.to(to).emit("video:signal", {
                    roomName: rn,
                    from: socket.id,
                    fromName,
                    signal,
                });
            } catch (err) {
                console.error("video:signal error:", err);
            }
        });

        socket.on("video:leave", async ({ roomName }) => {
            try {
                const rn = typeof roomName === "string" ? roomName.trim() : "";
                const videoRoom = `video:${rn}`;
                socket.leave(videoRoom);
                io.to(videoRoom).emit("video:user-left", { roomName: rn, socketId: socket.id });
                socket.data.videoRoom = null;
                socket.data.videoRoomName = null;
            } catch (err) {
                console.error("video:leave error:", err);
            }
        });

        socket.on("disconnecting", () => {
            try {
                const rn = socket.data.videoRoomName;
                const vr = socket.data.videoRoom;
                if (rn && vr) {
                    socket.to(vr).emit("video:user-left", { roomName: rn, socketId: socket.id });
                }
            } catch (_) {}
        });
    });
};
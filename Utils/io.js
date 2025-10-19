const chatController = require("../Controllers/chat.controller");
const unserController = require("../Controllers/user.controller")

module.exports = function (io) {

    io.on("connection", async (socket) => {
        //console.log("Client is connected", socket.id);

        socket.on("login", async (userName, cb) => {
            //console.log("backend", userName);
            try {
                const user = await unserController.saveUser(userName, socket.id);
                const welcomeMessage = {
                    chat: `${user.name} is joined to this room`,
                    user: { id: null, name: "system" },
                };
                io.emit("message", welcomeMessage);
                cb({ ok: true, data: user })
            } catch (error) {
                cb({ ok: false, error: error.message });
            }
        });

        socket.on("sendMessage", async (message, cb) => {
            try {
                // check the user by socket id
                const user = await unserController.checkUser(socket.id);

                //save message
                const newMessage = await chatController.saveChat(message, user);
                io.emit("message", newMessage)
                cb({ ok: true })

            } catch (error) {
                cb({ ok: false, error: error.message });
            }
        })

        socket.on("disconnect", () => {
            //console.log("User is disconnected");
        })
    });

}
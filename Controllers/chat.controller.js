const Chat = require("../Models/chat")
const chatController = {}

chatController.saveChat = async (message, user) => {
    const newMessage = new Chat({
        chat: message,
        room: user.room,
        user: {
            id: user._id,
            name: user.name
        },
    });
    await newMessage.save();
    return newMessage;
};

chatController.getChatsByRoom = async (roomName) => {
    const chats = await Chat.find({ room: roomName }).sort({ createdAt: 1 });
    return chats;
};


module.exports = chatController
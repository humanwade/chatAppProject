const Chat = require("../Models/chat")
const mongoose = require("mongoose")
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

const GUIDELINES_ROOM = "Guidelines";

chatController.deleteChatById = async (chatId, user, options = {}) => {
    const { guidelinesAdmin } = options || {};
    const rawId = typeof chatId === "string" ? chatId.trim() : chatId;
    if (!rawId) throw new Error("Message id required.");
    if (!mongoose.Types.ObjectId.isValid(rawId)) throw new Error("Invalid message id.");

    const chat = await Chat.findById(rawId);
    if (!chat) throw new Error("Message not found.");
    if (chat.room !== user.room) throw new Error("Room mismatch.");

    const msgUserId = chat.user?.id;
    const own =
        msgUserId &&
        user._id &&
        String(msgUserId) === String(user._id);

    if (own) {
        await Chat.deleteOne({ _id: chat._id });
        return chat;
    }

    if (guidelinesAdmin && chat.room === GUIDELINES_ROOM) {
        await Chat.deleteOne({ _id: chat._id });
        return chat;
    }

    throw new Error("삭제할 권한이 없습니다.");
};


module.exports = chatController
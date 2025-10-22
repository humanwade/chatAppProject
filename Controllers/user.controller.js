const User = require("../Models/user")
const userController = {}

userController.saveUser = async(userName, sid) => {
    //check the exist user info
    let user = await User.findOne({name : userName });

    //make a new user info if not exist
    if(!user) {
        user = new User({
            name: userName,
            token: sid,
            online: true,
        });
    }

    //if user info is already exist
    user.token = sid
    user.online = true

    await user.save();
    return user;
};

userController.checkUser = async(sid) => {
    const user = await User.findOne({token:sid})
    if(!user) throw new Error ("user not found")
    return user;
}

userController.updateRoom = async (socketId, roomName) => {
    const user = await User.findOne({ token: socketId });
    if (!user) throw new Error("User not found");

    user.room = roomName;
    await user.save();

    return user;
};

module.exports = userController
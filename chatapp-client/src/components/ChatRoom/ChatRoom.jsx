import "./ChatRoom.css";
import MessageContainer from "../MessageContainer/MessageContainer";
import InputField from "../InputField/InputField";
import { useNavigate } from "react-router-dom";
import socket from "../../server";

function ChatRoom({
    currentRoom,
    messageList,
    user,
    message,
    setMessage,
    sendMessage,
    setCurrentRoom,
}) {
    const navigate = useNavigate();

    const handleLeaveRoom = () => {
        socket.emit("leaveRoom", (res) => {
            if (res.ok) {
                setCurrentRoom(null);
                navigate("/");
            } else {
                console.error("Leave room failed:", res.error);
            }
        });
    };

    return (
        <div className="App">
            <nav>
                <button className="back-button" onClick={handleLeaveRoom}>
                    {"←"}
                </button>
                <span className="nav-user">{currentRoom}</span>
            </nav>

            <MessageContainer messageList={messageList} user={user} />
            <InputField
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
            />
        </div>
    );
}

export default ChatRoom;
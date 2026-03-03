import "./ChatRoom.css";
import MessageContainer from "../MessageContainer/MessageContainer";
import InputField from "../InputField/InputField";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../server";
import VideoCall from "../VideoCall/VideoCall";
import VideoCallInvite from "../VideoCall/VideoCallInvite";

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
    const [videoOpen, setVideoOpen] = useState(false);
    const [inviteFrom, setInviteFrom] = useState(null);

    useEffect(() => {
        const onInvite = ({ roomName, fromId, fromName }) => {
            if (currentRoom !== roomName || videoOpen) return;
            setInviteFrom({ roomName, fromId, fromName });
        };
        socket.on("video:invite", onInvite);
        return () => socket.off("video:invite", onInvite);
    }, [currentRoom, videoOpen]);

    const handleLeaveRoom = () => {
        socket.emit("leaveRoom", (res) => {
            if (res.ok) {
                setVideoOpen(false);
                setInviteFrom(null);
                setCurrentRoom(null);
                navigate("/");
            } else {
                console.error("Leave room failed:", res.error);
            }
        });
    };

    const handleStartVideoCall = () => {
        setVideoOpen(true);
        if (currentRoom) socket.emit("video:invite", { roomName: currentRoom });
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
                onVideoCall={handleStartVideoCall}
            />

            <VideoCallInvite
                open={!!inviteFrom && !videoOpen}
                fromName={inviteFrom?.fromName}
                roomName={inviteFrom?.roomName}
                onJoin={() => {
                    setInviteFrom(null);
                    setVideoOpen(true);
                }}
                onDecline={() => setInviteFrom(null)}
            />

            <VideoCall
                open={videoOpen}
                roomName={currentRoom}
                user={user}
                onClose={() => setVideoOpen(false)}
            />
        </div>
    );
}

export default ChatRoom;
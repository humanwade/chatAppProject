import "./ChatRoom.css";
import MessageContainer from "../MessageContainer/MessageContainer";
import InputField from "../InputField/InputField";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../server";
import VideoCall from "../VideoCall/VideoCall";
import VideoCallInvite from "../VideoCall/VideoCallInvite";
import { GUIDELINES_ROOM_NAME } from "../../guidelinesAdmin";

function ChatRoom({
    currentRoom,
    messageList,
    user,
    message,
    setMessage,
    sendMessage,
    setCurrentRoom,
    guidelinesCanPost = false,
    onGuidelinesVerify,
    onDeleteMessage,
}) {
    const navigate = useNavigate();
    const [videoOpen, setVideoOpen] = useState(false);
    const [inviteFrom, setInviteFrom] = useState(null);
    const [guidelinesAdminPwd, setGuidelinesAdminPwd] = useState("");
    const [guidelinesAdminModalOpen, setGuidelinesAdminModalOpen] = useState(false);

    const isGuidelines = currentRoom === GUIDELINES_ROOM_NAME;
    const guidelinesInputLocked = isGuidelines && !guidelinesCanPost;

    const GUIDELINES_POST_HINT =
        "Announcements only. Admin password required to post.";

    useEffect(() => {
        if (guidelinesCanPost) {
            setGuidelinesAdminPwd("");
            setGuidelinesAdminModalOpen(false);
        }
    }, [guidelinesCanPost]);

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

    const submitGuidelinesVerify = () => {
        if (typeof onGuidelinesVerify === "function") {
            onGuidelinesVerify(guidelinesAdminPwd);
        }
    };

    return (
        <div className={`App${guidelinesInputLocked ? " App--guidelines-locked" : ""}`}>
            <nav>
                <button className="back-button" onClick={handleLeaveRoom}>
                    {"←"}
                </button>
                <span className="nav-user">{currentRoom}</span>
            </nav>

            <MessageContainer
                messageList={messageList}
                user={user}
                currentRoom={currentRoom}
                guidelinesCanPost={guidelinesCanPost}
                onDeleteMessage={onDeleteMessage}
            />

            {guidelinesInputLocked ? (
                <div className="guidelines-post-strip" aria-label="Announcements posting policy">
                    <p className="guidelines-post-strip-text">{GUIDELINES_POST_HINT}</p>
                    <button
                        type="button"
                        className="guidelines-post-strip-btn"
                        onClick={() => setGuidelinesAdminModalOpen(true)}
                    >
                        Enter password
                    </button>
                </div>
            ) : null}

            {guidelinesAdminModalOpen && guidelinesInputLocked ? (
                <div
                    className="guidelines-admin-modal-root"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="guidelines-admin-modal-title"
                >
                    <button
                        type="button"
                        className="guidelines-admin-modal-backdrop"
                        aria-label="Close dialog"
                        onClick={() => setGuidelinesAdminModalOpen(false)}
                    />
                    <div
                        className="guidelines-admin-modal-panel"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="guidelines-admin-modal-title" className="guidelines-admin-modal-title">
                            Admin posting
                        </h2>
                        <p className="guidelines-admin-modal-desc">{GUIDELINES_POST_HINT}</p>
                        <input
                            type="password"
                            className="guidelines-admin-input"
                            placeholder="Admin password"
                            value={guidelinesAdminPwd}
                            onChange={(e) => setGuidelinesAdminPwd(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    submitGuidelinesVerify();
                                }
                            }}
                            autoComplete="off"
                            autoFocus
                        />
                        <div className="guidelines-admin-modal-actions">
                            <button
                                type="button"
                                className="guidelines-admin-btn guidelines-admin-btn--primary"
                                onClick={submitGuidelinesVerify}
                            >
                                Verify
                            </button>
                            <button
                                type="button"
                                className="guidelines-admin-btn guidelines-admin-btn--ghost"
                                onClick={() => setGuidelinesAdminModalOpen(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <InputField
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
                onVideoCall={handleStartVideoCall}
                inputLocked={guidelinesInputLocked}
                onLockedInteraction={() => alert("관리자만 입력할 수 있습니다.")}
                onRequestGuidelinesUnlock={
                    guidelinesInputLocked
                        ? () => setGuidelinesAdminModalOpen(true)
                        : undefined
                }
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
import React, { useState } from "react";
import socket from "../../server";
import { useNavigate } from "react-router-dom";
import "./RoomList.css";

const RoomListPage = ({ rooms }) => {
  const navigate = useNavigate();
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const moveToChat = (roomName) => {
    navigate(`/room/${roomName}`);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    const name = newRoomName.trim();
    if (!name) return alert("Room name is required.");

    setCreating(true);
    socket.emit("createRoom", name, newRoomPassword.trim() || null, (res) => {
      setCreating(false);
      if (res?.ok) {
        const joinPassword = newRoomPassword.trim() || null;
        setNewRoomName("");
        setNewRoomPassword("");
        navigate(`/room/${name}`, { state: { joinPassword } });
      } else {
        alert(res?.error || "Failed to create room");
      }
    });
  };

  return (
    <div className="room-body">
      <div className="room-nav">Chatting Room ▼</div>

      <form className="room-create" onSubmit={handleCreateRoom}>
        <input
          className="room-input"
          placeholder="New room name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          disabled={creating}
        />
        <input
          className="room-input"
          placeholder="Password (optional)"
          value={newRoomPassword}
          onChange={(e) => setNewRoomPassword(e.target.value)}
          disabled={creating}
          type="password"
        />
        <button className="room-create-btn" type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create room"}
        </button>
      </form>

      {rooms.length > 0 ? (
        rooms.map((room) => (
          <div
            className="room-list"
            key={room._id}
            onClick={() => moveToChat(room.name)} 
          >
            <div className="room-title">
              <img src="/profile.jpeg" alt="room icon" />
              <p>
                {room.name}{" "}
                {room.hasPassword ? <span className="room-badge">Private</span> : null}
              </p>
            </div>
            <div className="member-number">{room.participantsCount ?? 0}</div>
          </div>
        ))
      ) : (
        <p>No Rooms</p>
      )}
    </div>
  );
};

export default RoomListPage;
import React from "react";
import socket from "../../server";
import { useNavigate } from "react-router-dom";
import "./RoomList.css";

const RoomListPage = ({ rooms }) => {
  const navigate = useNavigate();

  const moveToChat = (roomName) => {
    navigate(`/room/${roomName}`);
  };

  return (
    <div className="room-body">
      <div className="room-nav">Chatting Room ▼</div>

      {rooms.length > 0 ? (
        rooms.map((room) => (
          <div
            className="room-list"
            key={room._id}
            onClick={() => moveToChat(room.name)} 
          >
            <div className="room-title">
              <img src="/profile.jpeg" alt="room icon" />
              <p>{room.name}</p>
            </div>
            <div className="member-number">{room.members?.length ?? 0}</div>
          </div>
        ))
      ) : (
        <p>No Rooms</p>
      )}
    </div>
  );
};

export default RoomListPage;
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import "./App.css";
import socket from "./server";
import InputField from "./components/InputField/InputField";
import MessageContainer from "./components/MessageContainer/MessageContainer";
import RoomList from "./components/RoomList/RoomList";
import ChatRoom from "./components/ChatRoom/ChatRoom";

function App() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);

  useEffect(() => {
    socket.on("roomList", (roomList) => {
      setRooms(roomList);
    });

    askUserName();

    return () => {
      socket.off("roomList");
    };
  }, []);

  const askUserName = () => {
    const userName = prompt("Enter your prefer name");

    if (!userName || userName.trim() === "") {
      alert("User name is required.");
      return askUserName();
    }

    socket.emit("login", userName, (res) => {
      if (res?.ok) {
        setUser(res.data);
      } else {
        alert("Login failed: " + res.error);
      }
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user ? <RoomList rooms={rooms} /> : <p>Loading user...</p>
          }
        />
        <Route
          path="/room/:roomName"
          element={
            user ? (
              <ChatWrapper user={user} setCurrentRoom={setCurrentRoom} />
            ) : (
              <p>Loading user...</p>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


function ChatWrapper({ user, setCurrentRoom }) {
  const { roomName } = useParams();
  const [messageList, setMessageList] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.emit("joinRoom", roomName, (res) => {
      if (!res.ok) {
        console.error("Failed to join room:", res.error);
      }
    });

    socket.on("message", (msg) => {
      setMessageList((prev) => [...prev, msg]);
    });

    socket.on("chatHistory", (history) => {
      setMessageList(history);
    });

    return () => {
      socket.off("message");
      socket.off("chatHistory");
    };
  }, [roomName]);

  const sendMessage = (e) => {
    e.preventDefault();
    socket.emit("sendMessage", message, (res) => {
      if (res.ok) {
        setMessage("");
      } else {
        console.error("Send message error:", res.error);
      }
    });
  };

  return (
    <ChatRoom
      currentRoom={roomName}
      setCurrentRoom={setCurrentRoom}
      messageList={messageList}
      user={user}
      message={message}
      setMessage={setMessage}
      sendMessage={sendMessage}
    />
  );
}
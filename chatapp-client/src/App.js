import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from "react-router-dom";
import "./App.css";
import "./webrtcPolyfills";
import socket from "./server";
import RoomList from "./components/RoomList/RoomList";
import ChatRoom from "./components/ChatRoom/ChatRoom";

function App() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [, setCurrentRoom] = useState(null);

  useEffect(() => {
    const handleRooms = (roomList) => setRooms(roomList);

    socket.on("roomList", handleRooms);
    socket.on("roomsUpdated", handleRooms);

    socket.on("connect_error", (err) => {
      console.error("socket connect_error:", err?.message || err);
    });

    const STORAGE_KEY = "chatApp_userName";

    const doLogin = (userName, onFail) => {
      const name = userName?.trim();
      if (!name) return;

      socket.emit("login", name, (res) => {
        if (res?.ok) {
          setUser(res.data);
          try {
            localStorage.setItem(STORAGE_KEY, name);
          } catch (_) {}
        } else {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch (_) {}
          if (typeof onFail === "function") onFail();
          else alert("Login failed: " + (res?.error || "Unknown error"));
        }
      });
    };

    const askUserName = () => {
      const saved = (() => {
        try {
          return localStorage.getItem(STORAGE_KEY);
        } catch (_) {
          return null;
        }
      })();

      if (saved && saved.trim()) {
        doLogin(saved, () => {
          alert("Saved name could not be used. Please enter a new name.");
          promptAndLogin();
        });
        return;
      }

      promptAndLogin();
    };

    const promptAndLogin = () => {
      const userName = prompt("Enter your preferred name");

      if (!userName || userName.trim() === "") {
        alert("User name is required.");
        return promptAndLogin();
      }

      doLogin(userName);
    };

    askUserName();

    return () => {
      socket.off("roomList", handleRooms);
      socket.off("roomsUpdated", handleRooms);
      socket.off("connect_error");
    };
  }, []);

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
  const location = useLocation();
  const navigate = useNavigate();
  const [messageList, setMessageList] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const attemptJoin = (password) => {
      socket.emit("joinRoom", roomName, password, (res) => {
        if (res?.ok) {
          setCurrentRoom(roomName);
          return;
        }

        if (res?.error === "Invalid password.") {
          const pwd = prompt(`Password required for "${roomName}"`);
          if (pwd == null) return navigate("/");
          return attemptJoin(pwd);
        }

        console.error("Failed to join room:", res?.error);
        alert(res?.error || "Failed to join room");
        navigate("/");
      });
    };

    attemptJoin(location?.state?.joinPassword);

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
  }, [roomName, location, navigate, setCurrentRoom]);

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
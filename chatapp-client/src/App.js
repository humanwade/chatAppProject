import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from "react-router-dom";
import "./App.css";
import "./webrtcPolyfills";
import socket from "./server";
import RoomList from "./components/RoomList/RoomList";
import ChatRoom from "./components/ChatRoom/ChatRoom";
import {
  GUIDELINES_ROOM_NAME,
  getStoredGuidelinesAdminPassword,
  setStoredGuidelinesAdminPassword,
  clearStoredGuidelinesAdminPassword,
} from "./guidelinesAdmin";

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
  const [guidelinesCanPost, setGuidelinesCanPost] = useState(false);

  const isGuidelines = roomName === GUIDELINES_ROOM_NAME;

  useEffect(() => {
    if (!isGuidelines) {
      setGuidelinesCanPost(false);
      return;
    }

    const tryAutoVerify = () => {
      const pwd = getStoredGuidelinesAdminPassword();
      if (!pwd) {
        setGuidelinesCanPost(false);
        return;
      }
      socket.emit("verifyGuidelinesAdmin", pwd, (res) => {
        if (res?.ok) {
          setGuidelinesCanPost(true);
        } else {
          setGuidelinesCanPost(false);
          clearStoredGuidelinesAdminPassword();
        }
      });
    };

    socket.on("connect", tryAutoVerify);
    if (socket.connected) tryAutoVerify();

    return () => {
      socket.off("connect", tryAutoVerify);
    };
  }, [isGuidelines, roomName]);

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

    const onMessageDeleted = ({ _id }) => {
      setMessageList((prev) => prev.filter((m) => String(m._id) !== String(_id)));
    };
    socket.on("messageDeleted", onMessageDeleted);

    return () => {
      socket.off("message");
      socket.off("chatHistory");
      socket.off("messageDeleted", onMessageDeleted);
    };
  }, [roomName, location, navigate, setCurrentRoom]);

  const verifyGuidelinesWithSecret = (secret) => {
    const s = typeof secret === "string" ? secret.trim() : "";
    if (!s) {
      alert("암호를 입력하세요.");
      return;
    }
    socket.emit("verifyGuidelinesAdmin", s, (res) => {
      if (res?.ok) {
        setStoredGuidelinesAdminPassword(s);
        setGuidelinesCanPost(true);
      } else {
        clearStoredGuidelinesAdminPassword();
        alert(res?.error || "관리자만 입력할 수 있습니다.");
      }
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (isGuidelines && !guidelinesCanPost) {
      alert("관리자만 입력할 수 있습니다.");
      return;
    }
    socket.emit("sendMessage", message, (res) => {
      if (res.ok) {
        setMessage("");
      } else {
        console.error("Send message error:", res.error);
        alert(res?.error || "전송에 실패했습니다.");
      }
    });
  };

  const requestDeleteMessage = (messageId) => {
    if (!messageId) return;
    if (!window.confirm("이 메시지를 삭제할까요?")) return;
    socket.emit("deleteMessage", messageId, (res) => {
      if (!res?.ok) {
        alert(res?.error || "삭제에 실패했습니다.");
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
      guidelinesCanPost={guidelinesCanPost}
      onGuidelinesVerify={verifyGuidelinesWithSecret}
      onDeleteMessage={requestDeleteMessage}
    />
  );
}
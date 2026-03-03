import React, { useEffect, useRef, useState } from "react";
import { Input } from "@mui/base/Input";
import { Button } from "@mui/base/Button";
import "./InputField.css";

const InputField = ({ message, setMessage, sendMessage, onVideoCall }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="input-area">
          <div className="plus-wrapper" ref={menuRef}>
            <button
              type="button"
              className="plus-button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              +
            </button>
            {menuOpen ? (
              <div className="plus-menu" role="menu">
                <button
                  type="button"
                  className="plus-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    if (typeof onVideoCall === "function") onVideoCall();
                  }}
                >
                  Video Call
                </button>
              </div>
            ) : null}
          </div>
          <form onSubmit={sendMessage} className="input-container">
            <Input
              placeholder="Type in here…"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              multiline={false}
              rows={1}
            />

            <Button
              disabled={message === ""}
              type="submit"
              className="send-button"
            >
              Send
            </Button>
          </form>
        </div>
  );
};

export default InputField
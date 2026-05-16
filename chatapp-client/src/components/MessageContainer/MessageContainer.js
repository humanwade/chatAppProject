import React, { useEffect, useRef } from "react";
import "./MessageContainer.css";
import { Container } from "@mui/system";
import { GUIDELINES_ROOM_NAME } from "../../guidelinesAdmin";

function messageDeletable(message, user, currentRoom, guidelinesCanPost) {
  if (!user) return false;
  if (currentRoom === GUIDELINES_ROOM_NAME && guidelinesCanPost) return true;
  const msgId = message.user?.id;
  if (!msgId || !user._id) return false;
  return String(msgId) === String(user._id);
}

const MessageContainer = ({
  messageList,
  user,
  currentRoom,
  guidelinesCanPost = false,
  onDeleteMessage,
}) => {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  return (
    <div className="message-wrapper">
      {messageList.map((message) => {
        const canDel = messageDeletable(message, user, currentRoom, guidelinesCanPost);
        const handleDelete = () => {
          if (typeof onDeleteMessage === "function") onDeleteMessage(message._id);
        };

        return (
          <Container key={message._id} className="message-container">
            {message.user.name === "system" ? (
              <div className="system-message-container">
                <div className="system-message-row">
                  <p className="system-message">{message.chat}</p>
                  {canDel ? (
                    <button
                      type="button"
                      className="message-delete-btn"
                      aria-label="Delete message"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            ) : message.user.name === user.name ? (
              <div className="my-message-container">
                <div className="my-message-row">
                  <div className="my-message">{message.chat}</div>
                  {canDel ? (
                    <button
                      type="button"
                      className="message-delete-btn message-delete-btn--my"
                      aria-label="Delete message"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="your-message-container">
                <img
                  src="/profile.jpeg"
                  alt={`${message.user.name} avatar`}
                  className="profile-image"
                />
                <div className="your-message-content">
                  <div className="your-message-name">{message.user.name}</div>
                  <div className="your-message-row">
                    <div className="your-message">{message.chat}</div>
                    {canDel ? (
                      <button
                        type="button"
                        className="message-delete-btn"
                        aria-label="Delete message"
                        onClick={handleDelete}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </Container>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageContainer;

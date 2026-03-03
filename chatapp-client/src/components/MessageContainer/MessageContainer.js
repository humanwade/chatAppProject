import React, { useEffect, useRef } from "react";
import "./MessageContainer.css";
import { Container } from "@mui/system";

const MessageContainer = ({ messageList, user }) => {
  const bottomRef = useRef(); 

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  return (
    <div className="message-wrapper">
      {messageList.map((message, index) => {
        return (
          <Container key={message._id} className="message-container">
            {message.user.name === "system" ? (
              <div className="system-message-container">
                <p className="system-message">{message.chat}</p>
              </div>
            ) : message.user.name === user.name ? (
              <div className="my-message-container">
                <div className="my-message">{message.chat}</div>
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
                  <div className="your-message">{message.chat}</div>
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
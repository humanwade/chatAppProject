import React from "react";
import "./VideoCallInvite.css";

export default function VideoCallInvite({ open, fromName, roomName, onJoin, onDecline }) {
  if (!open) return null;

  return (
    <div className="vc-invite-overlay" role="dialog" aria-modal="true" aria-label="Video call invitation">
      <div className="vc-invite-card">
        <div className="vc-invite-icon">📹</div>
        <h3 className="vc-invite-title">Video call</h3>
        <p className="vc-invite-text">
          <strong>{fromName || "Someone"}</strong> is starting a video call in <strong>{roomName || ""}</strong>.
        </p>
        <div className="vc-invite-actions">
          <button type="button" className="vc-invite-btn vc-invite-decline" onClick={onDecline}>
            Decline
          </button>
          <button type="button" className="vc-invite-btn vc-invite-join" onClick={onJoin}>
            Join
          </button>
        </div>
      </div>
    </div>
  );
}

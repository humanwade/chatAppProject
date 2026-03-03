import React, { useEffect, useMemo, useRef, useState } from "react";
import Peer from "simple-peer";
import socket from "../../server";
import "./VideoCall.css";

const VideoTile = ({ stream, label, muted }) => {
  const ref = useRef(null);
  const initial = (label && label[0]) ? label[0].toUpperCase() : "?";

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="vc-tile">
      <video
        ref={ref}
        className="vc-video"
        autoPlay
        playsInline
        muted={muted}
      />
      <div className="vc-tile-label">
        <div className="vc-tile-avatar" aria-hidden>{initial}</div>
        <span className="vc-tile-name">{label || "Guest"}</span>
      </div>
    </div>
  );
};

export default function VideoCall({ open, roomName, user, onClose }) {
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]); // [{ id, name, stream }]
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const peersRef = useRef(new Map()); // id -> { peer, name, stream }
  const localStreamRef = useRef(null);
  const leavingRef = useRef(false);

  const myLabel = useMemo(() => user?.name || "Me", [user]);

  const cleanup = async () => {
    leavingRef.current = true;

    try {
      if (roomName) socket.emit("video:leave", { roomName });
    } catch (_) {}

    peersRef.current.forEach(({ peer }) => {
      try {
        peer.destroy();
      } catch (_) {}
    });
    peersRef.current.clear();
    setRemotePeers([]);

    if (localStream) {
      localStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch (_) {}
      });
    }
    setLocalStream(null);
    localStreamRef.current = null;
  };

  const addPeer = (socketId, name, initiator, streamOrNull) => {
    if (peersRef.current.has(socketId)) return;

    const peer = new Peer({
      initiator,
      trickle: true,
      stream: streamOrNull || undefined,
    });

    peer.on("signal", (signal) => {
      socket.emit("video:signal", { roomName, to: socketId, signal });
    });

    peer.on("stream", (stream) => {
      const entry = peersRef.current.get(socketId);
      if (!entry) return;
      entry.stream = stream;
      setRemotePeers((prev) => {
        const next = prev.filter((p) => p.id !== socketId);
        next.push({ id: socketId, name: entry.name, stream });
        return next;
      });
    });

    peer.on("close", () => {
      peersRef.current.delete(socketId);
      setRemotePeers((prev) => prev.filter((p) => p.id !== socketId));
    });

    peer.on("error", () => {
      peersRef.current.delete(socketId);
      setRemotePeers((prev) => prev.filter((p) => p.id !== socketId));
    });

    peersRef.current.set(socketId, { peer, name: name || "Guest", stream: null });
  };

  useEffect(() => {
    if (!open || !roomName) return;
    leavingRef.current = false;

    let isMounted = true;

    const handlePeers = async ({ roomName: rn, peers }) => {
      if (!isMounted || rn !== roomName) return;

      const stream = localStreamRef.current;
      peers.forEach(({ socketId, name }) => {
        if (socketId === socket.id) return;
        if (peersRef.current.has(socketId)) return;
        addPeer(socketId, name, true, stream);
      });

    };

    const handleSignal = ({ roomName: rn, from, fromName, signal }) => {
      if (!isMounted || rn !== roomName) return;
      if (from === socket.id) return;

      let entry = peersRef.current.get(from);
      if (!entry) {
        addPeer(from, fromName || "Guest", false, localStreamRef.current);
        entry = peersRef.current.get(from);
      }

      if (entry) {
        if (fromName && entry.name === "Guest") entry.name = fromName;
        try {
          entry.peer.signal(signal);
        } catch (_) {}
      }
    };

    const handleUserLeft = ({ roomName: rn, socketId }) => {
      if (!isMounted || rn !== roomName) return;
      const entry = peersRef.current.get(socketId);
      if (entry) {
        try {
          entry.peer.destroy();
        } catch (_) {}
      }
      peersRef.current.delete(socketId);
      setRemotePeers((prev) => prev.filter((p) => p.id !== socketId));
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!isMounted) return;
        localStreamRef.current = stream;
        setLocalStream(stream);
        setMicOn(true);
        setCamOn(true);

        socket.on("video:peers", handlePeers);
        socket.on("video:signal", handleSignal);
        socket.on("video:user-left", handleUserLeft);

        socket.emit("video:join", { roomName });
      } catch (err) {
        alert("Failed to access camera/microphone: " + (err?.message || err));
        if (typeof onClose === "function") onClose();
      }
    };

    start();

    return () => {
      isMounted = false;
      socket.off("video:peers", handlePeers);
      socket.off("video:signal", handleSignal);
      socket.off("video:user-left", handleUserLeft);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, roomName]);

  useEffect(() => {
    if (!localStream) return;
    // ensure peers created before localStream are updated
    peersRef.current.forEach(({ peer }) => {
      try {
        // simple-peer will use the initial stream; replacing tracks is non-trivial.
        // For this simple implementation, we start stream before peers are created.
      } catch (_) {}
    });
  }, [localStream]);

  if (!open) return null;

  const toggleMic = () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleCam = () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  const endCall = async () => {
    await cleanup();
    if (typeof onClose === "function") onClose();
  };

  return (
    <div className="vc-overlay" role="dialog" aria-modal="true">
      <div className="vc-header">
        <div className="vc-title">
          Video Call · {roomName}
        </div>
        <button className="vc-close" onClick={endCall}>
          ✕
        </button>
      </div>

      <div className="vc-grid">
        <VideoTile stream={localStream} label={`${myLabel} (You)`} muted />
        {remotePeers
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
          .map((p) => (
            <VideoTile
              key={p.id}
              stream={p.stream}
              label={p.name || "Guest"}
              muted={false}
            />
          ))}
      </div>

      <div className="vc-controls">
        <button className="vc-btn" onClick={toggleCam}>
          {camOn ? "Camera On" : "Camera Off"}
        </button>
        <button className="vc-btn" onClick={toggleMic}>
          {micOn ? "Mic On" : "Mic Muted"}
        </button>
        <button className="vc-btn vc-end" onClick={endCall}>
          End call
        </button>
      </div>
    </div>
  );
}


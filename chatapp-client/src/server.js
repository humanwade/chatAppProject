import { io } from "socket.io-client";

const inferApiUrl = () => {
  if (typeof window === "undefined") return undefined;

  const { protocol, hostname, port } = window.location;

  // CRA dev server default is 3000; backend in this project uses 5001 by default.
  if (port === "3000") return `${protocol}//${hostname}:5001`;

  // In production (served by backend), same-origin usually works.
  return window.location.origin;
};

const socket = io(process.env.REACT_APP_API_URL || inferApiUrl());

export default socket;

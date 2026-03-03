import { Buffer } from "buffer";
import process from "process";

// CRA5 webpack no longer polyfills Node globals.
// simple-peer (and its deps) may expect these globals in the browser bundle.
if (typeof window !== "undefined") {
  if (!window.Buffer) window.Buffer = Buffer;
  if (!window.process) window.process = process;
}


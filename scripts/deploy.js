/**
 * Deploy: build client → git push → (optional) SSH to Raspberry Pi → git pull → pm2 restart
 *
 * Set in .env (or environment):
 *   DEPLOY_HOST=pi@192.168.x.x   (or pi@raspberrypi.local)
 *   DEPLOY_PATH=/home/pi/chatAppProject   (project path on Pi)
 *   DEPLOY_PM2_NAME=chatApp     (default: chatApp)
 *
 * If DEPLOY_HOST/DEPLOY_PATH are not set, only build + push run.
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const ROOT = path.resolve(__dirname, "..");
const DEPLOY_PM2_NAME = process.env.DEPLOY_PM2_NAME || "chatApp";

function run(cmd, cwd = ROOT) {
  console.log("[run]", cwd === ROOT ? cmd : `(in ${path.basename(cwd)}) ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", shell: true });
}

// 1) Build client
console.log("\n--- Build client ---\n");
run("npm run build", path.join(ROOT, "chatapp-client"));

// 2) Git push
console.log("\n--- Git push ---\n");
try {
  run("git push");
} catch (e) {
  console.warn("git push failed (no remote, or nothing to push?). Continue.");
}

// 3) Optional: SSH to Pi → pull → pm2 restart
const host = process.env.DEPLOY_HOST || process.env.DEPLOY_HOST_USER;
const deployPath = process.env.DEPLOY_PATH;

if (host && deployPath) {
  console.log("\n--- Deploy on server (SSH) ---\n");
  const remoteCmd = `cd ${deployPath} && git pull && pm2 restart ${DEPLOY_PM2_NAME}`;
  run(`ssh ${host} "${remoteCmd}"`);
  console.log("\nDeploy done. PM2 restarted on server.");
} else {
  console.log("\nTo auto-update Raspberry Pi, set in .env:");
  console.log("  DEPLOY_HOST=pi@<라즈베리파이IP또는호스트>");
  console.log("  DEPLOY_PATH=/home/pi/chatAppProject  (Pi 위의 프로젝트 경로)");
  console.log("Then run: npm run deploy");
}

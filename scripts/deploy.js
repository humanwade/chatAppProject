/**
 * Deploy (local): Build → Git Add → Git Commit → Git Push
 *
 * - Always creates a new commit by including the current time in the message.
 * - Pushes to origin main.
 * - After a successful push, check GitHub Actions for deployment status.
 */
const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function run(cmd, cwd = ROOT) {
  console.log("[run]", cwd === ROOT ? cmd : `(in ${path.basename(cwd)}) ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", shell: true });
}

function pad(n, w = 2) {
  return String(n).padStart(w, "0");
}

function formatTimestamp(d = new Date()) {
  // Local time, stable format: YYYY-MM-DD HH:mm:ss.SSS
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.` +
    `${pad(d.getMilliseconds(), 3)}`
  );
}

// 1) Build client
console.log("\n--- Build client ---\n");
run("npm run build", path.join(ROOT, "chatapp-client"));

// 2) Git add
console.log("\n--- Git add ---\n");
run("git add -A");

// 3) Git commit (always create a new commit)
console.log("\n--- Git commit ---\n");
const ts = formatTimestamp();
const message = `deploy: ${ts}`;
run(`git commit --allow-empty -m "${message}"`);

// 4) Git push
console.log("\n--- Git push (origin main) ---\n");
run("git push origin main");
console.log("\nGitHub Actions에서 배포 상태를 확인하세요");

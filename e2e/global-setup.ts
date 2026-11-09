import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { API_DIR, AUTH_DIR, apiEnv } from "./env";

/**
 * Seed lại quán demo "Cà phê Góc Phố" vào DB `ordergo_playwright` trước mỗi lượt chạy.
 * Script seed tự reset dữ liệu của tenant demo nên chạy lại bao nhiêu lần cũng được.
 */
export default function globalSetup() {
  const script = path.join(API_DIR, "dist", "scripts", "seed-demo.js");
  if (!fs.existsSync(script)) {
    throw new Error(
      `Chưa build API: không thấy ${script}. Chạy \`npx nest build\` trong ordergo-api.`,
    );
  }
  execFileSync(process.execPath, [script], {
    cwd: API_DIR,
    env: { ...process.env, ...apiEnv, NODE_ENV: "development" },
    stdio: ["ignore", "ignore", "inherit"],
    timeout: 120_000,
  });
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

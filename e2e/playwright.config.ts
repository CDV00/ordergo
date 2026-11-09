import { defineConfig, devices } from "@playwright/test";
import { API_DIR, API_URL, WEB_DIR, WEB_URL, apiEnv } from "./env";

const isCI = !!process.env.CI;
/** Bỏ bước build (CI đã build sẵn ở step riêng, hoặc dev đã build rồi). */
const skipBuild = process.env.E2E_SKIP_BUILD === "1";

const nest = "node node_modules/@nestjs/cli/bin/nest.js";
const next = "node node_modules/next/dist/bin/next";

export default defineConfig({
  testDir: "./tests",
  // Các test dùng chung 1 DB seed → chạy tuần tự
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./global-setup.ts",

  use: {
    baseURL: WEB_URL,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "desktop",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      // Máy tính bảng dọc ở quầy / trong bếp: POS mở giỏ dạng sheet, KDS 3 cột
      name: "tablet",
      dependencies: ["setup"],
      testMatch: /ca-ban-hang\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
      },
    },
  ],

  webServer: [
    {
      name: "api",
      command: skipBuild ? "node dist/main.js" : `${nest} build && node dist/main.js`,
      cwd: API_DIR,
      url: `${API_URL}/health`,
      env: apiEnv,
      reuseExistingServer: !isCI,
      timeout: 180_000,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      name: "web",
      // `next build` nhúng NEXT_PUBLIC_API_URL lúc build → build riêng cho cổng test.
      command: skipBuild
        ? `${next} start -p ${new URL(WEB_URL).port}`
        : `${next} build && ${next} start -p ${new URL(WEB_URL).port}`,
      cwd: WEB_DIR,
      url: `${WEB_URL}/login`,
      // Build vào thư mục riêng → không đè .next của dev server (:3200) đang chạy.
      env: {
        NEXT_PUBLIC_API_URL: API_URL,
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || ".next-e2e",
      },
      reuseExistingServer: !isCI,
      timeout: 300_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});

import os from "node:os";
import path from "node:path";

/** Cổng riêng cho test — không đụng 3000/4000 của môi trường dev. */
export const API_PORT = Number(process.env.E2E_API_PORT ?? 4100);
export const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3100);

export const API_URL = `http://localhost:${API_PORT}/v1`;
export const WEB_URL = `http://localhost:${WEB_PORT}`;

export const ROOT_DIR = path.resolve(__dirname, "..");
export const API_DIR = path.join(ROOT_DIR, "ordergo-api");
export const WEB_DIR = path.join(ROOT_DIR, "ordergo-web");
export const AUTH_DIR = path.join(__dirname, ".auth");

/** Biến môi trường cho API + script seed (cùng 1 DB riêng `ordergo_playwright`). */
export const apiEnv: Record<string, string> = {
  MONGODB_URI: process.env.E2E_MONGODB_URI ?? "mongodb://localhost:27018/?directConnection=true",
  MONGODB_DB: process.env.E2E_MONGODB_DB ?? "ordergo_playwright",
  PORT: String(API_PORT),
  CORS_ORIGINS: WEB_URL,
  UPLOAD_DIR: path.join(os.tmpdir(), "ordergo-playwright-uploads"),
  // Giá trị giả chỉ dùng cho test (≥ 32 ký tự)
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET ?? "playwright-only-access-secret-not-used-anywhere",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ?? "playwright-only-refresh-secret-not-used-anywhere",
};

/** Dữ liệu demo do `seed-demo` tạo ra. */
export const DEMO = {
  tenantSlug: "ca-phe-goc-pho",
  password: process.env.DEMO_PASSWORD ?? "ordergo123",
  users: {
    owner: "0900000001",
    cashier: "0900000003",
    server: "0900000004",
    kitchen: "0900000005",
  },
} as const;

export type Role = keyof typeof DEMO.users;

export const authFile = (role: Role) => path.join(AUTH_DIR, `${role}.json`);

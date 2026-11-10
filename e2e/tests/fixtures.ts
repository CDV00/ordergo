import fs from "node:fs";
import {
  test as base,
  expect,
  request as pwRequest,
  type APIRequestContext,
  type Browser,
  type Locator,
  type Page,
} from "@playwright/test";
import { API_URL, authFile, type Role } from "../env";

// ─── Kiểu dữ liệu tối thiểu của API ─────────────────────────────────────────

export interface ApiOrderLine {
  id: string;
  productSnapshot: { name: string };
  kitchenStatus: string;
  sentToKitchenAt: string | null;
}
export interface ApiOrder {
  id: string;
  orderNumber: string;
  status: string;
  tableId: string | null;
  tableName: string | null;
  lines: ApiOrderLine[];
  pricing: { total: { amount: number } };
}
export interface ApiTable {
  id: string;
  name: string;
  status: string;
}
export interface ApiMenuItem {
  id: string;
  name: string;
}

/** Đọc token + tenant/venue từ storageState đã lưu ở bước setup (không đăng nhập lại). */
function readAuth(role: Role) {
  const state = JSON.parse(fs.readFileSync(authFile(role), "utf8")) as {
    origins: Array<{ localStorage: Array<{ name: string; value: string }> }>;
  };
  const ls = new Map(state.origins.flatMap((o) => o.localStorage).map((e) => [e.name, e.value]));
  return {
    token: ls.get("ordergo.accessToken")!,
    tenantId: ls.get("ordergo.activeTenantId")!,
    venueId: ls.get("ordergo.activeVenueId")!,
  };
}

/** Client REST gọi thẳng API bằng token của 1 vai trò — dùng để chuẩn bị / kiểm tra dữ liệu. */
export class Api {
  constructor(
    private readonly ctx: APIRequestContext,
    readonly venueId: string,
  ) {}

  static async create(role: Role): Promise<Api> {
    const a = readAuth(role);
    const ctx = await pwRequest.newContext({
      baseURL: `${API_URL}/`,
      extraHTTPHeaders: {
        Authorization: `Bearer ${a.token}`,
        "X-Tenant-Id": a.tenantId,
        "X-Venue-Id": a.venueId,
      },
    });
    return new Api(ctx, a.venueId);
  }

  async get<T>(url: string): Promise<T> {
    const res = await this.ctx.get(url.replace(/^\//, ""));
    expect(res.ok(), `GET ${url} → ${res.status()} ${await res.text()}`).toBeTruthy();
    return ((await res.json()) as { data: T }).data;
  }

  async post<T>(url: string, body?: unknown): Promise<T> {
    const res = await this.ctx.post(url.replace(/^\//, ""), { data: body ?? {} });
    expect(res.ok(), `POST ${url} → ${res.status()} ${await res.text()}`).toBeTruthy();
    return ((await res.json()) as { data: T }).data;
  }

  tables = () => this.get<ApiTable[]>("tables");
  async table(name: string): Promise<ApiTable> {
    const t = (await this.tables()).find((x) => x.name === name);
    expect(t, `không thấy bàn ${name}`).toBeTruthy();
    return t!;
  }
  openOrders = () => this.get<ApiOrder[]>(`orders?venueId=${this.venueId}&status=open`);
  order = (id: string) => this.get<ApiOrder>(`orders/${id}`);
  async menuItem(name: string): Promise<ApiMenuItem> {
    const items = await this.get<ApiMenuItem[]>("menu-items");
    const it = items.find((x) => x.name === name);
    expect(it, `không thấy món ${name}`).toBeTruthy();
    return it!;
  }

  dispose = () => this.ctx.dispose();
}

/** Mở 1 trang trong context mới đã đăng nhập sẵn bằng vai trò `role`. */
export async function pageAs(
  browser: Browser,
  role: Role,
  viewport?: { width: number; height: number } | null,
): Promise<Page> {
  const ctx = await browser.newContext({
    storageState: authFile(role),
    ...(viewport ? { viewport } : {}),
  });
  return ctx.newPage();
}

type Fixtures = {
  /** API với quyền chủ quán */
  ownerApi: Api;
};

export const test = base.extend<Fixtures>({
  ownerApi: async ({}, use) => {
    const api = await Api.create("owner");
    await use(api);
    await api.dispose();
  },
  // Mặc định `page` của test đăng nhập bằng chủ quán
  storageState: async ({}, use) => use(authFile("owner")),
});

export { expect };

// ─── Helpers UI ─────────────────────────────────────────────────────────────

export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** "1.234.000đ" — giống `formatVnd` của web */
export const vnd = (n: number) => `${new Intl.NumberFormat("vi-VN").format(n)}đ`;

/** Ô bàn trong màn chọn bàn của POS (tên nút bắt đầu bằng tên bàn). */
export const tableTile = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`^${escapeRe(name)}\\s`) });

/** Thẻ món trong lưới menu POS (tên nút bắt đầu bằng tên món). */
export const menuCard = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`^${escapeRe(name)}`) });

/**
 * Giỏ hàng POS đang hiển thị. Màn rộng (≥ lg) có cột giỏ cố định; màn tablet phải bấm
 * nút nổi "N món mới / Xem đơn" để mở sheet.
 */
export async function openCart(page: Page): Promise<Locator> {
  const width = page.viewportSize()?.width ?? 1280;
  if (width < 1024) {
    // Sheet đóng có hiệu ứng trượt (animate-ui): lúc đang đóng vẫn "visible" nhưng data-state=closed
    // → chỉ coi là đang mở khi data-state=open; nếu đang đóng thì chờ đóng hẳn rồi bấm mở lại.
    const sheet = page.getByRole("dialog", { name: "Giỏ hàng" });
    const openSheet = sheet.and(page.locator('[data-state="open"]'));
    if (!(await openSheet.isVisible())) {
      await expect(sheet).toBeHidden();
      await page.getByRole("button", { name: /món mới|Xem đơn/ }).click();
    }
    await expect(openSheet).toBeVisible();
    return sheet;
  }
  const aside = page.locator("aside").filter({ hasText: "Tổng cộng" });
  await expect(aside).toBeVisible();
  return aside;
}

/** Cột trên KDS ("Mới" / "Đang làm" / "Sẵn sàng") */
export const kdsColumn = (page: Page, title: string) =>
  page
    .locator("div:has(> header > h2)")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });

/** Thẻ 1 món trên KDS theo số đơn + tên món */
export const kdsCard = (scope: Page | Locator, orderNumber: string, itemName: string) =>
  scope.locator("article").filter({ hasText: orderNumber }).filter({ hasText: itemName });

/** Chờ KDS kết nối realtime ("Trực tiếp") — sau đó dữ liệu mới đến qua socket, không phải poll. */
export async function waitRealtime(page: Page) {
  await expect(page.getByText("Trực tiếp", { exact: true })).toBeVisible({ timeout: 15_000 });
}

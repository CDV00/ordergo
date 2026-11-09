import fs from "node:fs";
import {
  request as pwRequest,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { API_URL, authFile } from "../env";
import {
  expect,
  kdsCard,
  menuCard,
  openCart,
  tableTile,
  test,
  type Api,
  type ApiOrder,
  type ApiTable,
} from "./fixtures";

/**
 * POS chạy qua lúc rớt mạng: gửi bếp khi offline → vào hàng đợi (IndexedDB) → có mạng lại
 * thì tự gửi với Idempotency-Key, đơn xuất hiện ở bếp.
 */

/** Bàn đang trống, không bị spec khác dùng. */
async function freeTable(api: Api, exclude: string[]): Promise<ApiTable> {
  const open = await api.openOrders();
  const busy = new Set(open.map((o) => o.tableId));
  const t = (await api.tables()).find(
    (x) =>
      x.status === "available" && !busy.has(x.id) && !exclude.includes(x.name),
  );
  expect(t, "cần 1 bàn trống trong seed").toBeTruthy();
  return t!;
}

/** Client PATCH (fixtures chỉ có GET/POST) bằng token chủ quán. */
async function ownerRaw(): Promise<APIRequestContext> {
  const state = JSON.parse(fs.readFileSync(authFile("owner"), "utf8")) as {
    origins: Array<{ localStorage: Array<{ name: string; value: string }> }>;
  };
  const ls = new Map(
    state.origins.flatMap((o) => o.localStorage).map((e) => [e.name, e.value]),
  );
  return pwRequest.newContext({
    baseURL: `${API_URL}/`,
    extraHTTPHeaders: {
      Authorization: `Bearer ${ls.get("ordergo.accessToken")}`,
      "X-Tenant-Id": ls.get("ordergo.activeTenantId")!,
      "X-Venue-Id": ls.get("ordergo.activeVenueId")!,
    },
  });
}

const banner = (page: Page) => page.getByTestId("offline-banner");

/** Mở POS lúc có mạng, chờ dữ liệu (bàn + menu) vào cache để dùng khi mất mạng. */
async function openPosOnline(page: Page, tableName: string, itemName: string) {
  await page.goto("/pos");
  await expect(tableTile(page, tableName)).toBeVisible();
  await tableTile(page, tableName).click();
  await expect(
    page.getByRole("heading", { name: `Bàn ${tableName}` }),
  ).toBeVisible();
  await expect(menuCard(page, itemName)).toBeVisible();
}

const EXCLUDE = ["T1", "T4", "S4", "S3", "T5"];

test("Mất mạng: gửi bếp vào hàng đợi, có mạng lại thì tự gửi và lên bếp", async ({
  page,
  context,
  ownerApi,
}) => {
  const ITEM = "Croissant bơ";
  const table = await freeTable(ownerApi, EXCLUDE);

  await openPosOnline(page, table.name, ITEM);

  // ─── Mất mạng ───
  await context.setOffline(true);
  await menuCard(page, ITEM).click();
  let cart = await openCart(page);
  await cart.getByRole("button", { name: "Gửi bếp" }).click();
  await expect(
    page.getByText(`Mất kết nối — đã lưu 1 món chờ gửi (Bàn ${table.name})`),
  ).toBeVisible();

  await expect(banner(page)).toContainText(
    "Mất kết nối — đơn mới sẽ được gửi khi có mạng lại (1 đơn chờ)",
  );
  cart = await openCart(page);
  await expect(cart.getByText("Chờ gửi (offline)")).toBeVisible();
  await expect(cart.getByTestId("pending-line")).toContainText(ITEM);
  // Giỏ đã xoá — không nhập lại nhầm
  await expect(cart.getByText("Gọi thêm", { exact: true })).toHaveCount(0);

  // Gọi thêm lúc vẫn offline → nối vào cùng đơn chờ (vẫn 1 đơn)
  await menuCard(page, ITEM).click();
  cart = await openCart(page);
  await cart.getByRole("button", { name: "Gửi thêm" }).click();
  await expect(banner(page)).toContainText("(1 đơn chờ)");
  await expect(cart.getByTestId("pending-line")).toHaveCount(2);

  // Server chưa nhận gì
  expect(
    (await ownerApi.openOrders()).filter((o) => o.tableId === table.id),
  ).toHaveLength(0);

  // Hàng đợi sống qua reload (IndexedDB) — reload lúc có mạng sẽ gửi luôn, nên kiểm tra dữ liệu
  const stored = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const req = indexedDB.open("ordergo-offline");
        req.onsuccess = () => {
          const get = req.result
            .transaction("kv")
            .objectStore("kv")
            .get("outbox:v1");
          get.onsuccess = () =>
            resolve((get.result as unknown[] | undefined)?.length ?? 0);
        };
      }),
  );
  expect(stored).toBe(4); // create + send, add_lines + send

  // ─── Có mạng lại ───
  await context.setOffline(false);
  await expect(page.getByText("Đã gửi 1 đơn chờ")).toBeVisible({
    timeout: 20_000,
  });
  await expect(banner(page)).toHaveCount(0);

  let order: ApiOrder | undefined;
  await expect
    .poll(async () => {
      order = (await ownerApi.openOrders()).find((o) => o.tableId === table.id);
      return order?.lines.filter((l) => l.sentToKitchenAt).length ?? 0;
    })
    .toBe(2);
  // Đúng 1 đơn cho bàn (không tạo trùng khi gửi lại)
  expect(
    (await ownerApi.openOrders()).filter((o) => o.tableId === table.id),
  ).toHaveLength(1);

  // Đơn chờ biến khỏi giỏ, hiện ở "Đã gọi"
  cart = await openCart(page);
  await expect(cart.getByTestId("pending-line")).toHaveCount(0);
  await expect(cart.getByText(`Đơn ${order!.orderNumber}`)).toBeVisible();

  // Lên màn bếp
  await page.goto("/kds");
  await expect(kdsCard(page, order!.orderNumber, ITEM).first()).toBeVisible();
});

test("Gửi lại bị lỗi 4xx (món đã hết) → hiện Lỗi, Thử lại sau khi mở bán lại", async ({
  page,
  context,
  ownerApi,
}) => {
  const ITEM = "Croissant bơ";
  const table = await freeTable(ownerApi, EXCLUDE);
  const item = await ownerApi.menuItem(ITEM);
  const raw = await ownerRaw();
  const setAvailable = async (isAvailable: boolean) => {
    const res = await raw.patch(`menu-items/${item.id}/availability`, {
      data: { isAvailable },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
  };

  try {
    await openPosOnline(page, table.name, ITEM);
    await context.setOffline(true);
    await menuCard(page, ITEM).click();
    const cart = await openCart(page);
    await cart.getByRole("button", { name: "Gửi bếp" }).click();
    await expect(banner(page)).toContainText("(1 đơn chờ)");

    // Trong lúc máy này mất mạng, quản lý báo hết món
    await setAvailable(false);
    await context.setOffline(false);

    await expect(banner(page)).toContainText("1 đơn chờ gửi bị lỗi", {
      timeout: 20_000,
    });
    await banner(page).getByRole("button", { name: "Xem" }).click();
    const sheet = page.getByRole("dialog", { name: "Đơn chờ gửi" });
    await expect(sheet.getByText("Lỗi", { exact: true })).toBeVisible();
    await expect(sheet.getByText(`Món "${ITEM}" hiện đã hết.`)).toBeVisible();
    expect(
      (await ownerApi.openOrders()).filter((o) => o.tableId === table.id),
    ).toHaveLength(0);

    // Mở bán lại → Thử lại (cùng Idempotency-Key) → gửi được
    await setAvailable(true);
    await sheet.getByRole("button", { name: "Thử lại" }).click();
    await expect(page.getByText("Đã gửi 1 đơn chờ")).toBeVisible({
      timeout: 20_000,
    });
    await expect
      .poll(async () =>
        (await ownerApi.openOrders())
          .filter((o) => o.tableId === table.id)
          .map((o) => o.lines.filter((l) => l.sentToKitchenAt).length),
      )
      .toEqual([1]);
  } finally {
    await setAvailable(true);
    await raw.dispose();
  }
});

test("Thanh toán chỉ khi có mạng", async ({ page, context, ownerApi }) => {
  const t1 = await ownerApi.table("T1");
  const order = (await ownerApi.openOrders()).find((o) => o.tableId === t1.id);
  expect(order, "seed có đơn mở ở T1").toBeTruthy();

  await page.goto("/pos");
  await tableTile(page, "T1").click();
  const cart = await openCart(page);
  await expect(cart.getByText(`Đơn ${order!.orderNumber}`)).toBeVisible();

  await context.setOffline(true);
  await cart.getByRole("button", { name: "Thanh toán" }).click();
  const dialog = page.getByRole("dialog", { name: /Thanh toán/ });
  await expect(dialog.getByRole("alert")).toContainText(
    "Mất kết nối — chưa thể thanh toán",
  );
  // Chưa có nút xác nhận nào bấm được khi offline
  await expect(
    dialog.getByRole("button", { name: /Xác nhận/, disabled: false }),
  ).toHaveCount(0);
  await context.setOffline(false);
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: /Xác nhận/ })).toBeEnabled();
});

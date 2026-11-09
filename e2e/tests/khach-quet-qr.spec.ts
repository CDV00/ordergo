import { DEMO } from "../env";
import { expect, kdsCard, kdsColumn, menuCard, test, waitRealtime } from "./fixtures";

test("Khách quét QR bàn T5 gọi món → nhân viên nhận thông báo, bếp thấy món", async ({
  page,
  browser,
  ownerApi,
}) => {
  const TABLE = "T5";
  const ITEM = "Nước ép cam";
  const t5 = await ownerApi.table(TABLE);

  // Nhân viên (chủ quán) đang mở màn bếp, đã kết nối realtime
  await page.goto("/kds");
  await waitRealtime(page);

  // Khách: trình duyệt riêng, không đăng nhập, khổ điện thoại
  const guestCtx = await browser.newContext({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const guest = await guestCtx.newPage();
  await guest.goto(`/m/${DEMO.tenantSlug}/t/${t5.id}`);
  await expect(guest).toHaveURL(new RegExp(`/m/${DEMO.tenantSlug}/menu`), { timeout: 20_000 });

  await menuCard(guest, ITEM).click();
  // Sheet tuỳ chọn → "Thêm — 39.000đ"
  await guest.getByRole("button", { name: /^Thêm — / }).click();
  await guest.getByRole("button", { name: /Xem giỏ/ }).click();
  await expect(guest).toHaveURL(/\/cart/);
  await expect(guest.getByText(ITEM)).toBeVisible();
  await guest.getByRole("button", { name: /Gửi đơn xuống bếp/ }).click();
  await expect(guest).toHaveURL(/\/orders/, { timeout: 15_000 });

  // Nhân viên nhận toast realtime
  await expect(page.getByText(`Bàn ${TABLE} vừa gọi món qua QR`)).toBeVisible({ timeout: 5_000 });

  // Bếp thấy món ở cột "Mới"
  const order = (await ownerApi.openOrders()).find((o) => o.tableId === t5.id);
  expect(order, "phải có đơn QR mở ở T5").toBeTruthy();
  await expect(kdsCard(kdsColumn(page, "Mới"), order!.orderNumber, ITEM)).toBeVisible({
    timeout: 5_000,
  });

  await guestCtx.close();
});

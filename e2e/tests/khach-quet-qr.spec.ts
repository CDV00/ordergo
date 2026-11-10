import { DEMO } from "../env";
import {
  expect,
  kdsCard,
  kdsColumn,
  menuCard,
  test,
  waitRealtime,
} from "./fixtures";

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
  await expect(guest).toHaveURL(new RegExp(`/m/${DEMO.tenantSlug}/menu`), {
    timeout: 20_000,
  });

  await menuCard(guest, ITEM).click();
  // Sheet tuỳ chọn → "Thêm — 39.000đ"
  await guest.getByRole("button", { name: /^Thêm — / }).click();
  await guest.getByRole("button", { name: /Xem giỏ/ }).click();
  await expect(guest).toHaveURL(/\/cart/);
  await expect(guest.getByText(ITEM)).toBeVisible();
  await guest.getByRole("button", { name: /Gửi đơn xuống bếp/ }).click();
  await expect(guest).toHaveURL(/\/orders/, { timeout: 15_000 });

  // Nhân viên nhận toast realtime
  await expect(page.getByText(`Bàn ${TABLE} vừa gọi món qua QR`)).toBeVisible({
    timeout: 5_000,
  });

  // Bếp thấy món ở cột "Mới"
  const order = (await ownerApi.openOrders()).find((o) => o.tableId === t5.id);
  expect(order, "phải có đơn QR mở ở T5").toBeTruthy();
  await expect(
    kdsCard(kdsColumn(page, "Mới"), order!.orderNumber, ITEM),
  ).toBeVisible({
    timeout: 5_000,
  });

  await guestCtx.close();
});

test("Khách QR báo trả tiền mặt → thu ngân thấy ở Thanh toán (Chờ xác nhận), xác nhận → khách thấy Đã thanh toán", async ({
  page,
  browser,
  ownerApi,
}) => {
  const TABLE = "L2";
  const ITEM = "Nước ép cam";
  const table = await ownerApi.table(TABLE);

  // Thu ngân mở màn Thanh toán: đơn đang mở của quán nằm ở "Chưa thu"
  await page.goto("/payments");
  const unpaid = page.getByRole("list", { name: "Đơn chưa thu" });
  await expect(
    unpaid.getByRole("button", { name: "Thu tiền" }).first(),
  ).toBeVisible();

  // Khách gọi món qua QR
  const guestCtx = await browser.newContext({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const guest = await guestCtx.newPage();
  await guest.goto(`/m/${DEMO.tenantSlug}/t/${table.id}`);
  await expect(guest).toHaveURL(new RegExp(`/m/${DEMO.tenantSlug}/menu`), {
    timeout: 20_000,
  });
  await menuCard(guest, ITEM).click();
  await guest.getByRole("button", { name: /^Thêm — / }).click();
  await guest.getByRole("button", { name: /Xem giỏ/ }).click();
  await guest.getByRole("button", { name: /Gửi đơn xuống bếp/ }).click();
  await expect(guest).toHaveURL(/\/orders/, { timeout: 15_000 });

  const order = (await ownerApi.openOrders()).find(
    (o) => o.tableId === table.id,
  );
  expect(order, `phải có đơn QR mở ở ${TABLE}`).toBeTruthy();

  // Đơn mới hiện ở "Chưa thu" (realtime)
  await expect(unpaid.getByText(order!.orderNumber)).toBeVisible({
    timeout: 10_000,
  });

  // Khách báo trả tiền mặt (quán demo chưa cài tài khoản nhận chuyển khoản)
  await guest.goto(`/m/${DEMO.tenantSlug}/pay/${order!.id}`);
  await guest.getByRole("button", { name: "Tiền mặt" }).click();
  await expect(
    guest.getByText("Đã báo nhân viên — đang chờ xác nhận"),
  ).toBeVisible();

  // Thu ngân: thông báo + chuyển sang "Chờ xác nhận", không còn ở "Chưa thu"
  await expect(page.getByText(`Bàn ${TABLE} muốn trả tiền mặt`)).toBeVisible({
    timeout: 10_000,
  });
  const pendingRow = page
    .getByRole("listitem")
    .filter({ hasText: order!.orderNumber })
    .filter({ has: page.getByRole("button", { name: "Xác nhận đã thu" }) });
  await expect(pendingRow).toBeVisible();
  await expect(unpaid.getByText(order!.orderNumber)).toBeHidden();

  await pendingRow.getByRole("button", { name: "Xác nhận đã thu" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Đã nhận tiền" })
    .click();
  await expect(page.getByText(`Đã ghi nhận`).first()).toBeVisible();
  await expect(pendingRow).toBeHidden();

  // Khách thấy đơn đã thanh toán
  await expect(guest.getByText("Đã thanh toán ✓")).toBeVisible({
    timeout: 15_000,
  });
  await guestCtx.close();
});

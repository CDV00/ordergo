import { expect, test, vnd, type ApiOrder } from "./fixtures";

test("In hoá đơn: đơn đã thu hiện HOÁ ĐƠN THANH TOÁN và tổng tiền", async ({ page, ownerApi }) => {
  // Chuẩn bị qua API: đơn bàn S3, gửi bếp, thu đủ tiền mặt
  const s3 = await ownerApi.table("S3");
  const banhMi = await ownerApi.menuItem("Bánh mì que pate");
  const croissant = await ownerApi.menuItem("Croissant bơ");
  const created = await ownerApi.post<ApiOrder>("orders", {
    venueId: ownerApi.venueId,
    orderType: "dine_in",
    tableId: s3.id,
    lines: [
      { menuItemId: banhMi.id, quantity: 2 },
      { menuItemId: croissant.id, quantity: 1 },
    ],
  });
  await ownerApi.post(`orders/${created.id}/send-to-kitchen`);
  const order = await ownerApi.order(created.id);
  const total = order.pricing.total.amount;
  await ownerApi.post(`orders/${created.id}/payments`, {
    method: "cash",
    amount: total,
    tenderedAmount: 200_000,
  });
  expect((await ownerApi.order(created.id)).status).toBe("paid");

  await page.goto(`/print/receipt/${created.id}`);
  await expect(page.getByText("HOÁ ĐƠN THANH TOÁN")).toBeVisible();
  await expect(page.getByText(order.orderNumber)).toBeVisible();
  await expect(page.getByText("Bàn: S3")).toBeVisible();
  await expect(page.getByText("Bánh mì que pate")).toBeVisible();
  const totalRow = page.locator(".totals .row").filter({ hasText: "TỔNG CỘNG" });
  await expect(totalRow).toContainText(vnd(total));
});

import { expect, menuCard, openCart, tableTile, test } from "./fixtures";

test("Gọi thêm món: nối vào đơn đang mở của bàn T1, không tạo đơn mới", async ({
  page,
  ownerApi,
}) => {
  const TABLE = "T1";
  const EXTRA = "Croissant bơ";

  const t1 = await ownerApi.table(TABLE);
  const openBefore = await ownerApi.openOrders();
  const before = openBefore.find((o) => o.tableId === t1.id);
  expect(before, "seed phải có đơn đang mở ở T1").toBeTruthy();
  const linesBefore = before!.lines.length;

  await page.goto("/pos");
  await tableTile(page, TABLE).click();
  await expect(page.getByRole("heading", { name: `Bàn ${TABLE}` })).toBeVisible();

  let cart = await openCart(page);
  await expect(cart.getByText("Đã gọi", { exact: true })).toBeVisible();
  await expect(cart.getByText(`Đơn ${before!.orderNumber}`)).toBeVisible();

  await menuCard(page, EXTRA).click();
  cart = await openCart(page);
  await expect(cart.getByText("Gọi thêm", { exact: true })).toBeVisible();
  await cart.getByRole("button", { name: "Gửi thêm" }).click();
  await expect(page.getByText(`Đã gửi thêm 1 món — Bàn ${TABLE}`)).toBeVisible();

  // API: cùng đơn, thêm đúng 1 dòng đã gửi bếp; số đơn đang mở không đổi
  await expect
    .poll(async () => (await ownerApi.order(before!.id)).lines.length)
    .toBe(linesBefore + 1);
  const after = await ownerApi.order(before!.id);
  const extra = after.lines.find((l) => l.productSnapshot.name === EXTRA);
  expect(extra?.sentToKitchenAt).toBeTruthy();
  const openAfter = await ownerApi.openOrders();
  expect(openAfter).toHaveLength(openBefore.length);
  expect(openAfter.filter((o) => o.tableId === t1.id)).toHaveLength(1);

  // UI: trang chi tiết đơn có món vừa gọi thêm
  await page.goto(`/orders/${before!.id}`);
  await expect(page.getByText(before!.orderNumber).first()).toBeVisible();
  await expect(page.getByText(EXTRA).first()).toBeVisible();
});

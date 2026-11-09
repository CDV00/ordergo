import {
  expect,
  kdsCard,
  kdsColumn,
  menuCard,
  openCart,
  pageAs,
  tableTile,
  test,
  waitRealtime,
} from "./fixtures";

// Chủ quán bán hàng trên POS (page mặc định), bếp xem KDS ở máy khác.
// Lưu ý: vai trò thu ngân (cashier) KHÔNG có quyền `order.send_to_kitchen` nên không dùng được nút "Gửi bếp".

test("Một ca bán hàng: gọi món → bếp làm → thu tiền → bàn cần dọn", async ({
  page,
  browser,
}, testInfo) => {
  // Mỗi project dùng bàn trống riêng để không giẫm chân nhau
  const TABLE = testInfo.project.name === "tablet" ? "S4" : "T4";
  const viewport = testInfo.project.use.viewport ?? null;

  // ── Bếp mở KDS trước, chờ kết nối realtime ──
  const kds = await pageAs(browser, "kitchen", viewport);
  await kds.goto("/kds");
  await expect(kds.getByRole("heading", { name: "Màn hình Bếp (KDS)" })).toBeVisible();
  await waitRealtime(kds);

  // ── POS: chọn bàn, thêm món ──
  await page.goto("/pos");
  await expect(page.getByText("Chọn bàn để bắt đầu")).toBeVisible();
  const tile = tableTile(page, TABLE);
  await expect(tile).toContainText("Trống");
  await tile.click();
  await expect(page.getByRole("heading", { name: `Bàn ${TABLE}` })).toBeVisible();

  // Món không có tuỳ chọn → vào giỏ ngay
  await menuCard(page, "Bánh mì que pate").click();

  // Món có tuỳ chọn → hộp thoại chọn size / đường / đá
  await menuCard(page, "Bạc xỉu").click();
  const variant = page.getByRole("dialog", { name: "Bạc xỉu" });
  await expect(variant).toBeVisible();
  await variant.getByRole("button", { name: /^Size L/ }).click();
  await variant.getByRole("button", { name: /^Ít đá/ }).click();
  await variant.getByRole("button", { name: /^Thêm — / }).click();
  await expect(variant).toBeHidden();

  let cart = await openCart(page);
  await expect(cart).toContainText("Bánh mì que pate");
  await expect(cart).toContainText("Bạc xỉu");
  await expect(cart).toContainText("Size L");
  await expect(cart).toContainText("2 món chưa gửi");

  // ── Gửi bếp → tạo đơn ──
  await cart.getByRole("button", { name: "Gửi bếp" }).click();
  const toast = page.getByText(new RegExp(`Đã gửi bếp (\\S+) — Bàn ${TABLE}`));
  await expect(toast).toBeVisible();
  const orderNumber = /Đã gửi bếp (\S+) —/.exec((await toast.textContent()) ?? "")![1];

  cart = await openCart(page);
  await expect(cart.getByText(`Đơn ${orderNumber}`)).toBeVisible();
  await expect(cart.getByText("Đã gọi", { exact: true })).toBeVisible();

  // ── KDS nhận món mới qua realtime (KDS chỉ poll 60s khi đã kết nối → phải là socket) ──
  const fresh = kdsColumn(kds, "Mới");
  const items = ["Bánh mì que pate", "Bạc xỉu"];
  for (const name of items) {
    await expect(kdsCard(fresh, orderNumber, name)).toBeVisible({ timeout: 5_000 });
  }

  // Bếp: Bắt đầu làm → Sẵn sàng → Đã giao cho từng món
  for (const name of items) {
    await kdsCard(fresh, orderNumber, name).getByRole("button", { name: "Bắt đầu làm" }).click();
    const doing = kdsCard(kdsColumn(kds, "Đang làm"), orderNumber, name);
    await expect(doing).toBeVisible();
    await doing.getByRole("button", { name: "Sẵn sàng" }).click();
    const ready = kdsCard(kdsColumn(kds, "Sẵn sàng"), orderNumber, name);
    await expect(ready).toBeVisible();
    await ready.getByRole("button", { name: "Đã giao" }).click();
    await expect(kdsCard(kds, orderNumber, name)).toHaveCount(0);
  }
  await kds.context().close();

  // ── Thu tiền mặt ──
  cart = await openCart(page);
  // POS cập nhật trạng thái món qua realtime
  await expect(cart.getByText("Đã phục vụ")).toHaveCount(2);
  await cart.getByRole("button", { name: "Thanh toán" }).click();

  const pay = page.getByRole("dialog", { name: `Thanh toán — ${TABLE}` });
  await expect(pay).toBeVisible();
  await expect(pay.getByText("Cần thu")).toBeVisible();
  // Nút mệnh giá nhanh đầu tiên lớn hơn số cần thu (vd 100.000đ)
  await pay
    .getByRole("button", { name: /^\d{1,3}(\.\d{3})+đ$/ })
    .first()
    .click();
  await expect(pay.getByText("Trả lại khách")).toBeVisible();
  await pay.getByRole("button", { name: /^Xác nhận / }).click();

  const done = page.getByRole("dialog", { name: "Đã thanh toán" });
  await expect(done).toBeVisible();
  await expect(done.getByText(orderNumber)).toBeVisible();
  await expect(done.getByText("Trả lại khách")).toBeVisible();
  await done.getByRole("button", { name: "Xong" }).click();
  await expect(done).toBeHidden();

  // ── Về màn chọn bàn: bàn vừa thu chuyển "Cần dọn" ──
  await page
    .getByRole("button", { name: /Đổi bàn/ })
    .first()
    .click();
  await expect(page.getByText("Chọn bàn để bắt đầu")).toBeVisible();
  await expect(tableTile(page, TABLE)).toContainText("Cần dọn");
});

import { authFile } from "../env";
import { expect, test } from "./fixtures";

/** Thanh điều hướng bên trái (chỉ hiện ở màn ≥ 1280px) */
const sidebar = (page: import("@playwright/test").Page) =>
  page.getByRole("complementary", { name: "Thanh điều hướng" });

test.describe("Phân quyền", () => {
  test.describe("phục vụ", () => {
    test.use({ storageState: authFile("server") });

    test("không thấy Báo cáo / Nhân viên / Cài đặt và bị đưa khỏi trang tổng quan", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/pos$/);
      await expect(page.getByText("Chọn bàn để bắt đầu")).toBeVisible();

      const nav = sidebar(page);
      await expect(nav.getByRole("link", { name: "POS — Gọi món" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Đơn hàng" })).toBeVisible();
      for (const hidden of ["Báo cáo", "Nhân viên", "Cài đặt", "Tổng quan"]) {
        await expect(nav.getByRole("link", { name: hidden })).toHaveCount(0);
      }
    });
  });

  test.describe("bếp", () => {
    test.use({ storageState: authFile("kitchen") });

    test("vào thẳng màn bếp (KDS)", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/kds$/);
      await expect(page.getByRole("heading", { name: "Màn hình Bếp (KDS)" })).toBeVisible();
      const nav = sidebar(page);
      await expect(nav.getByRole("link", { name: "Màn bếp" })).toBeVisible();
      for (const hidden of ["Báo cáo", "Nhân viên", "Cài đặt", "POS — Gọi món"]) {
        await expect(nav.getByRole("link", { name: hidden })).toHaveCount(0);
      }
    });
  });
});

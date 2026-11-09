import { expect, test as setup } from "@playwright/test";
import { DEMO, authFile, type Role } from "../env";

/**
 * Đăng nhập qua form thật cho từng vai trò rồi lưu storageState (localStorage chứa token).
 * API giới hạn ~10 lần đăng nhập/phút/IP → chỉ đăng nhập ở đây, các test dùng lại state.
 */
const ROLES: Role[] = ["owner", "cashier", "server", "kitchen"];

for (const role of ROLES) {
  setup(`đăng nhập ${role}`, async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("0901234567").first().fill(DEMO.users[role]);
    await page.locator("#login-password").fill(DEMO.password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
    // Chờ app chọn xong tenant + cơ sở (owner: layout tự chọn cơ sở đầu tiên)
    await page.waitForFunction(
      () =>
        !!localStorage.getItem("ordergo.accessToken") &&
        !!localStorage.getItem("ordergo.activeTenantId") &&
        !!localStorage.getItem("ordergo.activeVenueId"),
      undefined,
      { timeout: 20_000 },
    );
    await page.context().storageState({ path: authFile(role) });
  });
}

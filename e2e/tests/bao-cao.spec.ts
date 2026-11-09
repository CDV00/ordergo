import fs from "node:fs";
import { expect, test } from "./fixtures";

test("Báo cáo & xuất CSV: KPI hiển thị, file CSV có BOM UTF-8 và dòng Xuất bởi", async ({
  page,
}) => {
  await page.goto("/reports");
  for (const kpi of ["Doanh thu thuần", "Số đơn", "Giá trị TB/đơn", "Giảm giá"]) {
    await expect(page.getByText(kpi, { exact: true })).toBeVisible();
  }
  // Seed có đơn đã thu trong 7 ngày → doanh thu khác 0
  // Thẻ KPI = khối nhỏ nhất chứa cả tiêu đề lẫn số tiền
  const tile = page
    .locator("div")
    .filter({ has: page.getByText("Doanh thu thuần", { exact: true }) })
    .filter({ hasText: /\d+đ/ })
    .last();
  await expect(tile).toContainText(/[1-9][\d.]*đ/);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^bao-cao-.*\.csv$/);

  const buf = fs.readFileSync(await download.path());
  expect([...buf.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  expect(buf.toString("utf8")).toContain("Xuất bởi:");
  await expect(page.getByText(/^Đã tải bao-cao-/)).toBeVisible();
});

import { test, expect } from "@playwright/test";
import { OperationsPage } from "../pages/OperationsPage";

test.describe("Accenture Technical Challenge - Front End Validations", () => {
  test("Scenario 01: Elements - Practice Form Submission", async ({ page }) => {
    const ops = new OperationsPage(page);

    await test.step("Given the user is on the Automation Practice Form page", async () => {
      await page.goto("https://demoqa.com/automation-practice-form", {
        waitUntil: "domcontentloaded",
      });
      await ops.cleanInterface();
    });

    await test.step("When the user fills in the form with valid dynamic data", async () => {
      await ops.fillPracticeForm(
        "Pedro",
        "Amaral",
        `pedro${Date.now()}@test.com`,
      );
    });

    await test.step("Then a success modal should be displayed", async () => {
      const modal = page.locator(".modal-content");
      await expect(modal).toBeVisible();
      await expect(modal).toContainText("Thanks for submitting the form");
      await page.keyboard.press("Escape");
    });
  });

  test("Scenario 02: Alerts & Windows - Browser Windows Validation", async ({
    page,
  }) => {
    const ops = new OperationsPage(page);

    await test.step("Given the user navigates to the Browser Windows page", async () => {
      await page.goto("https://demoqa.com/browser-windows", {
        waitUntil: "domcontentloaded",
      });
      await ops.cleanInterface();
    });

    await test.step("Then the new window is opened and contains the expected sample text", async () => {
      await ops.validateNewWindow();
    });
  });

  test("Scenario 03: Elements - Web Tables CRUD and Dynamic Bulk Creation", async ({
    page,
  }) => {
    test.setTimeout(120000);
    const ops = new OperationsPage(page);
    const email = "pedro.amaral@test.com";

    await test.step("Given the user is on the Web Tables page", async () => {
      await page.goto("https://demoqa.com/webtables", {
        waitUntil: "domcontentloaded",
      });
      await ops.cleanInterface();
    });

    await test.step("When the user performs CRUD operations on a single record", async () => {
      await ops.createWebTableRecord(
        "Pedro",
        "Amaral",
        email,
        "30",
        "5000",
        "IT",
      );
      await ops.editRecord(email, "Pedro Edited");
      await ops.deleteRecord(email);
    });

    await test.step("And the user creates 12 dynamic records", async () => {
      await ops.createMultipleRecords(12);
    });

    await test.step("Then the user deletes all created dynamic records successfully", async () => {
      const rowsBefore = page
        .locator(".rt-tr-group")
        .filter({ hasText: "@test.com" });
      await expect(rowsBefore).toHaveCount(12);

      await ops.deleteAllDynamicRecords();

      const rowsAfter = page
        .locator(".rt-tr-group")
        .filter({ hasText: "@test.com" });
      await expect(rowsAfter).toHaveCount(0);
    });
  });

  test("Scenario 04: Widgets - Progress Bar Control", async ({ page }) => {
    test.setTimeout(90000);
    const ops = new OperationsPage(page);

    await test.step("Given the user is on the Progress Bar page", async () => {
      await page.goto("https://demoqa.com/progress-bar", {
        waitUntil: "domcontentloaded",
      });
      await ops.cleanInterface();
    });

    await test.step("Then the user interacts with the progress bar and resets it after 100%", async () => {
      await ops.handleProgressBar();
    });
  });

  test("Scenario 05: Interactions - Sortable List Drag and Drop", async ({
    page,
  }) => {
    test.setTimeout(90000);
    const ops = new OperationsPage(page);

    await test.step("Given the user is on the Sortable List page", async () => {
      await page.goto("https://demoqa.com/sortable", {
        waitUntil: "domcontentloaded",
      });
      await ops.cleanInterface();
    });

    await test.step("Then the user reorders the list to descending order successfully", async () => {
      await ops.sortListDescending();
    });
  });
});

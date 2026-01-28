import { Page, expect } from "@playwright/test";

export class OperationsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async cleanInterface(): Promise<void> {
    await this.page.evaluate(() => {
      const selectors = ["#fixedban", "footer", "iframe", ".sidebar-content"];
      selectors.forEach((s) =>
        document.querySelectorAll(s).forEach((el) => el.remove()),
      );
    });
  }

  async fillPracticeForm(
    firstName: string,
    lastName: string,
    email: string,
  ): Promise<void> {
    await this.page.locator("#firstName").fill(firstName);
    await this.page.locator("#lastName").fill(lastName);
    await this.page.locator("#userEmail").fill(email);
    await this.page.locator('label[for="gender-radio-1"]').click();
    await this.page.locator("#userNumber").fill("1234567890");
    await this.page.locator("#submit").click();
  }

  async validateNewWindow(): Promise<void> {
    const [newWindow] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.page.locator("#windowButton").click(),
    ]);
    await newWindow.waitForLoadState();
    const text = await newWindow.locator("#sampleHeading").innerText();
    expect(text).toBe("This is a sample page");
    await newWindow.close();
  }

  async createWebTableRecord(
    fName: string,
    lName: string,
    email: string,
    age: string,
    salary: string,
    dept: string,
  ): Promise<void> {
    await this.page.locator("#addNewRecordButton").click();
    await this.page.locator("#firstName").fill(fName);
    await this.page.locator("#lastName").fill(lName);
    await this.page.locator("#userEmail").fill(email);
    await this.page.locator("#age").fill(age);
    await this.page.locator("#salary").fill(salary);
    await this.page.locator("#department").fill(dept);
    await this.page.locator("#submit").click();
  }

  async editRecord(email: string, newFirstName: string): Promise<void> {
    const row = this.page.locator(".rt-tr-group", { hasText: email });
    await row.locator('[id^="edit-record"]').click();
    await this.page.locator("#firstName").fill(newFirstName);
    await this.page.locator("#submit").click();
  }

  async deleteRecord(email: string): Promise<void> {
    const row = this.page.locator(".rt-tr-group", { hasText: email });
    await row.locator('[id^="delete-record"]').click();
  }

  async createMultipleRecords(count: number): Promise<void> {
    await this.page.selectOption('select[aria-label="rows per page"]', "20");
    for (let i = 1; i <= count; i++) {
      await this.createWebTableRecord(
        `User${i}`,
        `Test${i}`,
        `dynamic${i}@test.com`,
        "30",
        "2000",
        "IT",
      );
    }
  }

  async deleteAllDynamicRecords(): Promise<void> {
    let deleteButtons = this.page.locator('[id^="delete-record"]');
    let count = await deleteButtons.count();
    while (count > 3) {
      await deleteButtons.nth(3).click();
      count = await deleteButtons.count();
    }
  }

  async handleProgressBar(): Promise<void> {
    const startStopButton = this.page.locator("#startStopButton");
    const progressBar = this.page.locator('div[role="progressbar"]');

    await startStopButton.click();

    await this.page.waitForFunction(() => {
      const val = parseInt(
        document
          .querySelector('div[role="progressbar"]')
          ?.getAttribute("aria-valuenow") || "0",
      );
      return val >= 15 && val <= 22;
    });

    await startStopButton.click();

    await this.page.waitForTimeout(5000);

    const valueAfterStop = parseInt(
      (await progressBar.getAttribute("aria-valuenow")) || "0",
    );
    expect(valueAfterStop).toBeLessThanOrEqual(25);
    await startStopButton.click();
    await this.page.waitForFunction(
      () => {
        return document.querySelector(".progress-bar.bg-success") !== null;
      },
      { timeout: 40000 },
    );
    const resetButton = this.page.locator("#resetButton");
    await resetButton.waitFor({ state: "visible" });
    await this.page.waitForTimeout(1000);
    await resetButton.click({ force: true });
    await this.page.waitForTimeout(5000);
    await expect(progressBar).toHaveAttribute("aria-valuenow", "0", {
      timeout: 10000,
    });
  }

  async sortListDescending(): Promise<void> {
    const targetOrder = ["Six", "Five", "Four", "Three", "Two", "One"];

    for (let i = 0; i < targetOrder.length; i++) {
      const itemName = targetOrder[i];

      const itemToMove = this.page
        .locator(".list-group-item")
        .filter({ hasText: itemName })
        .first();

      const targetDestination = this.page.locator(".list-group-item").nth(i);

      const sourceBox = await itemToMove.boundingBox();
      const targetBox = await targetDestination.boundingBox();

      if (sourceBox && targetBox) {
        if (Math.abs(sourceBox.y - targetBox.y) < 5) {
          continue;
        }

        await itemToMove.dragTo(targetDestination, {
          force: true,
          timeout: 10000,
        });

        await this.page.waitForTimeout(1000);
      }
    }

    await this.page.waitForTimeout(5000);

    const listItems = this.page.locator(
      ".vertical-list-container .list-group-item",
    );
    await expect(listItems.nth(0)).toHaveText("Six");
    await expect(listItems.nth(1)).toHaveText("Five");
    await expect(listItems.nth(2)).toHaveText("Four");
    await expect(listItems.nth(3)).toHaveText("Three");
    await expect(listItems.nth(4)).toHaveText("Two");
    await expect(listItems.nth(5)).toHaveText("One");
  }
}

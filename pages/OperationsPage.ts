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

    // 1. Start progress
    await startStopButton.click();

    // 2. Wait to reach a safe range below 25%
    await this.page.waitForFunction(() => {
      const val = parseInt(
        document
          .querySelector('div[role="progressbar"]')
          ?.getAttribute("aria-valuenow") || "0",
      );
      return val >= 15 && val <= 22;
    });

    // 3. Stop progress
    await startStopButton.click();

    // Wait 5s for visualization as requested
    await this.page.waitForTimeout(5000);

    // Validation
    const valueAfterStop = parseInt(
      (await progressBar.getAttribute("aria-valuenow")) || "0",
    );
    expect(valueAfterStop).toBeLessThanOrEqual(25);

    // 4. Resume progress
    await startStopButton.click();

    // 5. Wait for the bar to finish and turn green (bg-success)
    await this.page.waitForFunction(
      () => {
        return document.querySelector(".progress-bar.bg-success") !== null;
      },
      { timeout: 40000 },
    );

    // 6. Interaction with Reset Button
    // We use a specific locator and force the click to ensure the site registers it
    const resetButton = this.page.locator("#resetButton");
    await resetButton.waitFor({ state: "visible" });

    // Brief pause to allow the site's JS to bind the event to the new button
    await this.page.waitForTimeout(1000);
    await resetButton.click({ force: true });

    // Wait 5s for visualization
    await this.page.waitForTimeout(5000);

    // 7. Final assertion with an explicit timeout to wait for the reset animation
    await expect(progressBar).toHaveAttribute("aria-valuenow", "0", {
      timeout: 10000,
    });
  }

  async sortListDescending(): Promise<void> {
    const targetOrder = ["Six", "Five", "Four", "Three", "Two", "One"];

    for (let i = 0; i < targetOrder.length; i++) {
      const itemName = targetOrder[i];

      // Localiza o item que queremos colocar na posição 'i'
      const itemToMove = this.page
        .locator(".list-group-item")
        .filter({ hasText: itemName })
        .first();

      // Localiza quem está ocupando a posição 'i' atualmente
      const targetDestination = this.page.locator(".list-group-item").nth(i);

      const sourceBox = await itemToMove.boundingBox();
      const targetBox = await targetDestination.boundingBox();

      if (sourceBox && targetBox) {
        // Se o item já estiver na posição correta (ou muito perto), pula para o próximo
        if (Math.abs(sourceBox.y - targetBox.y) < 5) {
          continue;
        }

        // Usa o dragTo nativo que é mais estável para evitar erros de 'any' e referências circulares
        await itemToMove.dragTo(targetDestination, {
          force: true,
          timeout: 10000,
        });

        // Pequena pausa para o site processar o rearranjo visual
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

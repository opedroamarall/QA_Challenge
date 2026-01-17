import { Page, expect } from '@playwright/test';
import path from 'path';

export class OperationsPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async fillRegistrationForm(index: number) {
        await this.page.locator('#addNewRecordButton').dispatchEvent('click');
        await this.page.locator('#firstName').fill(`John ${index}`);
        await this.page.locator('#lastName').fill('Doe');
        await this.page.locator('#userEmail').fill(`john.doe${index}@test.com`);
        await this.page.locator('#age').fill('30');
        await this.page.locator('#salary').fill('5000');
        await this.page.locator('#department').fill('QA');
        await this.page.locator('#submit').dispatchEvent('click');
    }

   async uploadFile(): Promise<void> {
    const filePath = path.resolve('data/test-file.txt');
    await this.page.setInputFiles('#uploadFile', filePath);
    await expect(this.page.locator('#uploadedFilePath')).toContainText('test-file.txt');
}
}
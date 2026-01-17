import { test, expect } from '@playwright/test';
import { OperationsPage } from '../pages/OperationsPage';

let userId: string;
let token: string;
const userName = `user_internal_${Date.now()}`;
const password = 'Password123!';

test.describe('Accenture Technical Challenge - DemoQA Automation', () => {

    test('API - Book Store Flow', async ({ request }) => {
        await test.step('Given a new user is created via API', async () => {
            const response = await request.post('https://demoqa.com/Account/v1/User', {
                data: { userName, password }
            });
            expect(response.status()).toBe(201);
            userId = (await response.json()).userID;
        });

        await test.step('When an access token is generated and authorized', async () => {
            const tokenRes = await request.post('https://demoqa.com/Account/v1/GenerateToken', {
                data: { userName, password }
            });
            token = (await tokenRes.json()).token;

            const authRes = await request.post('https://demoqa.com/Account/v1/Authorized', {
                data: { userName, password }
            });
            expect(authRes.status()).toBe(200);
        });

        await test.step('And two available books are rented', async () => {
            const booksRes = await request.get('https://demoqa.com/BookStore/v1/Books');
            const books = await booksRes.json();
            
            const addBooksRes = await request.post('https://demoqa.com/BookStore/v1/Books', {
                headers: { 'Authorization': `Bearer ${token}` },
                data: {
                    userId: userId,
                    collectionOfIsbns: [
                        { isbn: books.books[0].isbn },
                        { isbn: books.books[1].isbn }
                    ]
                }
            });
            expect(addBooksRes.status()).toBe(201);
        });

        await test.step('Then the rented books are verified in the user profile', async () => {
            const profileRes = await request.get(`https://demoqa.com/Account/v1/User/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await profileRes.json();
            expect(data.books.length).toBe(2);
        });
    });

    test('Web Tables - Dynamic Data Management', async ({ page }) => {
        test.setTimeout(120000);
        const ops = new OperationsPage(page);

        await test.step('Given the user is on the Web Tables page', async () => {
            await page.goto('https://demoqa.com/webtables', { waitUntil: 'domcontentloaded' });
        });

        await test.step('When 12 records are added and deleted sequentially', async () => {
            for (let i = 1; i <= 12; i++) {
                await ops.fillRegistrationForm(i);
                await page.locator('span[title="Delete"]').last().dispatchEvent('click');
            }
        });
    });

    test('Browser Windows - Validation', async ({ page, context }) => {
        await test.step('Given the user is on the Browser Windows page', async () => {
            await page.goto('https://demoqa.com/browser-windows');
        });

        await test.step('When a new window is opened', async () => {
            const [newPage] = await Promise.all([
                context.waitForEvent('page'),
                page.locator('#windowButton').dispatchEvent('click')
            ]);
            await newPage.waitForLoadState();
            expect(await newPage.locator('#sampleHeading').textContent()).toBe('This is a sample page');
            await newPage.close();
        });
    });

    test('Progress Bar - Control Flow', async ({ page }) => {
        test.setTimeout(60000);
        await test.step('Given the user is on the Progress Bar page', async () => {
            await page.goto('https://demoqa.com/progress-bar');
        });

        await test.step('When the progress starts and is stopped at 25%', async () => {
            await page.click('#startStopButton');
            await page.waitForFunction(() => {
                const val = document.querySelector('.progress-bar')?.getAttribute('aria-valuenow');
                return parseInt(val || '0') >= 25;
            });
            await page.click('#startStopButton');
        });

        await test.step('Then the progress is completed and reset to 0%', async () => {
            await page.click('#startStopButton');
            await page.waitForSelector('.progress-bar[aria-valuenow="100"]', { timeout: 40000 });
            await page.locator('#resetButton').dispatchEvent('click');
            await expect(page.locator('.progress-bar')).toHaveAttribute('aria-valuenow', '0');
        });
    });

   test('Upload and Download - File Validation', async ({ page }) => {
        const ops = new OperationsPage(page);
        await test.step('Given the user is on the Upload page', async () => {
            await page.goto('https://demoqa.com/upload-download');
        });

        await test.step('When a local file is uploaded', async () => {
            await ops.uploadFile();
        });
    });
});
import { test, expect } from '@playwright/test';

let userId: string;
let token: string;
const userName = `user_internal_${Date.now()}`;
const password = 'Password123!';

test.describe('Accenture Technical Challenge - API Validation', () => {

    test('API - Book Store Flow with Data Validation', async ({ request }) => {
        let bookNames: string[] = [];

        await test.step('Given a new user is created via API', async () => {
            const response = await request.post('https://demoqa.com/Account/v1/User', {
                data: { userName, password }
            });

            const responseData = await response.json();
            expect(response.status()).toBe(201);
            expect(responseData.username).toBe(userName);
            userId = responseData.userID;
            console.log(`User created successfully. ID: ${userId}`);
        });

        await test.step('When an access token is generated and authorized', async () => {
            const tokenRes = await request.post('https://demoqa.com/Account/v1/GenerateToken', {
                data: { userName, password }
            });
            const tokenData = await tokenRes.json();
            token = tokenData.token;
            expect(tokenData.status).toBe('Success');

            const authRes = await request.post('https://demoqa.com/Account/v1/Authorized', {
                data: { userName, password }
            });
            expect(authRes.status()).toBe(200);
            expect(await authRes.text()).toBe('true');
        });

        await test.step('And two available books are rented', async () => {
            const booksRes = await request.get('https://demoqa.com/BookStore/v1/Books');
            const booksData = await booksRes.json();
            
            bookNames = [booksData.books[0].title, booksData.books[1].title];
            console.log(`Selecting books: ${bookNames.join(' and ')}`);

            const addBooksRes = await request.post('https://demoqa.com/BookStore/v1/Books', {
                headers: { 'Authorization': `Bearer ${token}` },
                data: {
                    userId: userId,
                    collectionOfIsbns: [
                        { isbn: booksData.books[0].isbn },
                        { isbn: booksData.books[1].isbn }
                    ]
                }
            });
            expect(addBooksRes.status()).toBe(201);
        });

        await test.step('Then the rented books and titles are verified in the user profile', async () => {
            const profileRes = await request.get(`https://demoqa.com/Account/v1/User/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const userData = await profileRes.json();
            
            expect(userData.books.length).toBe(2);

            const titlesInProfile = userData.books.map((b: any) => b.title);
            
            bookNames.forEach(name => {
                expect(titlesInProfile).toContain(name);
            });

            console.log('Books validated in profile:', titlesInProfile);
        });
    });
});

import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const email = `testuser${timestamp}@example.com`;
const password = 'password123';
const name = `Tester ${timestamp}`;

const BASE_URL = 'https://meeting-notes-six.vercel.app';

test('Full User Flow: Register, Create, Search, Delete', async ({ page }) => {
    // 1. Go to Login
    await page.goto(`${BASE_URL}/login`);

    // 2. Register
    console.log(`Registering user: ${email}`);
    await page.fill('input[name="full_name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Registrovat se")');

    // 3. Verify Dashboard
    await page.waitForURL(/.*(welcome|dashboard).*/, { timeout: 30000 });
    if (page.url().includes('welcome')) {
        await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
    }
    console.log('Logged in and on Dashboard');

    // 4. Create New Meeting
    await page.click('text=Nová schůzka');
    await page.waitForURL(/.*meetings\/new.*/);

    const meetingTitle = `Alpha Meeting ${timestamp}`;
    await page.fill('input[name="title"]', meetingTitle);

    // Fill DATE
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().slice(0, 16);
    await page.fill('input[name="date"]', dateString);

    await page.fill('textarea[name="agenda"]', 'Automated test agenda');
    await page.click('button:has-text("Vytvořit schůzku")');

    // Should redirect to Dashboard
    await page.waitForURL(/.*dashboard.*/, { timeout: 30000 });
    console.log('Meeting created');

    // 5. TEST SEARCH
    // Verify meeting exists initially
    await expect(page.locator('body')).toContainText(meetingTitle);

    // Type into search
    console.log('Testing Search...');
    await page.fill('input[placeholder="Hledat schůzky..."]', 'Alpha');
    await page.waitForTimeout(1000); // Wait for debounce
    await expect(page.locator('body')).toContainText(meetingTitle); // Should still be there

    // Type non-matching
    await page.fill('input[placeholder="Hledat schůzky..."]', 'Zebra');
    await page.waitForTimeout(1000); // Wait for debounce
    await expect(page.locator('body')).not.toContainText(meetingTitle); // Should disappear

    // Clear search
    await page.fill('input[placeholder="Hledat schůzky..."]', '');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toContainText(meetingTitle); // Should reappear
    console.log('Search functionality verified');

    // 5.5 TEST COLOR PICKER
    console.log('Testing Color Picker...');
    // Go to detail
    await page.click(`text=${meetingTitle}`);
    await page.waitForURL(/.*meetings\/.*/);

    // Change color to bright yellow #ffff00
    const testColor = '#ffff00';
    await page.fill('input[type="color"]', testColor);
    // Wait for server action to possibly complete (though fill is fast, maybe wait a tiny bit or just go back)
    await page.waitForTimeout(1000);

    // Go back
    await page.click('text=Zpět na přehled');
    await page.waitForURL(/.*dashboard.*/);

    // Verify color on dashboard card
    const card = page.locator(`a:has-text("${meetingTitle}")`);
    await expect(card).toHaveCSS('border-color', 'rgb(255, 255, 0)');
    console.log('Color change verified');



    // 6. Delete Meeting
    page.on('dialog', dialog => dialog.accept());

    const meetingContainer = page.locator(`div:has-text("${meetingTitle}")`).first();
    const deleteBtn = meetingContainer.locator('button[title="Smazat schůzku"]');
    await deleteBtn.click();
    console.log('Meeting deleted successfully');

    // 7. Logout
    await page.click('text=Odhlásit');
    await page.waitForURL(/.*goodbye.*/);
    console.log('Logged out successfully');
});

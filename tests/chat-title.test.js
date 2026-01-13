const { test, expect } = require('@playwright/test');

test.describe('Chat Title Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('#chat-container');
  });

  test('should create chat with first message as title', async ({ page }) => {
    // Type a message that will be used as the chat title
    const testMessage = 'This is my first message that will become the chat title';
    await page.fill('#user-input', testMessage);

    // Click the send button
    await page.click('#send-btn');

    // Wait for the message to be processed and chat to be saved
    // Since API key is not configured, we expect the settings widget to open
    // But the chat should still be created with the first message as title
    await page.waitForTimeout(1500); // Allow more time for processing

    // Click the chat history button to open the history widget
    await page.click('#chat-history-btn');

    // Wait for the chat history widget to appear (it has class ha-widget)
    await page.waitForSelector('.ha-widget');

    // Find the chat history item that contains the beginning of our message
    const expectedTitle = testMessage.substring(0, 30) + (testMessage.length > 30 ? '...' : '');
    const chatItem = page.locator('.chat-history-item').filter({ hasText: expectedTitle });

    // Verify that the chat item exists and contains the expected title
    await expect(chatItem).toBeVisible();
    await expect(chatItem).toContainText(expectedTitle);

    // Close the chat history widget by clicking outside
    await page.click('body'); // Click outside the widget to close it
  });

  test('should create chat with short message as exact title', async ({ page }) => {
    // Type a short message that will be used as the chat title
    const testMessage = 'Short message';
    await page.fill('#user-input', testMessage);

    // Click the send button
    await page.click('#send-btn');

    // Wait for the message to be processed and chat to be saved
    // Since API key is not configured, we expect the settings widget to open
    // But the chat should still be created with the first message as title
    await page.waitForTimeout(1500); // Allow more time for processing

    // Click the chat history button to open the history widget
    await page.click('#chat-history-btn');

    // Wait for the chat history widget to appear (it has class ha-widget)
    await page.waitForSelector('.ha-widget');

    // Find the chat history item that contains the exact message as title
    const chatItem = page.locator('.chat-history-item').filter({ hasText: testMessage });

    // Verify that the chat item exists and contains the exact message as title
    await expect(chatItem).toBeVisible();
    await expect(chatItem).toContainText(testMessage);

    // Close the chat history widget
    await page.click('body'); // Click outside the widget to close it
  });
});
const { test, expect } = require('@playwright/test');

test.describe('Cancel Message Functionality - Fixed Version', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('#chat-container');
  });

  test('should cancel message and replace thinking widget with cancellation message', async ({ page }) => {
    // Type a message
    await page.fill('#user-input', 'This is a test message');
    
    // Click the send button
    await page.click('#send-btn');
    
    // Wait for the thinking widget to appear (the assistant widget with loading state)
    await expect(page.locator('.msg.assistant .message-loading')).toBeVisible();
    
    // The button should have changed to the cancel/close icon
    await expect(page.locator('#send-btn use')).toHaveAttribute('href', '#icon-close');
    
    // Click the cancel button (which now shows the close icon)
    await page.click('#send-btn');
    
    // The button should change back to the send icon
    await expect(page.locator('#send-btn use')).toHaveAttribute('href', '#icon-send');
    
    // The thinking widget should be replaced with a cancellation message
    await expect(page.locator('.msg.assistant .message-loading')).not.toBeVisible();
    
    // Check that a cancellation message appears
    await expect(page.locator('.msg.assistant').filter({ hasText: 'Request cancelled.' })).toBeVisible();
  });
});
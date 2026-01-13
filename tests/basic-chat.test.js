// tests/basic-chat.test.js
const { test, expect } = require('@playwright/test');

test.describe('GPT Over API Chat Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the chat interface', async ({ page }) => {
    // Check if the main elements are present
    await expect(page.locator('#main-chat-area')).toBeVisible();
    await expect(page.locator('#chat-container')).toBeVisible();
    await expect(page.locator('#user-input')).toBeVisible();
    await expect(page.locator('#send-btn')).toBeVisible();

    // Check if header buttons are present
    await expect(page.locator('#chat-history-btn')).toBeVisible();
    await expect(page.locator('#settings-btn')).toBeVisible();

    // Check if initial greeting widget is displayed
    await expect(page.locator('.msg.assistant').first()).toContainText('Welcome to LocalAIWaves!');
  });

  test('should display chat history modal when history button is clicked', async ({ page }) => {
    // Click the chat history button
    await page.locator('#chat-history-btn').click();

    // Check if the chat history widget appears
    await expect(page.locator('.ha-widget-header')).toContainText('Chat History');
  });

  test('should display settings modal when settings button is clicked', async ({ page }) => {
    // Click the settings button
    await page.locator('#settings-btn').click();

    // Check if the config widget appears
    await expect(page.locator('.ha-widget-header')).toContainText('LLM Settings');
  });

  test('should allow typing and sending a message', async ({ page }) => {
    // Type a message
    await page.locator('#user-input').fill('Hello, world!');

    // Click send
    await page.locator('#send-btn').click();

    // Check if the message appears in the chat
    await expect(page.locator('.msg.user').last()).toContainText('Hello, world!');
  });

  test('should allow creating a new chat', async ({ page }) => {
    // Click the chat history button to open the widget
    await page.locator('#chat-history-btn').click();

    // Click the new chat button in the widget
    await page.locator('#new-chat-btn').click();

    // Check if the new chat is created and the greeting appears
    await expect(page.locator('.msg.assistant').first()).toContainText('Welcome to LocalAIWaves!');
  });

  test('should handle empty messages', async ({ page }) => {
    // Try to send an empty message
    await page.locator('#user-input').fill('');
    await page.locator('#send-btn').click();

    // The message should not be sent (no new user message should appear)
    const userMessages = await page.locator('.msg.user').count();
    expect(userMessages).toBe(0);
  });
});
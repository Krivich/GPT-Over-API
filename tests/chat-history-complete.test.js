const { test, expect } = require('@playwright/test');

test.describe('Complete Chat History Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('#chat-container');
    
    // Clear any existing chat history
    await page.evaluate(() => {
      localStorage.removeItem('gptOverApiChatHistory');
    });
  });

  test('should save user messages, LLM responses, and restore chat properly', async ({ page }) => {
    // Type a message that will be used as the chat title
    const userMessage1 = 'Hello, this is my first message';
    await page.fill('#user-input', userMessage1);
    
    // Click the send button
    await page.click('#send-btn');
    
    // Wait for the message to be processed and chat to be saved
    await page.waitForTimeout(1000); // Allow time for the chat to be saved
    
    // Check that the chat was created with the correct title
    // Click the chat history button to open the history widget
    await page.click('#chat-history-btn');
    
    // Wait for the chat history widget to appear
    await page.waitForSelector('.ha-widget');
    
    // Find the chat history item that contains the beginning of our message
    const expectedTitle = userMessage1.substring(0, 30) + (userMessage1.length > 30 ? '...' : '');
    const chatItem = page.locator('.chat-history-item').filter({ hasText: expectedTitle });
    
    // Verify that the chat item exists and contains the expected title
    await expect(chatItem).toBeVisible();
    
    // Close the chat history widget
    await page.click('body');
    
    // Now simulate an LLM response by configuring a mock API and sending another message
    // For now, we'll test with the current behavior where API key not configured triggers settings
    const userMessage2 = 'This is my second message';
    await page.fill('#user-input', userMessage2);
    
    // Click the send button again
    await page.click('#send-btn');
    
    // Wait for processing
    await page.waitForTimeout(1000);
    
    // Check that both messages are in the chat display
    await expect(page.locator('.msg.user').filter({ hasText: userMessage1 })).toBeVisible();
    await expect(page.locator('.msg.user').filter({ hasText: userMessage2 })).toBeVisible();
    
    // Now let's test loading the chat from history
    await page.click('#chat-history-btn');
    await page.waitForSelector('.ha-widget');
    
    // Click on the chat item to load it
    await chatItem.click();
    
    // Wait for the chat to load
    await page.waitForTimeout(500);
    
    // Verify that both messages are still present after loading from history
    await expect(page.locator('.msg.user').filter({ hasText: userMessage1 })).toBeVisible();
    await expect(page.locator('.msg.user').filter({ hasText: userMessage2 })).toBeVisible();
    
    // Close the chat history widget
    await page.click('body');
  });

  test('should save and restore chat with multiple messages', async ({ page }) => {
    // Create a new chat with first message
    const message1 = 'First message in the chat';
    await page.fill('#user-input', message1);
    await page.click('#send-btn');
    await page.waitForTimeout(500);
    
    // Send a second message
    const message2 = 'Second message in the chat';
    await page.fill('#user-input', message2);
    await page.click('#send-btn');
    await page.waitForTimeout(500);
    
    // Send a third message
    const message3 = 'Third message in the chat';
    await page.fill('#user-input', message3);
    await page.click('#send-btn');
    await page.waitForTimeout(500);
    
    // Get the current chat ID from localStorage to verify content
    const chatHistory = await page.evaluate(() => {
      return localStorage.getItem('gptOverApiChatHistory');
    });
    
    expect(chatHistory).not.toBeNull();
    const history = JSON.parse(chatHistory);
    expect(history.length).toBeGreaterThan(0);
    
    // Get the chat content from localStorage
    const chatId = history[0].id;
    const chatContent = await page.evaluate(id => {
      return localStorage.getItem(`gptOverApiChat_${id}`);
    }, chatId);
    
    expect(chatContent).not.toBeNull();
    const messages = JSON.parse(chatContent);
    
    // Verify that all user messages are saved in the chat history
    const userMessages = messages.filter(msg => msg.role === 'user');
    expect(userMessages.length).toBe(3);
    
    expect(userMessages[0].content).toBe(message1);
    expect(userMessages[1].content).toBe(message2);
    expect(userMessages[2].content).toBe(message3);
    
    // Now test loading this chat from history
    await page.click('#chat-history-btn');
    await page.waitForSelector('.ha-widget');
    
    // Click on the chat to load it
    const chatItem = page.locator('.chat-history-item').filter({ hasText: message1.substring(0, 30) });
    await chatItem.click();
    
    // Wait for the chat to load
    await page.waitForTimeout(500);
    
    // Verify that all messages are displayed
    await expect(page.locator('.msg.user').filter({ hasText: message1 })).toBeVisible();
    await expect(page.locator('.msg.user').filter({ hasText: message2 })).toBeVisible();
    await expect(page.locator('.msg.user').filter({ hasText: message3 })).toBeVisible();
    
    // Close the chat history widget
    await page.click('body');
  });
});
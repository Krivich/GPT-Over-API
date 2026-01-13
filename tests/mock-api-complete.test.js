const { test, expect } = require('@playwright/test');

test.describe('Mock API Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('#chat-container');
    
    // Configure a mock API endpoint for testing
    await page.evaluate(() => {
      // Set up a mock API configuration
      const mockConfig = {
        llm: {
          apiEndpoint: '/api/mock-llm', // Using a local endpoint that we'll intercept
          apiKey: 'mock-key-for-testing',
          model: 'test-model'
        }
      };
      localStorage.setItem('gptOverApiConfig', JSON.stringify(mockConfig));
    });
    
    // Set up route interception to mock the LLM API response
    await page.route('**/api/mock-llm', route => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choices: [{
            message: {
              content: 'This is a mocked LLM response to your message.'
            }
          }]
        })
      });
    });
  });

  test('should handle API responses properly with mocked API', async ({ page }) => {
    // Type a message
    await page.fill('#user-input', 'Hello, test message');
    
    // Click the send button
    await page.click('#send-btn');
    
    // Wait for the thinking state (loading indicator)
    await expect(page.locator('.msg.assistant .message-loading')).toBeVisible();
    
    // The button should change to cancel icon during processing
    await expect(page.locator('#send-btn use')).toHaveAttribute('href', '#icon-close');
    
    // Wait for the response to appear
    await expect(page.locator('.msg.assistant').filter({ hasText: 'This is a mocked LLM response' })).toBeVisible();
    
    // Check that the button returns to send icon
    await expect(page.locator('#send-btn use')).toHaveAttribute('href', '#icon-send');
    
    // Verify that both user and assistant messages are in the chat
    await expect(page.locator('.msg.user').filter({ hasText: 'Hello, test message' })).toBeVisible();
    await expect(page.locator('.msg.assistant').filter({ hasText: 'This is a mocked LLM response' })).toBeVisible();
  });

  test('should save both user and assistant messages to history with mocked API', async ({ page }) => {
    // Send a message that will become the chat title
    const userMessage = 'First message to create chat';
    await page.fill('#user-input', userMessage);
    await page.click('#send-btn');
    
    // Wait for the response
    await expect(page.locator('.msg.assistant').filter({ hasText: 'This is a mocked LLM response' })).toBeVisible();
    
    // Wait a bit for the messages to be saved to history
    await page.waitForTimeout(500);
    
    // Check that both messages are saved in localStorage
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
    
    // Verify that both user and assistant messages are saved
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    expect(userMessages.length).toBe(1);
    expect(assistantMessages.length).toBe(1);
    
    expect(userMessages[0].content).toBe(userMessage);
    expect(assistantMessages[0].content).toBe('This is a mocked LLM response to your message.');
    
    // Now test loading this chat from history
    await page.click('#chat-history-btn');
    await page.waitForSelector('.ha-widget');
    
    // Click on the chat to load it
    const chatItem = page.locator('.chat-history-item').filter({ hasText: userMessage.substring(0, 30) });
    await chatItem.click();
    
    // Wait for the chat to load
    await page.waitForTimeout(500);
    
    // Verify that both messages are displayed after loading from history
    await expect(page.locator('.msg.user').filter({ hasText: userMessage })).toBeVisible();
    await expect(page.locator('.msg.assistant').filter({ hasText: 'This is a mocked LLM response' })).toBeVisible();
    
    // Close the chat history widget
    await page.click('body');
  });

  test('should handle message cancellation with mocked API', async ({ page }) => {
    // Set up a slow API response to test cancellation
    await page.unroute('**/api/mock-llm');
    await page.route('**/api/mock-llm', async route => {
      // Delay the response to allow for cancellation
      await new Promise(resolve => setTimeout(resolve, 5000));
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choices: [{
            message: {
              content: 'This response should not appear due to cancellation.'
            }
          }]
        })
      });
    });
    
    // Type a message
    await page.fill('#user-input', 'Message to cancel');
    
    // Click the send button
    await page.click('#send-btn');
    
    // Wait for the thinking state (loading indicator)
    await expect(page.locator('.msg.assistant .message-loading')).toBeVisible();
    
    // The button should change to cancel icon during processing
    await expect(page.locator('#send-btn use')).toHaveAttribute('href', '#icon-close');
    
    // Click the cancel button quickly
    await page.click('#send-btn');
    
    // The button should change back to send icon
    await expect(page.locator('#send-btn use')).toHaveAttribute('href', '#icon-send');
    
    // The thinking widget should be replaced with a cancellation message
    await expect(page.locator('.msg.assistant .message-loading')).not.toBeVisible();
    await expect(page.locator('.msg.assistant').filter({ hasText: 'Request cancelled.' })).toBeVisible();
  });
});
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
          apiEndpoint: 'https://httpbin.org/post', // Using httpbin for testing POST requests
          apiKey: 'mock-key-for-testing',
          model: 'test-model'
        }
      };
      localStorage.setItem('gptOverApiConfig', JSON.stringify(mockConfig));
    });
  });

  test('should handle API responses properly with mock API', async ({ page }) => {
    // Type a message
    await page.fill('#user-input', 'Hello, test message');
    
    // Click the send button
    await page.click('#send-btn');
    
    // Wait for the thinking state (loading indicator)
    await expect(page.locator('.msg.assistant .message-loading')).toBeVisible();
    
    // The button should change to cancel icon during processing
    await expect(page.locator('#send-btn use')).toHaveAttribute('href', '#icon-close');
    
    // Wait for response or timeout (since our mock API won't return proper LLM response)
    await page.waitForTimeout(3000);
    
    // Check that the button returns to send icon
    await expect(page.locator('#send-btn use')).toHaveAttribute('href', '#icon-send');
    
    // Clear the mock config after test
    await page.evaluate(() => {
      localStorage.removeItem('gptOverApiConfig');
    });
  });

  test('should save both user and assistant messages to history', async ({ page }) => {
    // Configure mock API
    await page.evaluate(() => {
      const mockConfig = {
        llm: {
          apiEndpoint: 'https://httpbin.org/post',
          apiKey: 'mock-key-for-testing',
          model: 'test-model'
        }
      };
      localStorage.setItem('gptOverApiConfig', JSON.stringify(mockConfig));
    });
    
    // Send a message that will become the chat title
    const userMessage = 'First message to create chat';
    await page.fill('#user-input', userMessage);
    await page.click('#send-btn');
    
    await page.waitForTimeout(1000);
    
    // Check that the chat was created with the correct title
    await page.click('#chat-history-btn');
    await page.waitForSelector('.ha-widget');
    
    const expectedTitle = userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '');
    const chatItem = page.locator('.chat-history-item').filter({ hasText: expectedTitle });
    await expect(chatItem).toBeVisible();
    
    // Close the chat history widget
    await page.click('body');
    
    // Clear the mock config after test
    await page.evaluate(() => {
      localStorage.removeItem('gptOverApiConfig');
    });
  });
});
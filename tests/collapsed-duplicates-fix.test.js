const { test, expect } = require('@playwright/test');

test.describe('Collapsed Messages Duplicate Widgets Fix', () => {
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

  test('should not create duplicate collapsed widgets during rapid context updates', async ({ page }) => {
    // Create mock API configuration
    await page.evaluate(() => {
      const mockConfig = {
        llm: {
          apiEndpoint: 'https://httpbin.org/post',
          apiKey: 'mock-key',
          model: 'test-model'
        }
      };
      localStorage.setItem('gptOverApiConfig', JSON.stringify(mockConfig));
    });
    
    await page.route('**/post', route => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choices: [{
            message: {
              content: 'Test response'
            }
          }]
        })
      });
    });

    // Create a chat history that will definitely have non-context sequences
    const messages = [
      'First topic message 1',
      'First topic message 2', 
      'First topic message 3',
      'First topic message 4',
      'Unrelated message A',
      'Unrelated message B', 
      'Unrelated message C',
      'Unrelated message D',
      'First topic follow up 1',
      'First topic follow up 2'
    ];

    for (const msg of messages) {
      await page.fill('#user-input', msg);
      await page.click('#send-btn');
      await page.waitForTimeout(500);
    }

    // Count initial collapsed widgets
    let initialCollapsedCount = await page.locator('.collapsed-messages-widget').count();
    console.log(`Initial collapsed widgets: ${initialCollapsedCount}`);

    // Rapidly type different queries to trigger multiple context updates
    const queries = [
      'First topic',
      'Unrelated',
      'topic message',
      'follow up',
      'different query'
    ];

    for (const query of queries) {
      await page.fill('#user-input', query);
      await page.waitForTimeout(200); // Short delay to allow context update
    }

    // Wait for the last context update to settle
    await page.waitForTimeout(500);

    // Count collapsed widgets after rapid updates
    const finalCollapsedCount = await page.locator('.collapsed-messages-widget').count();
    console.log(`Final collapsed widgets after rapid updates: ${finalCollapsedCount}`);

    // The count should not have increased dramatically (indicating no duplicates)
    // Allow for some variation in context selection, but not exponential growth
    expect(finalCollapsedCount).toBeLessThanOrEqual(initialCollapsedCount + 3); // Small buffer for context changes
    
    // Test that expand/collapse still works properly after the rapid updates
    const collapsedWidgets = page.locator('.collapsed-messages-widget');
    const widgetCount = await collapsedWidgets.count();
    
    if (widgetCount > 0) {
      const firstWidget = collapsedWidgets.first();
      const initialText = await firstWidget.locator('.collapse-count').textContent();
      
      // Click to expand
      await firstWidget.click();
      await page.waitForTimeout(300);
      
      const expandedText = await firstWidget.locator('.collapse-count').textContent();
      expect(expandedText).not.toBe(initialText);
      
      // Click to collapse again
      await firstWidget.click();
      await page.waitForTimeout(300);
      
      const collapsedText = await firstWidget.locator('.collapse-count').textContent();
      expect(collapsedText).not.toBe(expandedText);
    }
  });

  test('should maintain consistent collapsed widget count across multiple context updates', async ({ page }) => {
    // Create mock API configuration
    await page.evaluate(() => {
      const mockConfig = {
        llm: {
          apiEndpoint: 'https://httpbin.org/post',
          apiKey: 'mock-key',
          model: 'test-model'
        }
      };
      localStorage.setItem('gptOverApiConfig', JSON.stringify(mockConfig));
    });
    
    await page.route('**/post', route => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choices: [{
            message: {
              content: 'Test response'
            }
          }]
        })
      });
    });

    // Create a predictable chat sequence
    const messages = [
      'A topic one message',
      'A topic one message again', 
      'A topic one another',
      'B topic two message',
      'B topic two message again',
      'C random message',
      'C random message again',
      'A topic one follow up'
    ];

    for (const msg of messages) {
      await page.fill('#user-input', msg);
      await page.click('#send-btn');
      await page.waitForTimeout(400);
    }

    // Test multiple context queries and verify widget count remains reasonable
    const testQueries = [
      'topic one',
      'topic two', 
      'random',
      'A topic',
      'B topic'
    ];

    let previousCount = -1;
    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      await page.fill('#user-input', query);
      await page.waitForTimeout(600); // Wait for context update to complete
      
      const currentCount = await page.locator('.collapsed-messages-widget').count();
      console.log(`Collapsed widgets after query "${query}": ${currentCount}`);
      
      // Store the first count to compare with later ones
      if (previousCount === -1) {
        previousCount = currentCount;
      } else {
        // The count should not grow exponentially with each query
        // It might vary slightly based on context selection, but shouldn't accumulate
        expect(currentCount).toBeLessThan(previousCount + 5); // Reasonable upper bound
      }
    }
  });
});
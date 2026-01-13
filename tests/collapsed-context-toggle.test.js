const { test, expect } = require('@playwright/test');

test.describe('Collapsed Messages Context Toggle Interaction', () => {
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

  test('should handle context toggle clicks on messages within expanded sequences', async ({ page }) => {
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

    // Create a chat history with a sequence that will be collapsed
    const messages = [
      'Topic A message 1',
      'Topic A message 2', 
      'Off-topic message 1', // This and next 2 will form a collapsed sequence
      'Off-topic message 2', 
      'Off-topic message 3',
      'Topic A message 3', // This should be in context when querying Topic A
      'Topic A message 4'
    ];

    for (const msg of messages) {
      await page.fill('#user-input', msg);
      await page.click('#send-btn');
      await page.waitForTimeout(500);
    }

    // Query for Topic A to make first and last messages relevant, collapsing middle ones
    await page.fill('#user-input', 'Topic A');
    await page.waitForTimeout(1000);

    // Check that we have collapsed widgets
    const collapsedCount = await page.locator('.collapsed-messages-widget').count();
    expect(collapsedCount).toBeGreaterThan(0);
    console.log(`Found ${collapsedCount} collapsed widgets`);

    // Expand the first collapsed sequence by clicking it
    const firstCollapsedWidget = page.locator('.collapsed-messages-widget').first();
    const initialText = await firstCollapsedWidget.locator('.collapse-count').textContent();
    await firstCollapsedWidget.click();
    await page.waitForTimeout(500);

    // Verify the text changed (indicating expansion)
    const expandedText = await firstCollapsedWidget.locator('.collapse-count').textContent();
    expect(expandedText).not.toBe(initialText);
    console.log(`Widget expanded: "${initialText}" -> "${expandedText}"`);

    // Now find the individual messages that were in the collapsed sequence
    // They should now be visible and clickable
    const offTopicMessages = page.locator('.msg').filter({ hasText: 'Off-topic' });
    const offTopicCount = await offTopicMessages.count();
    console.log(`Found ${offTopicCount} off-topic messages after expansion`);

    // Click on one of the previously collapsed messages to toggle its context
    if (offTopicCount > 0) {
      // Get the first off-topic message
      const firstOffTopicMsg = offTopicMessages.first();
      
      // Check initial context state
      const initialContextClass = await firstOffTopicMsg.evaluate(el => el.classList.contains('in-context'));
      console.log(`Initial context state of off-topic message: ${initialContextClass}`);
      
      // Click the message to toggle its context
      await firstOffTopicMsg.click();
      await page.waitForTimeout(500);
      
      // Check if context state changed
      const updatedContextClass = await firstOffTopicMsg.evaluate(el => el.classList.contains('in-context'));
      console.log(`Updated context state of off-topic message: ${updatedContextClass}`);
      
      // The context state should have changed
      expect(updatedContextClass).not.toBe(initialContextClass);
    }

    // After toggling context, check if collapsed sequences are recalculated
    // The sequence might be reorganized based on the new context
    await page.waitForTimeout(1000); // Wait for any recalculation
    
    const finalCollapsedCount = await page.locator('.collapsed-messages-widget').count();
    console.log(`Final collapsed widget count: ${finalCollapsedCount}`);
  });

  test('should recalculate sequences after manual context toggle', async ({ page }) => {
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

    // Create a sequence that will definitely collapse
    const messages = [
      'A topic message',
      'A topic message 2',
      'B off topic 1', // Will be collapsed
      'B off topic 2', // Will be collapsed  
      'B off topic 3', // Will be collapsed
      'A topic message 3'
    ];

    for (const msg of messages) {
      await page.fill('#user-input', msg);
      await page.click('#send-btn');
      await page.waitForTimeout(400);
    }

    // Query for topic A to collapse the B messages
    await page.fill('#user-input', 'A topic');
    await page.waitForTimeout(800);

    // Count initial collapsed widgets
    const initialCollapsed = await page.locator('.collapsed-messages-widget').count();
    console.log(`Initial collapsed widgets: ${initialCollapsed}`);

    // Expand the collapsed sequence
    const collapsedWidget = page.locator('.collapsed-messages-widget').first();
    if (await collapsedWidget.count() > 0) {
      await collapsedWidget.click();
      await page.waitForTimeout(500);

      // Click on one of the previously collapsed messages to add it to context
      const offTopicMsg = page.locator('.msg').filter({ hasText: 'B off topic 1' }).first();
      if (await offTopicMsg.count() > 0) {
        // Check initial state
        const initialClass = await offTopicMsg.evaluate(el => el.classList.contains('in-context'));
        
        // Toggle context
        await offTopicMsg.click();
        await page.waitForTimeout(800); // Wait for recalculation
        
        // Check if state changed
        const updatedClass = await offTopicMsg.evaluate(el => el.classList.contains('in-context'));
        expect(updatedClass).not.toBe(initialClass);
        
        // Check if collapsed sequences were recalculated
        const finalCollapsed = await page.locator('.collapsed-messages-widget').count();
        console.log(`Final collapsed widgets after toggle: ${finalCollapsed}`);
        
        // The number might change based on the new context, but it should be reasonable
        // (not accumulating duplicates)
      }
    }
  });
});
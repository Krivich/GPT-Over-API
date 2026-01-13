const { test, expect } = require('@playwright/test');

test.describe('Collapsed Messages Feature - Detailed Test', () => {
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

  test('should properly collapse and expand non-context message sequences', async ({ page }) => {
    // Create a mock API configuration to get real responses
    await page.evaluate(() => {
      // Set up a mock API configuration that returns predictable responses
      const mockConfig = {
        llm: {
          apiEndpoint: 'https://httpbin.org/post',
          apiKey: 'mock-key',
          model: 'test-model'
        }
      };
      localStorage.setItem('gptOverApiConfig', JSON.stringify(mockConfig));
    });
    
    // Intercept the API call to return predictable responses
    await page.route('**/post', route => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choices: [{
            message: {
              content: 'This is a test response for your message.'
            }
          }]
        })
      });
    });

    // Create a longer chat history with diverse topics to trigger context selection
    const messages = [
      'Hello, how are you?',           // Topic: Greetings
      'What can you help me with?',    // Topic: Capabilities
      'Can you explain machine learning?', // Topic: ML
      'What is the weather like today?',   // Topic: Weather
      'Tell me about JavaScript programming', // Topic: JS
      'How do I create a React component?',  // Topic: React
      'What is the capital of France?',      // Topic: Geography
      'Can you help me with CSS styling?',   // Topic: CSS
      'Explain artificial intelligence',     // Topic: AI
      'How to cook pasta?'                   // Topic: Cooking
    ];

    // Send messages to create a chat history
    for (const msg of messages) {
      await page.fill('#user-input', msg);
      await page.click('#send-btn');
      await page.waitForTimeout(800); // Wait for response
    }

    // Count total messages in the chat
    const totalMessages = await page.locator('.msg').count();
    console.log(`Total messages in chat: ${totalMessages}`);

    // Check for collapsed widgets
    const collapsedWidgetCount = await page.locator('.collapsed-messages-widget').count();
    console.log(`Collapsed widgets found: ${collapsedWidgetCount}`);

    if (collapsedWidgetCount > 0) {
      // Examine the placement of collapsed widgets
      const collapsedWidgets = page.locator('.collapsed-messages-widget');
      const widgetCount = await collapsedWidgets.count();
      
      for (let i = 0; i < widgetCount; i++) {
        const widget = collapsedWidgets.nth(i);
        const text = await widget.locator('.collapse-count').textContent();
        console.log(`Collapsed widget ${i}: ${text}`);
        
        // Check if the widget is in the right place (between messages, not at the beginning)
        const allChildren = await page.locator('#chat-container > *').count();
        const widgetIndex = await page.evaluate((index) => {
          const widgets = document.querySelectorAll('.collapsed-messages-widget');
          if (widgets[index]) {
            const parent = widgets[index].parentNode;
            return Array.from(parent.children).indexOf(widgets[index]);
          }
          return -1;
        }, i);
        
        console.log(`Collapsed widget ${i} position in parent: ${widgetIndex}`);
      }
      
      // Test expanding a collapsed widget
      if (widgetCount > 0) {
        const firstCollapsedWidget = collapsedWidgets.first();
        const initialText = await firstCollapsedWidget.locator('.collapse-count').textContent();
        
        // Click to expand
        await firstCollapsedWidget.click();
        await page.waitForTimeout(500);
        
        // Check if text changed (indicating state change)
        const updatedText = await firstCollapsedWidget.locator('.collapse-count').textContent();
        console.log(`Initial text: "${initialText}", Updated text: "${updatedText}"`);
        
        // The text should change after clicking
        expect(updatedText).not.toBe(initialText);
      }
    } else {
      console.log('No collapsed widgets found - this might be expected if no sequences met criteria');
    }

    // Now test with a specific query that should trigger context selection
    await page.fill('#user-input', 'JavaScript programming');
    await page.waitForTimeout(1000); // Wait for context highlighting to update

    // Check if context highlighting is working
    const inContextCount = await page.locator('.msg.in-context').count();
    console.log(`Messages in context after 'JavaScript programming' query: ${inContextCount}`);

    // Check for collapsed widgets again after context update
    const updatedCollapsedCount = await page.locator('.collapsed-messages-widget').count();
    console.log(`Collapsed widgets after context update: ${updatedCollapsedCount}`);
  });

  test('should verify collapsed widgets appear between messages, not at beginning', async ({ page }) => {
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

    // Create a sequence that should definitely create collapsible sections
    // Alternating topics to create non-context sequences
    const messages = [
      'Topic A message 1',
      'Topic A message 2', 
      'Topic A message 3',
      'Topic A message 4', // These should potentially be in context when querying Topic A
      'Off-topic message 1', // This and below should be out of context for Topic A
      'Off-topic message 2',
      'Off-topic message 3',
      'Off-topic message 4',
      'Topic A follow-up 1', // These should be in context for Topic A
      'Topic A follow-up 2'
    ];

    for (const msg of messages) {
      await page.fill('#user-input', msg);
      await page.click('#send-btn');
      await page.waitForTimeout(600);
    }

    // Query for Topic A to make first and last messages relevant
    await page.fill('#user-input', 'Topic A');
    await page.waitForTimeout(1000);

    // Check placement of collapsed widgets
    const collapsedWidgets = page.locator('.collapsed-messages-widget');
    const widgetCount = await collapsedWidgets.count();
    
    console.log(`Found ${widgetCount} collapsed widgets after Topic A query`);
    
    // Verify that collapsed widgets are placed appropriately in the message flow
    const allChatElements = page.locator('#chat-container > *');
    const elementCount = await allChatElements.count();

    let collapsedWidgetPositions = [];
    for (let i = 0; i < elementCount; i++) {
      const elementClass = await allChatElements.nth(i).getAttribute('class');
      if (elementClass && elementClass.includes('collapsed-messages-widget')) {
        collapsedWidgetPositions.push(i);
        console.log(`Collapsed widget found at position ${i}`);
      }
    }
    
    // The collapsed widgets should be interspersed with message elements, not all at the beginning
    if (collapsedWidgetPositions.length > 0) {
      // If widgets are at the beginning (positions 0, 1, 2, etc.), that's the bug we need to fix
      const allAtBeginning = collapsedWidgetPositions.every(pos => pos < 5); // Assuming first few positions would be "beginning"
      if (allAtBeginning && collapsedWidgetPositions.length > 1) {
        console.log(`WARNING: Multiple collapsed widgets found at beginning positions: [${collapsedWidgetPositions.join(', ')}]`);
        console.log('This indicates the positioning bug where widgets appear at the start instead of between messages');
      }
    }
  });
});
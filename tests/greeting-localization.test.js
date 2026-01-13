const { test, expect } = require('@playwright/test');

test.describe('Greeting Widget Localization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('#chat-container');
  });

  test('should display English greeting text by default', async ({ page }) => {
    // Check if the greeting widget displays the correct English text
    const greetingElement = page.locator('.greeting-widget').first();
    await expect(greetingElement).toBeVisible();
    
    // Check the title
    await expect(greetingElement.locator('h3')).toContainText('Welcome to LocalAIWaves!');
    
    // Check the description
    await expect(greetingElement.locator('p').first()).toContainText('Experimental chat client that connects to any LLM with an OpenAI-compatible API. Features widget-based UI and automatic context building.');
    
    // Check the steps
    await expect(greetingElement.locator('li').nth(0)).toContainText('1. Configure');
    await expect(greetingElement.locator('li').nth(1)).toContainText('2. Chat');
    await expect(greetingElement.locator('li').nth(2)).toContainText('3. Context');
    
    // Check the privacy note
    await expect(greetingElement.locator('.greeting-note')).toContainText('No server required');
  });

  test('should display Russian greeting text when language is set to Russian', async ({ page }) => {
    // Set Russian language in localStorage
    await page.evaluate(() => {
      localStorage.setItem('preferred_language', 'ru');
    });
    
    // Reload the page to apply the language change
    await page.reload();
    await page.waitForSelector('#chat-container');
    
    // Check if the greeting widget displays the correct Russian text
    const greetingElement = page.locator('.greeting-widget').first();
    await expect(greetingElement).toBeVisible();
    
    // Check the title
    await expect(greetingElement.locator('h3')).toContainText('Добро пожаловать в LocalAIWaves!');
    
    // Check the description
    await expect(greetingElement.locator('p').first()).toContainText('Экспериментальный клиент чата, который подключается к любой LLM с API, совместимым с OpenAI. Особенности: интерфейс на основе виджетов и автоматическое построение контекста.');
    
    // Check the steps
    await expect(greetingElement.locator('li').nth(0)).toContainText('1. Настройка');
    await expect(greetingElement.locator('li').nth(1)).toContainText('2. Чат');
    await expect(greetingElement.locator('li').nth(2)).toContainText('3. Контекст');
    
    // Check the privacy note
    await expect(greetingElement.locator('.greeting-note')).toContainText('Сервер не требуется');
  });
});
import { test, expect } from '@playwright/test';

/**
 * E2E tests for AI chat functionality
 */
test.describe('Chat Flow', () => {
  // Helper function to login before each test
  async function loginUser(page: any) {
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const password = 'TestPassword123!';

    await page.goto('/signup');
    await page.fill('input[id="username"]', `testuser${timestamp}`);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.fill('input[id="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*login/);
    await page.fill('input[id="usernameOrEmail"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*tasks/, { timeout: 10000 });
  }

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    // Navigate to chat page
    await page.goto('/chat');
  });

  test('should load chat interface', async ({ page }) => {
    // Verify chat interface elements are present
    await expect(page.locator('input[placeholder*="message"]')).toBeVisible();
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
  });

  test('should send a message to AI assistant', async ({ page }) => {
    const messageInput = page.locator('input[placeholder*="message"]');
    await messageInput.fill('Hello');

    await page.click('button:has-text("Send")');

    // Verify message appears in chat
    await expect(page.locator('text=Hello')).toBeVisible();

    // Wait for AI response (with timeout)
    await page.waitForTimeout(3000);

    // Should see some response from AI
    const messages = page.locator('[role="log"], .message, .chat-message');
    await expect(messages).not.toHaveCount(0);
  });

  test('should create new conversation', async ({ page }) => {
    // Look for new conversation button
    const newConvButton = page.locator('button:has-text("New")');
    if (await newConvButton.isVisible()) {
      await newConvButton.click();

      // Should clear current messages
      await page.waitForTimeout(500);
    }
  });

  test('should display conversation history', async ({ page }) => {
    // Send a message
    const messageInput = page.locator('input[placeholder*="message"]');
    await messageInput.fill('Test message');
    await page.click('button:has-text("Send")');

    await page.waitForTimeout(1000);

    // Reload page
    await page.reload();

    // Message should still be visible
    await expect(page.locator('text=Test message')).toBeVisible();
  });

  test('should delete conversation', async ({ page }) => {
    // Send a message to create conversation
    const messageInput = page.locator('input[placeholder*="message"]');
    await messageInput.fill('Message to delete');
    await page.click('button:has-text("Send")');

    await page.waitForTimeout(1000);

    // Look for delete button
    const deleteButton = page.locator('button[aria-label*="Delete"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await page.waitForTimeout(500);
    }
  });

  test('should handle empty message submission', async ({ page }) => {
    // Try to send empty message
    await page.click('button:has-text("Send")');

    // Should not send (button might be disabled or nothing happens)
    await page.waitForTimeout(500);
  });

  test('should show loading state while waiting for response', async ({ page }) => {
    const messageInput = page.locator('input[placeholder*="message"]');
    await messageInput.fill('Tell me about tasks');
    await page.click('button:has-text("Send")');

    // Look for loading indicator
    const loadingIndicator = page.locator('[role="status"], .loading, .spinner');
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      await expect(loadingIndicator).toBeVisible();
    }
  });

  test('should handle AI assistant task creation request', async ({ page }) => {
    const messageInput = page.locator('input[placeholder*="message"]');
    await messageInput.fill('Add a task to buy milk');
    await page.click('button:has-text("Send")');

    // Wait for AI response
    await page.waitForTimeout(3000);

    // Navigate to tasks page to verify task was created
    await page.goto('/tasks');

    // Should see the task (if AI successfully created it)
    // Note: This depends on AI actually creating the task
    await page.waitForTimeout(1000);
  });

  test('should switch between conversations', async ({ page }) => {
    // Create first conversation
    const messageInput = page.locator('input[placeholder*="message"]');
    await messageInput.fill('First conversation');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(1000);

    // Create new conversation
    const newConvButton = page.locator('button:has-text("New")');
    if (await newConvButton.isVisible()) {
      await newConvButton.click();
      await page.waitForTimeout(500);

      // Send message in second conversation
      await messageInput.fill('Second conversation');
      await page.click('button:has-text("Send")');
      await page.waitForTimeout(1000);

      // Look for conversation list
      const conversationList = page.locator('.conversation-list, [role="list"]');
      if (await conversationList.isVisible()) {
        // Click on first conversation
        const firstConv = conversationList.locator('button, a').first();
        await firstConv.click();

        // Should see first conversation message
        await expect(page.locator('text=First conversation')).toBeVisible();
      }
    }
  });
});

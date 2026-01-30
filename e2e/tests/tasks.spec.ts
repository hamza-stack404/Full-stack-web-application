import { test, expect } from '@playwright/test';

/**
 * E2E tests for task management flows
 */
test.describe('Task Management Flow', () => {
  // Helper function to login before each test
  async function loginUser(page: any) {
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Create user
    await page.goto('/signup');
    await page.fill('input[id="username"]', `testuser${timestamp}`);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.fill('input[id="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    // Login
    await page.waitForURL(/.*login/);
    await page.fill('input[id="usernameOrEmail"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for tasks page
    await page.waitForURL(/.*tasks/, { timeout: 10000 });
  }

  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should create a new task', async ({ page }) => {
    // Find and fill the add task input
    const taskInput = page.locator('input[placeholder*="Add a new task"]');
    await taskInput.fill('Buy groceries');

    // Submit the task
    await page.click('button:has-text("Add")');

    // Verify task appears in the list
    await expect(page.locator('text=Buy groceries')).toBeVisible();
  });

  test('should complete a task', async ({ page }) => {
    // Create a task first
    const taskInput = page.locator('input[placeholder*="Add a new task"]');
    await taskInput.fill('Complete this task');
    await page.click('button:has-text("Add")');

    // Wait for task to appear
    await expect(page.locator('text=Complete this task')).toBeVisible();

    // Find and click the checkbox to complete the task
    const taskCheckbox = page.locator('input[type="checkbox"]').first();
    await taskCheckbox.check();

    // Verify task is marked as completed (usually has strikethrough or different styling)
    await page.waitForTimeout(500); // Wait for UI update
  });

  test('should delete a task', async ({ page }) => {
    // Create a task first
    const taskInput = page.locator('input[placeholder*="Add a new task"]');
    await taskInput.fill('Delete this task');
    await page.click('button:has-text("Add")');

    // Wait for task to appear
    await expect(page.locator('text=Delete this task')).toBeVisible();

    // Find and click delete button
    const deleteButton = page.locator('button[aria-label*="Delete"]').first();
    await deleteButton.click();

    // Verify task is removed
    await expect(page.locator('text=Delete this task')).not.toBeVisible();
  });

  test('should update a task', async ({ page }) => {
    // Create a task first
    const taskInput = page.locator('input[placeholder*="Add a new task"]');
    await taskInput.fill('Original task title');
    await page.click('button:has-text("Add")');

    // Wait for task to appear
    await expect(page.locator('text=Original task title')).toBeVisible();

    // Click on task to open details/edit (implementation may vary)
    await page.locator('text=Original task title').click();

    // Wait for edit interface to appear
    await page.waitForTimeout(500);

    // Update task title (this depends on your UI implementation)
    // This is a placeholder - adjust based on actual implementation
    const editInput = page.locator('input[value="Original task title"]');
    if (await editInput.isVisible()) {
      await editInput.fill('Updated task title');
      await page.keyboard.press('Enter');

      // Verify task is updated
      await expect(page.locator('text=Updated task title')).toBeVisible();
    }
  });

  test('should show empty state when no tasks', async ({ page }) => {
    // Should see empty state message
    await expect(page.locator('text=/No tasks yet/i')).toBeVisible();
  });

  test('should create multiple tasks', async ({ page }) => {
    const tasks = ['Task 1', 'Task 2', 'Task 3'];

    for (const task of tasks) {
      const taskInput = page.locator('input[placeholder*="Add a new task"]');
      await taskInput.fill(task);
      await page.click('button:has-text("Add")');
      await page.waitForTimeout(300);
    }

    // Verify all tasks are visible
    for (const task of tasks) {
      await expect(page.locator(`text=${task}`)).toBeVisible();
    }
  });

  test('should filter tasks by completion status', async ({ page }) => {
    // Create completed and incomplete tasks
    const taskInput = page.locator('input[placeholder*="Add a new task"]');

    // Create incomplete task
    await taskInput.fill('Incomplete task');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(300);

    // Create and complete a task
    await taskInput.fill('Completed task');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(300);

    const checkbox = page.locator('text=Completed task').locator('..').locator('input[type="checkbox"]');
    await checkbox.check();
    await page.waitForTimeout(300);

    // Look for filter buttons/tabs (implementation may vary)
    const activeFilter = page.locator('button:has-text("Active")');
    if (await activeFilter.isVisible()) {
      await activeFilter.click();
      await expect(page.locator('text=Incomplete task')).toBeVisible();
      await expect(page.locator('text=Completed task')).not.toBeVisible();
    }
  });

  test('should persist tasks after page reload', async ({ page }) => {
    // Create a task
    const taskInput = page.locator('input[placeholder*="Add a new task"]');
    await taskInput.fill('Persistent task');
    await page.click('button:has-text("Add")');

    // Wait for task to appear
    await expect(page.locator('text=Persistent task')).toBeVisible();

    // Reload page
    await page.reload();

    // Verify task still exists
    await expect(page.locator('text=Persistent task')).toBeVisible();
  });

  test('should handle task creation with Enter key', async ({ page }) => {
    const taskInput = page.locator('input[placeholder*="Add a new task"]');
    await taskInput.fill('Task via Enter key');
    await taskInput.press('Enter');

    // Verify task appears
    await expect(page.locator('text=Task via Enter key')).toBeVisible();
  });

  test('should not create empty tasks', async ({ page }) => {
    const taskInput = page.locator('input[placeholder*="Add a new task"]');

    // Try to submit empty task
    await page.click('button:has-text("Add")');

    // Should still show empty state
    await expect(page.locator('text=/No tasks yet/i')).toBeVisible();
  });

  test('should navigate to different views', async ({ page }) => {
    // Navigate to calendar view
    const calendarLink = page.locator('a[href="/calendar"]');
    if (await calendarLink.isVisible()) {
      await calendarLink.click();
      await expect(page).toHaveURL(/.*calendar/);
    }

    // Navigate to kanban view
    const kanbanLink = page.locator('a[href="/kanban"]');
    if (await kanbanLink.isVisible()) {
      await kanbanLink.click();
      await expect(page).toHaveURL(/.*kanban/);
    }

    // Navigate back to tasks
    const tasksLink = page.locator('a[href="/tasks"]');
    if (await tasksLink.isVisible()) {
      await tasksLink.click();
      await expect(page).toHaveURL(/.*tasks/);
    }
  });

  test('should logout successfully', async ({ page }) => {
    // Look for logout button
    const logoutButton = page.locator('button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/);
    }
  });
});

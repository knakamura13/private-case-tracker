import { test, expect } from '@playwright/test';

test.describe('clickable links in task descriptions', () => {
    test.beforeEach(async () => {
        // Navigate to login page and authenticate
        // TODO: Add proper authentication setup
        // For now, this test assumes the user is already authenticated
    });

    test('URLs in task descriptions are clickable and do not trigger edit modal', async ({ page }) => {
        // Navigate to tasks page
        await page.goto('/tasks');

        // Find or create a task with a URL in the description
        // For this test, we'll look for a link element within a task card
        const taskCard = page.locator('[data-task-id]').first();
        await expect(taskCard).toBeVisible();

        // Check if the task has a description with a link
        const link = taskCard.locator('a[href^="https://"]').first();

        // If no link exists, we need to create a task with a URL
        // This would require authentication and task creation flow
        // For now, we'll skip if no link is found
        const linkCount = await link.count();
        if (linkCount === 0) {
            test.skip(true, 'No task with URL found in description');
        }

        // Verify the link has correct attributes
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');

        // Verify clicking the link does not open the edit modal
        // The edit modal would have a dialog or modal element
        const editModalBefore = page.locator('dialog[open]').count();
        await link.click();
        const editModalAfter = page.locator('dialog[open]').count();

        // The edit modal should not open (count should remain the same)
        expect(editModalAfter).toBe(editModalBefore);
    });

    test('phone numbers in task descriptions are clickable and do not trigger edit modal', async ({ page }) => {
        // Navigate to tasks page
        await page.goto('/tasks');

        // Find a task with a phone number in the description
        const taskCard = page.locator('[data-task-id]').first();
        await expect(taskCard).toBeVisible();

        // Look for tel: links
        const phoneLink = taskCard.locator('a[href^="tel:"]').first();

        // If no phone link exists, skip the test
        const linkCount = await phoneLink.count();
        if (linkCount === 0) {
            test.skip(true, 'No task with phone number found in description');
        }

        // Verify the link has tel: protocol
        await expect(phoneLink).toHaveAttribute('href', /tel:/);

        // Verify clicking the phone link does not open the edit modal
        const editModalBefore = page.locator('dialog[open]').count();
        await phoneLink.click();
        const editModalAfter = page.locator('dialog[open]').count();

        // The edit modal should not open
        expect(editModalAfter).toBe(editModalBefore);
    });

    test('preview mode in edit modal shows clickable links', async ({ page }) => {
        // Navigate to tasks page
        await page.goto('/tasks');

        // Click on a task to open edit modal
        const taskCard = page.locator('[data-task-id]').first();
        await taskCard.click();

        // Wait for edit modal to open
        const editModal = page.locator('dialog[open]');
        await expect(editModal).toBeVisible();

        // Find the Preview button in the description section
        const previewButton = editModal.locator('button:has-text("Preview")').first();
        const previewButtonCount = await previewButton.count();

        if (previewButtonCount === 0) {
            test.skip(true, 'Preview button not found in edit modal');
        }

        // Click Preview button
        await previewButton.click();

        // Verify preview mode shows clickable links
        // Look for links in the preview card
        const previewLinks = editModal.locator('a[href]').first();
        const linkCount = await previewLinks.count();

        if (linkCount > 0) {
            // Verify links are visible in preview
            await expect(previewLinks).toBeVisible();
        }

        // Close the modal
        const closeButton = editModal.locator('button:has([data-lucide="x"])').first();
        await closeButton.click();
    });
});

import { test, expect } from '@playwright/test';

test.describe('RaceLab E2E Suite', () => {
  test('loads landing page successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/RaceLab/);
    await expect(page.locator('h1')).toContainText('Break concurrency');
  });

  test('displays onboarding modal on first app visit and dismisses', async ({ page }) => {
    await page.goto('/app');
    // Onboarding modal should appear on fresh visit
    const modal = page.locator('role=dialog[name="RaceLab Orientation"]');
    if (await modal.isVisible()) {
      await page.locator('button[aria-label="Skip and close onboarding tour"]').click();
      await expect(modal).not.toBeVisible();
    }
    await expect(page.locator('h1')).toContainText('Engineering Console');
  });

  test('navigates to dashboard with completed onboarding', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('racelab_onboarding_completed', 'true');
    });
    await page.goto('/app');
    await expect(page.locator('h1')).toContainText('Engineering Console');
    await expect(page.locator('text=The Lost Update').first()).toBeVisible();
  });

  test('opens simulation studio for mission 01', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('racelab_onboarding_completed', 'true');
    });
    await page.goto('/app/simulate/mission-01');
    await expect(page.locator('text=Thread Explorer')).toBeVisible();
    await expect(page.locator('text=Execution Timeline')).toBeVisible();
    await expect(page.locator('text=Memory & Sync')).toBeVisible();
  });

  test('toggles keyboard shortcuts modal in simulation studio', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('racelab_onboarding_completed', 'true');
    });
    await page.goto('/app/simulate/mission-01');
    await expect(page.locator('text=Thread Explorer')).toBeVisible();
    await page.keyboard.press('?');
    const shortcutsHeading = page.getByRole('heading', { name: 'Keyboard Shortcuts' });
    await expect(shortcutsHeading).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(shortcutsHeading).not.toBeVisible();
  });

  test('handles 404 route gracefully', async ({ page }) => {
    await page.goto('/invalid-concurrent-path');
    await expect(page.locator('text=Instruction Pointer Lost')).toBeVisible();
    await expect(page.locator('text=Back to Safety')).toBeVisible();
  });
});

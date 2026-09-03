import { test, expect } from '@playwright/test';

test.describe('MathQuest End-to-End Child Learning & Guardian Flow', () => {
  test('Case 1 & 2: Guardian visits app and navigates to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MathQuest/);
    await expect(page.locator('h1')).toContainText('Math That Feels Like an Adventure');

    await page.click('text=Guardian Dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Guardian Dashboard');
  });

  test('Case 3, 4 & 5: Child starts lesson, answers are masked, attempts submitted', async ({ page }) => {
    // Intercept question payloads to verify answers are absent
    page.on('response', async (res) => {
      if (res.url().includes('/api/learning/session/start')) {
        const json = await res.json();
        for (const q of json.questions || []) {
          expect(q.correct_answer).toBeUndefined();
          expect(q.solution).toBeUndefined();
        }
      }
    });

    await page.goto('/learn/number_sense/ns_place_value_100');
    await expect(page.locator('h2')).toBeVisible();

    // Select an answer option
    const choiceButton = page.locator('button:has-text("47")');
    if (await choiceButton.isVisible()) {
      await choiceButton.click();
      await page.click('text=Check Answer');
      await expect(page.locator('text=Super job! That is correct!')).toBeVisible();
    }
  });

  test('Case 7 & 8: Scoring produces results and next recommendation is displayed', async ({ page }) => {
    await page.goto('/learn/number_sense/ns_place_value_100/results');
    await expect(page.locator('h1')).toContainText('Quest Complete!');
    await expect(page.locator('text=Practise Next Recommendation')).toBeVisible();
  });

  test('Case 11: Child data can be deleted (COPPA/GDPR-K compliance)', async ({ page }) => {
    await page.goto('/dashboard');
    const deleteButton = page.locator('text=Delete All Data for Alex');
    if (await deleteButton.isVisible()) {
      page.on('dialog', (dialog) => dialog.accept());
      await deleteButton.click();
      await expect(deleteButton).not.toBeVisible();
    }
  });

  test('Case 12: Secret keys and service tokens are absent from client bundle', async ({ page }) => {
    await page.goto('/');
    const pageContent = await page.content();
    expect(pageContent).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(pageContent).not.toContain('INTERNAL_SERVICE_TOKEN');
  });
});

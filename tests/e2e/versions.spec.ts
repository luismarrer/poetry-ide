import { test, expect } from '@playwright/test';

test.describe('Poetry IDE Versions and Split View E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
    await expect(page.locator('.cm-content')).toBeVisible();
  });

  test('manages version tabs: create, duplicate, rename and switch', async ({ page }) => {
    // 1. Verify initial tab "Versión 1" is present and active
    const tabsBar = page.locator('[data-testid="version-tabs-bar"]');
    await expect(tabsBar).toBeVisible();
    await expect(tabsBar).toContainText('Versión 1');

    // 2. Create a new version with "+ Nueva"
    const createBtn = page.locator('[data-testid="create-version-btn"]');
    await createBtn.click();

    await expect(tabsBar).toContainText('Versión 2');

    // 3. Type text into the new active version
    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.insertText('Cisne de plata pura y sonorosa');

    // Verify gutter reflects 11 syllables
    const gutterItem = page.locator('.poetry-gutter-item:not(.poetry-gutter-spacer)').first();
    await expect(gutterItem).toContainText('11 ✓');

    // 4. Switch back to Versión 1
    const v1Tab = tabsBar.locator('button', { hasText: 'Versión 1' });
    await v1Tab.click();

    // Versión 1 should still have the original sample corpus text
    await expect(editor).toContainText('Escribo poesía fea');

    // 5. Switch back to Versión 2
    const v2Tab = tabsBar.locator('button', { hasText: 'Versión 2' });
    await v2Tab.click();
    await expect(editor).toContainText('Cisne de plata pura y sonorosa');

    // 6. Test duplicate version
    const v2Container = page.locator('[data-testid^="version-tab-"]').filter({ hasText: 'Versión 2' });
    const dupBtn = v2Container.locator('button[data-testid^="duplicate-version-"]');
    await dupBtn.click();

    await expect(tabsBar).toContainText('Versión 2 (Copia)');
  });

  test('opens side-by-side split view, edits both panels and synchronizes', async ({ page }) => {
    // Select blank template to ensure clean input across desktop and mobile
    await page.selectOption('[data-testid="sample-poems-select"]', 'blank');

    // 1. Click "Abrir dos versiones" button
    const splitBtn = page.locator('[data-testid="toggle-split-view-btn"]');
    await splitBtn.click();

    // Split editor container should be visible
    const splitEditor = page.locator('[data-testid="split-poetry-editor"]');
    await expect(splitEditor).toBeVisible();

    const paneA = page.locator('[data-testid="split-pane-primary"]');
    const paneB = page.locator('[data-testid="split-pane-secondary"]');
    await expect(paneA).toBeVisible();
    await expect(paneB).toBeVisible();

    // 2. Panel A and Panel B headers show "Panel A" and "Panel B"
    await expect(paneA).toContainText('Panel A');
    await expect(paneB).toContainText('Panel B');

    // 3. Edit text in Panel B independently
    const editorB = paneB.locator('.cm-content');
    await editorB.click();
    await page.keyboard.insertText('Dulce cantar de ruiseñor sereno');

    // Check Panel B gutter shows 11 syllables
    const gutterB = paneB.locator('.poetry-gutter-item:not(.poetry-gutter-spacer)').first();
    await expect(gutterB).toContainText('11 ✓');

    // Panel A gutter remains empty (just line 1)
    const gutterA = paneA.locator('.poetry-gutter-item:not(.poetry-gutter-spacer)').first();
    await expect(gutterA).toContainText('1');

    // 4. Test "Copiar a A" from Panel B
    const copyBtoA = paneB.locator('[data-testid="copy-b-to-a-btn"]');
    await copyBtoA.click();

    // Now Panel A should also have the text from Panel B
    const editorA = paneA.locator('.cm-content');
    await expect(editorA).toContainText('Dulce cantar de ruiseñor sereno');
    await expect(gutterA).toContainText('11 ✓');

    // 5. Test close split view
    const closeBtn = paneB.locator('[data-testid="close-split-view-btn"]');
    await closeBtn.click();

    // Split view closes, single editor remains
    await expect(splitEditor).toHaveCount(0);
    await expect(page.locator('[data-testid="poetry-editor-container"]')).toBeVisible();

    // 6. Verify localStorage contains version data
    const storedState = await page.evaluate(() => {
      const raw = localStorage.getItem('poetry_ide_state_v1');
      return raw ? JSON.parse(raw) : null;
    });
    expect(storedState).toBeTruthy();
    expect(Array.isArray(storedState.versions)).toBe(true);
    expect(storedState.versions.length).toBeGreaterThanOrEqual(2);
  });
});

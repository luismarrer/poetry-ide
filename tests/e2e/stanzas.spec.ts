import { test, expect } from '@playwright/test';

test.describe('Poetry IDE Stanza Measurement and Sizing E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
    await expect(page.locator('.cm-content')).toBeVisible();
  });

  test('displays stanza verse count in status bar, inspector, and gutter', async ({ page }) => {
    // 1. Select blank sample to enter clean multi-stanza poem
    await page.selectOption('[data-testid="sample-poems-select"]', 'blank');

    const editor = page.locator('.cm-content');
    await editor.click();

    // Enter a 4-verse stanza, blank line, and a 3-verse stanza
    const poemText = [
      'Cisne de plata pura y sonorosa,',
      'que canta dulcemente en la ribera,',
      'con una voz sutil y placentera,',
      'mientras el aura vuela perezosa.',
      '',
      'Luego suspira en medio de la calma,',
      'abre sus blancas alas conmovido,',
      'y deja libre el vuelo de su alma.',
    ].join('\n');

    await page.keyboard.insertText(poemText);

    // 2. Gutter check: Estrofa 1 pill (E1) on line 1, Estrofa 2 pill (E2) on line 6
    const e1Pill = page.locator('[data-testid="gutter-stanza-pill-1"]');
    await expect(e1Pill).toBeVisible();
    await expect(e1Pill).toContainText('E1');

    const e2Pill = page.locator('[data-testid="gutter-stanza-pill-2"]');
    await expect(e2Pill).toBeVisible();
    await expect(e2Pill).toContainText('E2');

    // 3. Status Bar check for Verse 1 (Estrofa 1, 4 versos)
    await page.locator('.cm-line', { hasText: 'Cisne de plata pura' }).click();
    const statusBarStanza = page.locator('[data-testid="status-bar-stanza-info"]');
    await expect(statusBarStanza).toBeVisible();
    await expect(statusBarStanza).toContainText('Estrofa 1: 4 versos (1/4)');

    // 4. Click Verse 2 in Estrofa 1 -> updates to (2/4)
    await page.locator('.cm-line', { hasText: 'que canta dulcemente' }).click();
    await expect(statusBarStanza).toContainText('Estrofa 1: 4 versos (2/4)');

    // 5. Verse Inspector check
    const inspector = page.locator('[data-testid="verse-inspector"]');
    await expect(inspector).toBeVisible();

    const inspectorBadge = page.locator('[data-testid="inspector-stanza-badge"]');
    await expect(inspectorBadge).toBeVisible();
    await expect(inspectorBadge).toContainText('Estrofa 1: 4 versos');

    const inspectorCard = page.locator('[data-testid="inspector-stanza-card"]');
    await expect(inspectorCard).toBeVisible();
    await expect(inspectorCard).toContainText('Estrofa 1 de 2');
    await expect(inspectorCard.locator('[data-testid="inspector-stanza-verse-count"]')).toContainText('4 versos');
    await expect(inspectorCard).toContainText('Verso 2 de 4');

    // 6. Click into Estrofa 2 (Verse 6: "Luego suspira")
    await page.locator('.cm-line', { hasText: 'Luego suspira' }).click();
    await expect(statusBarStanza).toContainText('Estrofa 2: 3 versos (1/3)');
    await expect(inspectorBadge).toContainText('Estrofa 2: 3 versos');
    await expect(inspectorCard).toContainText('Estrofa 2 de 2');
    await expect(inspectorCard.locator('[data-testid="inspector-stanza-verse-count"]')).toContainText('3 versos');
    await expect(inspectorCard).toContainText('Terceto');

    // 7. Check PoemStatsModal breakdown
    const statsBtn = page.locator('[data-testid="open-stats-btn"]');
    await statsBtn.click();

    const statsModal = page.locator('[data-testid="stats-modal"]');
    await expect(statsModal).toBeVisible();

    const stanzasBreakdown = page.locator('[data-testid="stats-stanzas-breakdown"]');
    await expect(stanzasBreakdown).toBeVisible();
    await expect(stanzasBreakdown).toContainText('E1');
    await expect(stanzasBreakdown).toContainText('4 versos');
    await expect(stanzasBreakdown).toContainText('E2');
    await expect(stanzasBreakdown).toContainText('3 versos');
  });
});

import { test, expect } from '@playwright/test';

test.describe('Poetry IDE E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    // Open app
    await page.goto('/');
    await expect(page.locator('.cm-content')).toBeVisible();
    await expect(page.locator('.poetry-gutter-item:not(.poetry-gutter-spacer)').first()).toBeVisible();
  });

  test('loads Poetry IDE with editor, gutter, inspector, and status bar', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Poetry IDE' })).toBeVisible();
    await expect(page.locator('[data-testid="poetry-editor-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="verse-inspector"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-bar"]')).toBeVisible();
  });

  test('gutter displays syllables and updates in real time while typing', async ({ page }) => {
    // Select sample poem "Lienzo en blanco"
    await page.selectOption('[data-testid="sample-poems-select"]', 'blank');

    // Focus editor and type a heptasyllable
    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.insertText('Escribo verso feo');

    // Wait for gutter to show 7 ✓ in Silva mode
    const gutterItem = page.locator('.poetry-gutter-item:not(.poetry-gutter-spacer)').first();
    await expect(gutterItem).toContainText('1');
    await expect(gutterItem).toContainText('7 ✓');

    // Insert second verse on a new line
    await page.keyboard.insertText('\ncon el rumor del mar entre las olas');

    const secondGutterItem = page.locator('.poetry-gutter-item:not(.poetry-gutter-spacer)').nth(1);
    await expect(secondGutterItem).toContainText('2');
    await expect(secondGutterItem).toContainText('11 ✓');
  });

  test('gutter displays rhyme scheme alongside syllables and toggles on/off', async ({ page }) => {
    // Select sample poem "Silva (Luis de Góngora)"
    await page.selectOption('[data-testid="sample-poems-select"]', 'silvaGongora');

    const gutterItems = page.locator('.poetry-gutter-item:not(.poetry-gutter-spacer)');
    await expect(gutterItems.nth(0)).toContainText('1');
    await expect(gutterItems.nth(0)).toContainText('11 ✓');
    await expect(gutterItems.nth(0).locator('.poetry-gutter-rhyme')).toContainText('A');

    await expect(gutterItems.nth(1).locator('.poetry-gutter-rhyme')).toContainText('B');
    await expect(gutterItems.nth(2).locator('.poetry-gutter-rhyme')).toContainText('b');
    await expect(gutterItems.nth(3).locator('.poetry-gutter-rhyme')).toContainText('—');

    // Hover over 'A' rhyme to test group hover
    const rhymeA = gutterItems.nth(0).locator('.poetry-gutter-rhyme');
    await rhymeA.hover();
    await expect(page.locator('.poetry-rhyme-active')).toHaveCount(2);

    // Toggle rhyme visibility off
    const toggleRhymeBtn = page.locator('[data-testid="toggle-rhyme-vis"]');
    await toggleRhymeBtn.click();
    await expect(gutterItems.nth(0).locator('.poetry-gutter-rhyme')).toHaveCount(0);

    // Toggle rhyme visibility back on
    await toggleRhymeBtn.click();
    await expect(gutterItems.nth(0).locator('.poetry-gutter-rhyme')).toContainText('A');
  });

  test('inspects active verse and shows syllable separation and accents', async ({ page }) => {
    // By default, sample corpus is loaded
    const inspector = page.locator('[data-testid="verse-inspector"]');
    await expect(inspector).toBeVisible();

    // Check syllable separation section exists
    await expect(inspector).toContainText('Separación silábica');
    await expect(inspector).toContainText('Ley del acento final');
    await expect(inspector).toContainText('Acentos métricos rítmicos');
    await expect(inspector).toContainText('Rima');
  });

  test('allows manual override of synalephas and updates metric count immediately', async ({ page }) => {
    // Select "Corpus de prueba"
    await page.selectOption('[data-testid="sample-poems-select"]', 'userCorpus');

    // Click on the line with "te supe onírica y empírica."
    const editor = page.locator('.cm-content');
    await editor.click();

    // Find the text and place cursor there
    const lineLocator = page.locator('.cm-line', { hasText: 'te supe onírica y empírica' });
    await lineLocator.click();

    const inspector = page.locator('[data-testid="verse-inspector"]');
    await expect(inspector).toContainText('onírica');

    // Toggle a synalepha button
    const toggleBtn = inspector.locator('button[data-testid^="toggle-syn-"]').first();
    await expect(toggleBtn).toBeVisible();

    // Initial count
    const countBadge = inspector.locator('.text-xl.font-mono.font-bold');
    const initialCount = await countBadge.textContent();

    // Click to treat as hiatus
    await toggleBtn.click();

    // Check that count changed immediately
    await expect(countBadge).not.toHaveText(initialCount || '');
    await expect(inspector).toContainText('Decisiones poéticas aplicadas');
    await expect(inspector).toContainText('Con tus decisiones:');
  });

  test('toggles dark and light mode', async ({ page }) => {
    const html = page.locator('html');
    const themeBtn = page.locator('[data-testid="theme-toggle"]');

    // Get current mode
    const isDarkInitially = await html.evaluate(el => el.classList.contains('dark'));

    // Toggle theme
    await themeBtn.click();
    const isDarkAfter = await html.evaluate(el => el.classList.contains('dark'));
    expect(isDarkAfter).toBe(!isDarkInitially);

    // Toggle back
    await themeBtn.click();
    const isDarkReset = await html.evaluate(el => el.classList.contains('dark'));
    expect(isDarkReset).toBe(isDarkInitially);
  });

  test('opens poetic statistics modal', async ({ page }) => {
    const statsBtn = page.locator('[data-testid="open-stats-btn"]');
    await statsBtn.click();

    const modal = page.locator('[data-testid="stats-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Estadísticas Poéticas');
    await expect(modal).toContainText('Distribución de longitud métrica');
    await expect(modal).toContainText('Esquema de rima');

    // Close modal by clicking backdrop
    await page.locator('[data-testid="stats-modal-backdrop"]').click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible();
  });

  test('supports poem title input, comments, and in-text headings', async ({ page }) => {
    // Select blank canvas
    await page.selectOption('[data-testid="sample-poems-select"]', 'blank');

    // Test poem title input
    const titleInput = page.locator('[data-testid="poem-title-input"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Canto a la noche');

    // Check that title persists in localStorage
    const storedState = await page.evaluate(() => {
      const raw = localStorage.getItem('poetry_ide_state_v1');
      return raw ? JSON.parse(raw) : null;
    });
    expect(storedState?.title).toBe('Canto a la noche');

    // Focus editor and write comment line, heading line, and verse
    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.insertText('// Borrador inicial de versos\n');
    await page.keyboard.insertText('# Estrofa I\n');
    await page.keyboard.insertText('Escribo verso feo');

    // Verify gutter for comment (line 1), heading (line 2), and verse (line 3)
    const gutterItems = page.locator('.poetry-gutter-item:not(.poetry-gutter-spacer)');
    await expect(gutterItems.nth(0)).toContainText('//');
    await expect(gutterItems.nth(1)).toContainText('#');
    await expect(gutterItems.nth(2)).toContainText('7 ✓');

    // Click on comment line (line 1) and verify inspector
    await page.locator('.cm-line', { hasText: 'Borrador inicial' }).click();
    const inspector = page.locator('[data-testid="verse-inspector"]');
    await expect(inspector).toContainText('Anotación / Comentario');
    await expect(inspector).toContainText('Línea excluida del análisis poético');

    // Click on heading line (line 2) and verify inspector
    await page.locator('.cm-line', { hasText: 'Estrofa I' }).click();
    await expect(inspector).toContainText('Título / Encabezado');
  });

  test('switches between consonant and assonant rhyme modes and provides rhyme suggestions', async ({ page }) => {
    // Select blank canvas
    await page.selectOption('[data-testid="sample-poems-select"]', 'blank');

    // Type 3 verses: musa (11), confusa (7), luna (11)
    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.insertText('cuantos me dictó versos dulce musa\n');
    await page.keyboard.insertText('en soledad confusa\n');
    await page.keyboard.insertText('bajo la clara lumbre de la luna');

    const gutterItems = page.locator('.poetry-gutter-item:not(.poetry-gutter-spacer)');

    // 1. In Consonant mode (default)
    // Line 1 (musa) and Line 2 (confusa) rhyme in -usa -> 'A' and 'a'
    // Line 3 (luna) does NOT rhyme consonant with -usa -> '—'
    await expect(gutterItems.nth(0).locator('.poetry-gutter-rhyme')).toContainText('A');
    await expect(gutterItems.nth(1).locator('.poetry-gutter-rhyme')).toContainText('a');
    await expect(gutterItems.nth(2).locator('.poetry-gutter-rhyme')).toContainText('—');

    // 2. Switch to Assonant mode using the TopBar button
    const asonBtn = page.locator('[data-testid="rhyme-mode-assonant"]');
    await expect(asonBtn).toBeVisible();
    await asonBtn.click();

    // In Assonant mode: luna has u-a assonance, matching musa and confusa!
    // Line 3 (11 syllables) becomes 'A'
    await expect(gutterItems.nth(2).locator('.poetry-gutter-rhyme')).toContainText('A');

    // Verify localStorage has persisted rhymeMode = 'assonant'
    const storedState = await page.evaluate(() => {
      const raw = localStorage.getItem('poetry_ide_state_v1');
      return raw ? JSON.parse(raw) : null;
    });
    expect(storedState?.rhymeMode).toBe('assonant');

    // 3. Inspect Line 1 (musa) and verify Rhyme Suggester
    await page.locator('.cm-line', { hasText: 'dulce musa' }).click();
    const inspector = page.locator('[data-testid="verse-inspector"]');
    await expect(inspector).toBeVisible();
    await expect(inspector).toContainText('Rima del Verso');
    await expect(inspector).toContainText('-usa');
    await expect(inspector).toContainText('u-a');

    // Rhyme Suggester should list words with u-a assonance like luna / espuma / pluma
    const suggestionsList = page.locator('[data-testid="rhyme-suggestions-list"]');
    await expect(suggestionsList).toBeVisible();
    await expect(suggestionsList).toContainText('luna');

    // 4. Test Syllable filter (e.g., 2 syllables)
    const filter2Btn = page.locator('[data-testid="filter-syllables-2"]');
    await filter2Btn.click();
    await expect(suggestionsList).toContainText('luna');

    // 5. Test Free Search Input in suggester
    const searchInput = page.locator('[data-testid="rhyme-suggester-search-input"]');
    await searchInput.fill('noche');
    await page.waitForTimeout(200);
    // In assonant mode, 'noche' (o-e) should suggest 'bosque', 'torre', etc.
    await expect(suggestionsList).toContainText('torre');

    // 6. Switch back to Consonant mode
    const consBtn = page.locator('[data-testid="rhyme-mode-consonant"]');
    await consBtn.click();
    // Line 3 returns to '—'
    await expect(gutterItems.nth(2).locator('.poetry-gutter-rhyme')).toContainText('—');
  });
});

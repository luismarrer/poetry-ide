import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/Users/luis/.gemini/antigravity/brain/b6fb139d-3ff8-497f-951f-ea3c4227ad3c';

async function capture() {
  const browser = await chromium.launch();

  // 1. Desktop Light Mode
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('http://127.0.0.1:4321');
    await page.waitForLoadState('networkidle');

    // Click on "te supe onírica y empírica." to select that verse in the inspector
    const verseLine = page.locator('.cm-line', { hasText: 'te supe onírica y empírica' });
    if (await verseLine.isVisible()) {
      await verseLine.click();
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'poetry_ide_desktop_light.png'),
      fullPage: false,
    });
    await page.close();
  }

  // 2. Desktop Dark Mode with Override
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('http://127.0.0.1:4321');
    await page.waitForLoadState('networkidle');

    // Toggle dark theme
    await page.click('[data-testid="theme-toggle"]');

    // Click on "te supe onírica y empírica."
    const verseLine = page.locator('.cm-line', { hasText: 'te supe onírica y empírica' });
    if (await verseLine.isVisible()) {
      await verseLine.click();
      // Toggle a synalepha to show manual override
      const toggleBtn = page.locator('button[data-testid^="toggle-syn-"]').first();
      if (await toggleBtn.isVisible()) {
        await toggleBtn.click();
      }
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'poetry_ide_desktop_dark.png'),
      fullPage: false,
    });
    await page.close();
  }

  // 3. Stats Modal
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('http://127.0.0.1:4321');
    await page.waitForLoadState('networkidle');

    // Open statistics modal
    await page.click('[data-testid="open-stats-btn"]');
    await page.waitForSelector('[data-testid="stats-modal"]');

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'poetry_ide_stats_modal.png'),
      fullPage: false,
    });
    await page.close();
  }

  // 4. Mobile Viewport
  {
    const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
    await page.goto('http://127.0.0.1:4321');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'poetry_ide_mobile.png'),
      fullPage: false,
    });
    await page.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully.');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});

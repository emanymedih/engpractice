import { test, expect } from '@playwright/test';

const STATE_KEY = 'wordmemo1000.ngsl.teacher.v5';

function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error.message || error)));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  return errors;
}

test('core learning flow loads, reviews a word and persists progress', async ({ page }, testInfo) => {
  const errors = collectPageErrors(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Начать умную сессию/ })).toBeVisible();
  await expect(page.locator('.boot .err')).toHaveCount(0);

  await page.getByRole('button', { name: /Начать умную сессию/ }).click();
  await expect(page.locator('#page-study')).toBeVisible();
  await expect(page.getByRole('button', { name: /Показать ответ/ })).toBeVisible();

  const firstWord = (await page.locator('#page-study .word').textContent())?.trim();
  expect(firstWord).toBeTruthy();

  await page.getByRole('button', { name: /Показать ответ/ }).click();
  await expect(page.locator('#page-study .visual-memory')).toBeVisible();
  await expect(page.locator('#page-study .example-translation')).toBeVisible();
  await expect(page.getByRole('button', { name: /3 · Вспомнил/ })).toBeVisible();

  await page.getByRole('button', { name: /3 · Вспомнил/ }).click();

  const savedBeforeReload = await page.evaluate(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const touched = Object.values(s.cards || {}).filter(c => c && c.status && c.status !== 'new');
    return { touched: touched.length, updatedAt: s.updatedAt || 0 };
  }, STATE_KEY);

  expect(savedBeforeReload).not.toBeNull();
  expect(savedBeforeReload.touched).toBeGreaterThan(0);
  expect(savedBeforeReload.updatedAt).toBeGreaterThan(0);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();

  const savedAfterReload = await page.evaluate(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return Object.values(s.cards || {}).filter(c => c && c.status && c.status !== 'new').length;
  }, STATE_KEY);
  expect(savedAfterReload).toBeGreaterThan(0);

  expect(errors, `browser errors in ${testInfo.project.name}:\n${errors.join('\n')}`).toEqual([]);
});

test('mobile navigation is touch-friendly and exposes light theme', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-webkit', 'mobile UX is checked in WebKit iPhone profile');
  const errors = collectPageErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();

  const navButtons = page.locator('.mobile-nav > button');
  await expect(navButtons).toHaveCount(4);
  await expect(navButtons.first()).toBeVisible();

  for (let i = 0; i < await navButtons.count(); i++) {
    const box = await navButtons.nth(i).boundingBox();
    expect(box, `mobile nav button ${i} has no box`).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }

  await page.locator('#mobileMoreBtn').click();
  await expect(page.locator('#mobileMoreSheet')).toBeVisible();
  await page.locator('#mobileMoreSheet').getByRole('button', { name: /Настройки/ }).click();
  await expect(page.getByRole('heading', { name: 'Настройки' })).toBeVisible();

  const light = page.locator('#page-settings .theme-option').filter({ hasText: 'Светлая' });
  await expect(light).toBeVisible();
  await light.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  const selectedTheme = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).settings.theme, STATE_KEY);
  expect(selectedTheme).toBe('light');
  expect(errors, `browser errors in mobile WebKit:\n${errors.join('\n')}`).toEqual([]);
});

test('diagnostics reports application assets and browser storage without hard failures', async ({ page }) => {
  await page.goto('/diagnostics.html');
  await expect(page.getByRole('heading', { name: /WordMemo · диагностика/ })).toBeVisible();
  await expect(page.locator('#checks .row')).toHaveCount(13, { timeout: 10_000 });
  await expect(page.locator('#checks .bad')).toHaveCount(0);
});

import { test, expect } from '@playwright/test';

test('gerador baixa PNG da carta', async ({ page }) => {
  await page.goto('/gerador');

  await page.getByPlaceholder('Ex: CALANGO PUNK').fill('Carta E2E');
  await page.getByPlaceholder('Ex: "ANARQUISMO!"').fill('Teste de download');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'BAIXAR PNG' }).click();
  const download = await downloadPromise;

  await expect(download.suggestedFilename()).toContain('.png');
});

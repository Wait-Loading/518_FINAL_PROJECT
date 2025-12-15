import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'View' }).first().click();
  await page.getByRole('button', { name: 'PS3' }).click();
  await page.getByRole('textbox', { name: 'Optional message…' }).click();
  await page.getByRole('textbox', { name: 'Optional message…' }).fill('hi');
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'Send Offer' }).click();
  await page.getByRole('link', { name: 'Home' }).click();
  await page.getByText('HomeBrowse Create ListingMy').click();
  await page.getByRole('link', { name: 'My Items' }).click();
  await page.getByRole('link', { name: 'oihv ola oihv ola available' }).click();
  await page.getByRole('link', { name: 'My Items' }).click();
  await page.getByRole('link', { name: 'tftulh g yvy tftulh g yvy' }).click();
  await page.getByRole('link', { name: 'My Items' }).click();
  await page.getByRole('link', { name: 'PS3 PS3 available a old' }).click();
  await page.getByRole('textbox', { name: 'Type a message…' }).click();
  await page.getByRole('textbox', { name: 'Type a message…' }).fill('hi');
  await page.getByRole('textbox', { name: 'Type a message…' }).press('Enter');
  await page.getByRole('textbox', { name: 'Type a message…' }).click();
  await page.getByRole('textbox', { name: 'Type a message…' }).fill('WHats up');
  await page.getByRole('textbox', { name: 'Type a message…' }).press('Enter');
  await page.getByRole('button', { name: 'Accept' }).click();
  await page.getByRole('button', { name: 'Back to Pending' }).click();
  await page.getByRole('link', { name: 'The Exchanger' }).click();
  await page.getByText('pending', { exact: true }).click();
  await page.getByRole('button', { name: 'Mark Completed' }).click();
  await page.getByRole('link', { name: 'Browse' }).click();
  await page.getByText('traded').nth(2).click();
  await page.getByRole('link', { name: 'My Items' }).click();
});
import { test, expect } from '@playwright/test';

test.describe('LicitaHub E2E Tests', () => {
  
  test('Flujo de Autenticación y Dashboard', async ({ page }) => {
    // 1. Ir a login
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Ingresar a tu cuenta');

    // 2. Intentar login
    await page.fill('input[type="email"]', 'demo@licitahub.cl');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');

    // 3. Verificar redirección al dashboard (el login ficticio toma 1.2s)
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1').last()).toContainText('Panel de Control');
  });

  test('Buscador Inteligente de Licitaciones', async ({ page }) => {
    // Login rápido primero
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@licitahub.cl');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navegar al buscador
    await page.goto('/licitaciones');
    await page.waitForURL('**/licitaciones');
    await expect(page.locator('h1').last()).toContainText('Explorador de Licitaciones');

    // Realizar una búsqueda
    await page.fill('input[placeholder*="Buscar por"]', 'Tecnología');
    
    // Verificar que haya un indicador de resultados
    await expect(page.locator('text=licitaciones del portal ChileCompra')).toBeVisible();
  });

  test('Detalle de Licitación y Proposal Toolkit (IA)', async ({ page }) => {
    // Login rápido primero
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@licitahub.cl');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Ir a licitaciones
    await page.goto('/licitaciones');
    await expect(page.locator('h1').last()).toContainText('Explorador de Licitaciones');

    // Hacer clic en la primera licitación del listado
    const firstLicitacionLink = page.locator('a[href^="/licitacion/"]').first();
    await firstLicitacionLink.click();

    // Verificar que estamos en la página de detalle
    await page.waitForURL(/\/licitacion\/[a-zA-Z0-9-]+/);
    await expect(page.locator('button:has-text("Resumen")')).toBeVisible();
    await expect(page.locator('button:has-text("Propuesta IA")')).toBeVisible();

    // Cambiar a la pestaña Propuesta IA
    await page.click('button:has-text("Propuesta IA")');

    // Verificar el checklist y las plantillas autocompletadas
    await expect(page.locator('text=Lista de Verificación (Checklist)')).toBeVisible();
    await expect(page.locator('text=Carta Presentación')).toBeVisible();
  });

  test('Pipeline de Licitaciones Kanban', async ({ page }) => {
    // Login rápido primero
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@licitahub.cl');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Ir a favoritas
    await page.goto('/favoritas');
    await page.waitForURL('**/favoritas');
    await expect(page.locator('h1').last()).toContainText('Favoritos');

    // Verificar columnas del Kanban
    await expect(page.getByText('Guardada', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('En Revisión', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Preparando Propuesta', { exact: true }).first()).toBeVisible();
  });
});

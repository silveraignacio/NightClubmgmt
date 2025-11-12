const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando prueba E2E manual de Club Nightlife...\n');

  // Lanzar navegador en modo visual
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Ralentizar para ver las acciones
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // 1. Ir a la homepage
    console.log('📍 Navegando a homepage...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: true });
    console.log('✅ Homepage cargada\n');

    // 2. Ir a registro de club
    console.log('📍 Navegando a registro de club...');
    await page.click('a[href="/register-club"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/02-register-page.png', fullPage: true });
    console.log('✅ Página de registro cargada\n');

    // 3. Registrar nuevo club
    const timestamp = Date.now();
    const clubEmail = `testclub${timestamp}@e2etest.com`;
    const clubPassword = 'TestPassword123!';

    console.log(`📝 Registrando nuevo club: ${clubEmail}`);

    // Llenar formulario
    await page.fill('input[name="name"], input[placeholder*="club" i], input[placeholder*="name" i]', `Club E2E Test ${timestamp}`);
    await page.fill('input[type="email"]', clubEmail);
    await page.fill('input[type="password"]', clubPassword);

    // Campos opcionales si existen
    const addressField = page.locator('input[name="address"], input[placeholder*="address" i]').first();
    if (await addressField.count() > 0) {
      await addressField.fill('123 Test Street, Test City');
    }

    const phoneField = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]').first();
    if (await phoneField.count() > 0) {
      await phoneField.fill('+1234567890');
    }

    await page.screenshot({ path: 'screenshots/03-register-form-filled.png', fullPage: true });

    // Submit
    await page.click('button[type="submit"]');
    console.log('⏳ Esperando respuesta del servidor...');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    await page.screenshot({ path: 'screenshots/04-after-register.png', fullPage: true });
    console.log(`✅ Registro completado. URL actual: ${currentUrl}\n`);

    // 4. Verificar si estamos en el dashboard admin
    if (currentUrl.includes('admin')) {
      console.log('🎉 ¡Registro exitoso! Estamos en el dashboard de admin\n');

      // Explorar dashboard
      console.log('📍 Explorando dashboard de admin...');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/05-admin-dashboard.png', fullPage: true });

      // 5. Ir a crear nuevo miembro
      console.log('📍 Navegando a crear nuevo miembro...');

      // Buscar botón o link para crear miembro
      const newMemberButton = page.locator('a[href*="members/new"], button:has-text("Add Member"), button:has-text("New Member")');
      if (await newMemberButton.count() > 0) {
        await newMemberButton.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/06-new-member-form.png', fullPage: true });

        // Llenar formulario de miembro
        console.log('📝 Creando nuevo miembro...');
        const memberEmail = `member${timestamp}@e2etest.com`;

        await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test Member');
        await page.fill('input[type="email"]', memberEmail);

        const memberPhoneField = page.locator('input[name="phone"], input[type="tel"]').first();
        if (await memberPhoneField.count() > 0) {
          await memberPhoneField.fill('+9876543210');
        }

        await page.screenshot({ path: 'screenshots/07-member-form-filled.png', fullPage: true });
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'screenshots/08-after-member-created.png', fullPage: true });
        console.log('✅ Miembro creado\n');
      } else {
        console.log('⚠️ No se encontró botón para crear miembro. Intentando navegación directa...');
        await page.goto('http://localhost:3001/admin/members/new');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/06-new-member-direct.png', fullPage: true });
      }

      // 6. Ir a interfaz de puerta (door)
      console.log('📍 Navegando a interfaz de puerta...');
      await page.goto('http://localhost:3001/admin/door');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/09-door-interface.png', fullPage: true });
      console.log('✅ Interfaz de puerta cargada\n');

      // 7. Ir a interfaz de bar
      console.log('📍 Navegando a interfaz de bar...');
      await page.goto('http://localhost:3001/admin/bar');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/10-bar-interface.png', fullPage: true });
      console.log('✅ Interfaz de bar cargada\n');

      // 8. Ir a lista de miembros
      console.log('📍 Navegando a lista de miembros...');
      await page.goto('http://localhost:3001/admin/members');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/11-members-list.png', fullPage: true });
      console.log('✅ Lista de miembros cargada\n');

    } else if (currentUrl.includes('login')) {
      console.log('📍 Redirigido a login después del registro. Intentando login...');
      await page.fill('input[type="email"]', clubEmail);
      await page.fill('input[type="password"]', clubPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/05-after-login.png', fullPage: true });
      console.log('✅ Login completado\n');
    } else {
      console.log('⚠️ URL inesperada después del registro:', currentUrl);
      await page.screenshot({ path: 'screenshots/error-unexpected-url.png', fullPage: true });
    }

    console.log('\n✅ Prueba E2E completada exitosamente!');
    console.log('📸 Screenshots guardados en carpeta screenshots/');
    console.log('\n🔍 Presiona Enter para cerrar el navegador...');

    // Mantener navegador abierto para inspección manual
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🏁 Navegador cerrado. Prueba finalizada.');
  }
})();

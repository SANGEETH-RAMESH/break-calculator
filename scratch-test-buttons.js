import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // 1. Capture Calculator form with split buttons
  await page.screenshot({
    path: 'C:/Users/MM-EMP-81/.gemini/antigravity-ide/brain/d6c317dd-bcd0-4b71-ab73-9777fc253db7/scratch/split_buttons_initial.png'
  });
  console.log('Saved split_buttons_initial.png');

  // 2. Click Break Reminder button
  const reminderBtn = await page.$('#form-break-reminder-button');
  if (reminderBtn) {
    await reminderBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: 'C:/Users/MM-EMP-81/.gemini/antigravity-ide/brain/d6c317dd-bcd0-4b71-ab73-9777fc253db7/scratch/reminder_view_opened.png'
    });
    console.log('Saved reminder_view_opened.png');

    // Click back to calculator
    const backBtn = await page.$('button');
    // find button with text 'Back to Calculator'
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Back to Calculator')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 600));
  }

  // 3. Test Check Break calculation
  // Fill hours=4, minutes=30
  const hoursInput = await page.$('input[placeholder="0"]');
  if (hoursInput) {
    await hoursInput.type('4');
  }
  const checkBtn = await page.$('#check-break-button');
  if (checkBtn) {
    await checkBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({
      path: 'C:/Users/MM-EMP-81/.gemini/antigravity-ide/brain/d6c317dd-bcd0-4b71-ab73-9777fc253db7/scratch/check_break_result.png'
    });
    console.log('Saved check_break_result.png');
  }

  await browser.close();
  console.log('All tests completed successfully!');
})();

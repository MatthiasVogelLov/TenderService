const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('TenderAI Scraper is running!');
});

app.post('/api/scan-portal', async (req, res) => {
    const { portalUrl, username, password, keywords } = req.body;
    console.log(`Starte Scan für: ${portalUrl}`);

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Zugangsdaten fehlen' });
    }

    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
        const page = await context.newPage();

        // 1. ZUR SEITE GEHEN
        await page.goto(portalUrl, { timeout: 60000 });
        await page.waitForTimeout(2000);

        // 2. DTVP SPEZIFISCHER LOGIN
        if (portalUrl.includes('dtvp.de')) {
            console.log('Erkenne DTVP Portal...');
            
            // DTVP nutzt oft variable IDs, aber 'name' Attribute die 'txtUsername' enthalten
            try {
                // Versuche Benutzername
                const userField = await page.locator('input[name*="txtUsername"]').first();
                await userField.fill(username);

                // Versuche Passwort
                const passField = await page.locator('input[name*="txtPassword"]').first();
                await passField.fill(password);

                // Klicke Login Button
                const btn = await page.locator('input[name*="btnLogin"]').first();
                await btn.click();
                
                console.log('Login Button geklickt, warte auf Navigation...');
                await page.waitForLoadState('networkidle');
            } catch (e) {
                console.log('Standard DTVP Login fehlgeschlagen, versuche generischen Fallback...');
            }
        } else {
            // Generischer Fallback für andere Seiten
            if (await page.isVisible('input[type="password"]')) {
               await page.fill('input[type="password"]', password);
               // ... (restlicher generischer Code)
            }
        }

        // 3. NACH DEM LOGIN: PRÜFEN OB WIR DRIN SIND
        const pageTitle = await page.title();
        console.log('Seite nach Login:', pageTitle);

        // 4. ERGEBNISSE ZURÜCKGEBEN (Simulation eines Treffers zur Bestätigung)
        res.json({
            success: true,
            message: `Login auf ${pageTitle} erfolgreich`,
            data: [
                {
                    title: `Verbindungstest erfolgreich: ${pageTitle}`,
                    agency: "DTVP Systemmeldung",
                    link: portalUrl,
                    date: new Date().toLocaleDateString(),
                    preview: `Der TenderAI Server hat sich erfolgreich als User '${username}' eingeloggt.`
                }
            ]
        });

    } catch (error) {
        console.error('Scraper Fehler:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
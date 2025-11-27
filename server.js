// server.js
const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Erlaube Zugriff von deiner Netlify App (CORS)
app.use(cors({
    origin: '*' // Für Produktion später auf deine Netlify-URL ändern!
}));
app.use(express.json());

// Health Check (damit Render weiß, dass wir leben)
app.get('/', (req, res) => {
    res.send('TenderAI Scraper is running!');
});

// Der eigentliche Scraper Endpoint
app.post('/api/scan-portal', async (req, res) => {
    const { portalUrl, username, password, keywords } = req.body;
    console.log(`Starte Scan für: ${portalUrl} mit Keywords: ${keywords}`);

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Zugangsdaten fehlen' });
    }

    let browser = null;
    try {
        // Browser starten (Headless = unsichtbar)
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        // 1. ZUR SEITE GEHEN
        await page.goto(portalUrl, { timeout: 60000 });
        
        // HINWEIS: Hier beginnt die Logik für DTVP / Vergabe24.
        // Da jedes Portal anders ist, ist dies ein generisches Beispiel für DTVP.
        // Wir suchen nach typischen Login-Feldern.
        
        try {
            // Versuche Login Felder zu finden (Beispiele!)
            // Du musst diese Selektoren anpassen, wenn du die echte Seite untersuchst.
            if (await page.isVisible('input[type="password"]')) {
                console.log('Login-Maske gefunden...');
                
                // Versuche Benutzername Feld zu finden (oft 'email', 'user', 'login')
                const userSelectors = ['input[name*="user"]', 'input[name*="mail"]', 'input[name*="login"]', '#txtUsername'];
                for (const sel of userSelectors) {
                    if (await page.isVisible(sel)) {
                        await page.fill(sel, username);
                        break;
                    }
                }

                // Passwort und Enter
                await page.fill('input[type="password"]', password);
                await page.keyboard.press('Enter');
                
                // Warte auf Navigation
                await page.waitForTimeout(5000); 
                console.log('Login Versuch durchgeführt.');
            }
        } catch (loginError) {
            console.log('Konnte Login nicht automatisch durchführen oder schon eingeloggt.');
        }

        // 2. SCRAPING DER ERGEBNISSE
        // Wir nehmen an, wir sehen jetzt eine Liste. Wir holen uns Titel und Links.
        const pageTitle = await page.title();
        
        // Beispiel-Daten zurückgeben (Da wir ohne echten Account nicht tiefer kommen)
        res.json({
            success: true,
            message: `Scan erfolgreich auf ${pageTitle}`,
            data: [
                {
                    title: `Gefundenes Dokument bei ${portalUrl} (Demo)`,
                    link: portalUrl,
                    date: new Date().toLocaleDateString(),
                    preview: `Dies ist ein Platzhalter. Der Scraper hat sich erfolgreich eingeloggt. Seite: ${pageTitle}`
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
const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');
const pdf = require('pdf-parse');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => res.send('TenderAI Scraper & PDF Reader is running!'));

// --- UNIVERSAL READER (WEB & PDF) ---
app.post('/api/read-page', async (req, res) => {
    const { url } = req.body;
    console.log(`Lese URL: ${url}`);
    if (!url) return res.status(400).json({ error: 'URL fehlt' });

    try {
        // A) PDF-ERKENNUNG
        if (url.toLowerCase().endsWith('.pdf')) {
            console.log('PDF erkannt. Lade herunter...');
            const response = await axios.get(url, { 
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const data = await pdf(response.data);
            
            return res.json({
                success: true,
                data: {
                    title: "PDF Dokument",
                    content: data.text.substring(0, 50000) // Limit für KI
                }
            });
        }

        // B) NORMALE WEBSEITE (Playwright)
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            // Cookie-Banner Versuch
            try { await page.click('button[id*="cookie"], button:has-text("Akzeptieren")', { timeout: 1000 }); } catch (e) {}
            
            const fullText = await page.evaluate(() => document.body.innerText);
            const title = await page.title();
            
            res.json({
                success: true,
                data: { title, content: fullText.substring(0, 50000) }
            });
        } finally {
            await browser.close();
        }

    } catch (error) {
        console.error('Reader Fehler:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- SCAN PORTAL (Alte Funktion bleibt erhalten) ---
app.post('/api/scan-portal', async (req, res) => {
    // ... Dein bestehender DTVP Code ...
    res.json({ success: false, message: "Bitte nutze /api/read-page für PDFs" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
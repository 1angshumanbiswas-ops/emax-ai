# E-Max AI — Deploy Guide
## Go live on beta.emaxai.in in under 30 minutes

---

## STEP 1 — Set up Google Sheet webhook (5 minutes)

1. Go to **sheets.google.com** → create a new blank spreadsheet
2. Name it: `E-Max AI Beta Data`
3. Click **Extensions → Apps Script**
4. Delete all default code
5. Copy the entire contents of `apps-script.js` and paste it in
6. Change line 4: `const ADMIN_EMAIL = "1angshuman.biswas@gmail.com"` (already set)
7. Click **Save** (floppy disk icon)
8. Click **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
9. Click **Deploy** → Copy the **Web App URL** (looks like: `https://script.google.com/macros/s/ABC.../exec`)
10. Run the `testSetup()` function once to verify — check the sheet for a test row

**Save this URL — you need it in Step 3.**

---

## STEP 2 — Push code to GitHub (5 minutes)

1. Create a free account at **github.com** if you don't have one
2. Create a new repository: `emax-ai`
3. Upload all files maintaining this structure:
```
emax-ai/
├── netlify.toml
├── netlify/
│   └── functions/
│       └── analyse.js
└── public/
    ├── index.html
    ├── manifest.json
    └── sw.js
```
4. Commit and push

---

## STEP 3 — Deploy on Netlify (10 minutes)

1. Go to **netlify.com** → Sign up free with your GitHub account
2. Click **Add new site → Import an existing project → GitHub**
3. Select your `emax-ai` repository
4. Build settings are auto-detected from `netlify.toml` — leave as is
5. Click **Deploy site**

**Add environment variables (your secrets — never in code):**
6. Go to **Site configuration → Environment variables → Add variable**
7. Add: `ANTHROPIC_API_KEY` = your Anthropic API key
8. Add: `SHEET_WEBHOOK_URL` = the Google Apps Script URL from Step 1
9. Click **Trigger deploy** to rebuild with the new variables

**Update the app with your Sheet URL:**
10. In `public/index.html`, find line:
    ```
    const SHEET_WEBHOOK_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
    ```
    Replace with your actual URL, push to GitHub — Netlify auto-redeploys.

---

## STEP 4 — Connect your custom domain (5 minutes)

1. Buy **emaxai.in** at GoDaddy / Namecheap / BigRock (~₹800/yr)
2. In Netlify: **Domain management → Add custom domain → beta.emaxai.in**
3. Netlify gives you a CNAME value (e.g. `amazing-name-123.netlify.app`)
4. In your domain registrar DNS settings:
   - Type: **CNAME**
   - Host: **beta**
   - Value: your netlify URL
5. Wait 5–15 minutes for DNS propagation
6. Netlify auto-provisions free SSL certificate (HTTPS)

---

## STEP 5 — Create QR code & share with testers (2 minutes)

1. Go to **qr-code-generator.com**
2. Enter URL: `https://beta.emaxai.in`
3. Download PNG
4. Share in WhatsApp groups with this message:

---
**Message template for WhatsApp:**

🚗 **E-Max AI — Free Beta**
India's first E20 mileage tracker. Are you losing fuel efficiency since the government's ethanol mandate?

This app tracks exactly how much, detects anomalies, and tells you what to do.

📲 Open this link on your phone:
**https://beta.emaxai.in**

Then tap **"Add to Home Screen"** to install.

✅ No Play Store needed
✅ No personal data collected
✅ Mileage calibrated as per **ARAI protocol** (MoRTH India)

---

## STEP 6 — Monitor your Google Sheet

Your master sheet auto-populates with every fill-up:
- **Green rows** = NORMAL mileage
- **Orange rows** = WATCH / WARNING
- **Red rows** = CRITICAL (you get an email alert automatically)

You can filter by City, Car Make, Season, Alert Level to analyse beta patterns.

---

## TROUBLESHOOTING

**"AI analysis unavailable"** — Check ANTHROPIC_API_KEY in Netlify env vars

**Sheet not updating** — Re-deploy Apps Script (Deploy → Manage deployments → new version)

**App not installing on iPhone** — Must use Safari browser; tap Share → Add to Home Screen

**CORS error in console** — Ensure Netlify function URL is `/.netlify/functions/analyse` (relative path)

---

## FILE SUMMARY

| File | Purpose |
|------|---------|
| `public/index.html` | Complete PWA app — all screens, all logic |
| `public/manifest.json` | Makes it installable on home screen |
| `public/sw.js` | Offline caching service worker |
| `netlify/functions/analyse.js` | Anthropic API proxy — key never exposed |
| `netlify.toml` | Netlify build configuration |
| `apps-script.js` | Google Sheets webhook — paste into Apps Script |
| `DEPLOY.md` | This file |

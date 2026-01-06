# Hustle Her Social Suite (No‑Backend Micro‑SaaS)

A GitHub‑ready HTML/CSS/JS mini platform for business women who run their marketing on social media.

## What’s inside
- Landing page (Home + Pricing)
- Dashboard (Overview, Content Calendar, CEO To‑Dos, Contacts, Goals, Notes, Metrics)
- Local data storage (localStorage)
- Export/Import JSON backup

## Run locally
Just open `index.html` in a browser.

## Deploy to GitHub Pages (no terminal required)
1. Create a new GitHub repo (public is easiest).
2. Click **Add file → Upload files**
3. Upload **everything in this folder**:
   - `index.html`
   - `assets/` (entire folder)
4. Go to **Settings → Pages**
5. Under **Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
6. Save. Your site URL will appear on that page.

## Add Stripe links later
Open `assets/js/app.js` and find:
`stripeLinks: { starter: "", boss: "", ceo: "" }`

Paste your Stripe Checkout URLs in those fields.

## Notes
This is a front‑end MVP. Later you can replace localStorage with Supabase/Firebase without changing the UI.

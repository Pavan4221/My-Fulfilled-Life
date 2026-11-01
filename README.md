# My Fulfilled Life (v2.0.0 — React & TypeScript)

A calm, gentle personal wellbeing companion rewritten in **React 18**, **TypeScript**, and **Tailwind CSS**, built with **Vite**. See [RELEASE_NOTES_v2.0.0.md](./RELEASE_NOTES_v2.0.0.md) for full version details.

## Features

- **Daily Check-In**: Tend gentle daily intentions with tactile checkboxes, record moments of gratitude, and write an evening reflection.
- **Push Notifications & Reminders (100% Free)**:
  - Dedicated lock-screen reminder scheduling for each individual intention.
  - Morning Check-In and Evening Reflection reminders.
  - Active in-app timer alerts + background Service Worker Web Push support.
  - Instant test reminder tool in Settings.
- **Journal**: A distraction-free sanctuary for thoughts and memories, with timestamps and clean deletion.
- **My Intentions**: Customize your intentions list (up to 15 items), configure individual reminder times, or use the quick bulk text editor.
- **AI Companion**: Generate warm, non-judgmental daily and weekly reflection prompts formatted for ChatGPT and Gemini.
- **Insights**: Reflect on completion rhythms, gratitude, and entries without turning wellbeing into a high-pressure scorecard.
- **Private Data & Cloud Sync**: Connect with Google via Firebase Authentication and Cloud Firestore, or use Private Local Mode (browser storage).
- **Export & Import**: Full JSON backup and restore capabilities.
- **Responsive Layout**: Desktop sticky sidebar with gold-green brand mark + mobile collapsible sidebar drawer.

## Tech Stack & Free Cloud Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database & Auth**: Firebase Spark Plan (Free tier: Auth + Cloud Firestore)
- **Hosting**: GitHub Pages (Free, unlimited bandwidth for personal use)
- **Push Notification Dispatcher**: GitHub Actions Cron Workflow (`.github/workflows/reminders.yml`), running on GitHub's free runners (2,000 free runner minutes/month) for $0.00 cloud messaging.

---

## Free Cloud Push Setup (GitHub Actions + Firebase)

1. In your GitHub repository, open **Settings > Secrets and variables > Actions**.
2. Add a new repository secret:
   - `FIREBASE_SERVICE_ACCOUNT_KEY`: The JSON string of your Firebase service account private key (generated in Firebase Console > Project Settings > Service accounts > Generate new private key).
3. The scheduled workflow `.github/workflows/reminders.yml` will automatically run every 15 minutes to check due reminders across time zones and dispatch Web Push notifications to wake your phone lock screen for free!

---

## Deploying to GitHub Pages

### Method 1: Automatic GitHub Actions (Recommended)
This repository includes `.github/workflows/deploy.yml`.
1. Go to your repository on GitHub: **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Push your changes to the `main` branch. GitHub Actions will automatically build and publish the app!

### Method 2: Direct Root Push
If your repository serves GitHub Pages from the root folder (`/(root)`):
1. Run `npm run build`.
2. Copy the contents of the `dist/` folder into your repository root.
3. Commit and push to `main`.

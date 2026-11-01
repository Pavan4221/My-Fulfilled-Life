# My Fulfilled Life — v2.0.0 Release Notes

**Release Date:** 1 November 2026  
**Status:** Major Architecture & Feature Upgrade  
**Deployment Target:** GitHub Pages (Automated via GitHub Actions) + Firebase (Spark Free Tier)

---

## 🌟 Major Highlights

### 1. Cross-Framework Modernization (React 18 & TypeScript)
- **Full Architecture Rewrite**: Successfully migrated the single-page application from Dynamic/vanilla HTML and module scripts into a clean, modern **React 18** SPA using **TypeScript**, **Vite**, and **Tailwind CSS**.
- **State Management**: Built a unified `AppContext` provider managing intentions, daily check-ins, journal entries, sync state, and notification timers with automatic error boundaries and debounced auto-sync (450ms).
- **Responsive Navigation**: Preserved the tranquil visual identity with Georgia serif typography and the green-gold brand aesthetic. Features an expandable desktop sidebar and an accessible mobile collapsible drawer (☰ / ‹).

---

### 2. Lock-Screen Push Notifications & Reminders (100% Free)
- **Per-Intention Reminders**: Each intention can now have its own dedicated reminder time (e.g., `08:30 AM`), recurrence interval (Daily, Weekdays, Weekends), and custom gentle note.
- **Morning & Evening Routines**: Added dedicated time selectors for Morning Intention Check-In and Evening Gratitude/Reflection.
- **Web Push Protocol Support (`sw.js`)**: Updated the service worker with standard `push` and `notificationclick` handlers to wake devices and direct users straight to their check-in when tapped.
- **Active In-App Timer Alerts**: An active 20-second interval monitors device time while the app is foregrounded, firing gentle reminders even before cloud dispatch runs.
- **Instant Testing Tool**: Added a "Send Test Reminder" button in Settings to verify device sound, vibration, and banner delivery with one tap.

---

### 3. Free Cloud Push Dispatcher (GitHub Actions Cron)
- **$0.00 Serverless Architecture**: Replaced expensive cloud server or functions requirements with a scheduled GitHub Actions workflow (`.github/workflows/reminders.yml`).
- **Background Dispatcher (`scripts/dispatch-reminders.mjs`)**: Runs on a 15-minute cron schedule using GitHub's **2,000 free runner minutes/month**. It queries due reminders from your existing Firebase project (`my-fulfilled-life`) and sends push payloads directly to Apple APNs and Google FCM.

---

### 4. Automated GitHub Pages CI/CD
- **Automated Deployment Workflow (`.github/workflows/deploy.yml`)**: Compiles and deploys production builds to GitHub Pages automatically whenever code is pushed to `main`.
- **Relative Asset Resolution**: Configured `base: command === 'build' ? './' : '/'` in `vite.config.ts` so the PWA loads seamlessly on GitHub Pages subfolder paths (`/My-Fulfilled-Life/`).

---

### 5. Multi-Storage & Account Flexibility
- **Firebase Authentication & Firestore Sync**: Retained real-time Google Sign-In and cloud persistence for existing accounts.
- **Private Local Mode**: Added a local offline-first guest mode storing intentions and journal entries securely in browser storage (`localStorage`), allowing immediate testing without requiring sign-in.
- **Data Export & Import**: Added full JSON backup export and restore mechanisms in Settings.

---

## 📋 Comprehensive File Change Log

| File Path | Description of Changes |
| :--- | :--- |
| `package.json` | Upgraded project version to `2.0.0`; configured React 18, Vite, Tailwind CSS, TypeScript, and Canvas Confetti dependencies. |
| `vite.config.ts` | Configured Vite bundler with `@tailwindcss/vite`, React plugin, `base` URL logic, and dependency deduplication. |
| `src/main.tsx` | App entry point mounting React root with development cache auto-purge and production service worker registration. |
| `src/App.tsx` | Main application shell with view router (Home, Check-In, Journal, Intentions, AI Companion, Insights, Settings). |
| `src/context/AppContext.tsx` | Core React context managing authentication, intentions, daily autosave, journal entries, and notification timers. |
| `src/services/notificationService.ts` | Web Push helper service checking device support, requesting permissions, subscribing to push, and firing test alerts. |
| `src/firebase.ts` | Firebase initialization with modern Firestore v10 persistent multi-tab caching and Google Auth. |
| `src/types.ts` | Strong TypeScript definitions for `IntentionItem`, `NotificationSettings`, `DayData`, `JournalEntry`, and `ExportData`. |
| `src/components/IntentionsView.tsx` | Intention manager supporting individual reminder scheduling (time, recurrence, notes) and quick bulk text editing. |
| `src/components/CheckInView.tsx` | Check-in view with gentle intention checkboxes, scheduled reminder badges, and gratitude/reflection text areas. |
| `src/components/SettingsView.tsx` | Added Push Notification controls, device permission indicator, test reminder button, and JSON export/import. |
| `src/components/JournalView.tsx` | Distraction-free sanctuary for thoughts and memories with timestamped list and deletion management. |
| `src/components/AICompanionView.tsx` | Gentle daily and weekly wellbeing prompts formatted for copy/handoff to Gemini and ChatGPT. |
| `src/components/InsightsView.tsx` | Mindful rhythm view displaying daily completions, reflection counts, and calm words of encouragement. |
| `src/components/Header.tsx` | Header component with localized weekday date and responsive typography. |
| `src/components/Sidebar.tsx` | Responsive navigation with desktop sticky column and mobile collapsible drawer. |
| `sw.js` & `public/sw.js` | Service Worker v2.7 with offline caching and Web Push background event listeners. |
| `scripts/dispatch-reminders.mjs` | Node.js script for automated background reminder dispatch via Firebase Admin and Web Push. |
| `.github/workflows/deploy.yml` | GitHub Actions workflow to build and deploy the React PWA to GitHub Pages on every push. |
| `.github/workflows/reminders.yml` | GitHub Actions scheduled cron running every 15 minutes to trigger due reminders. |
| `dist/` | Production distribution assets compiled and ready for deployment. |
| `README.md` | Complete project documentation including architecture, cloud push secrets setup, and GitHub Pages instructions. |

---

## 🔒 Verification & Quality Assurance

- **Compilation**: Verified with `npm run build` and `compile_applet` (zero errors).
- **Type Safety**: Verified with `npm run lint` (`tsc --noEmit`, zero warnings or errors).
- **Service Worker Testing**: Validated that Vite development requests are excluded from caching to prevent stale module mismatches.
- **PWA Manifest & Icon**: Verified valid `manifest.webmanifest` and `icon.svg` SVG assets for standalone mobile display.

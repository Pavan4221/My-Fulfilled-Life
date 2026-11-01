MY FULFILLED LIFE — VERSION 1.2
================================

What's new in v1.2
- Separate daily reflection handoff to ChatGPT and Gemini.
- Weekly reflection handoff to ChatGPT and Gemini, using the last seven days of recorded check-ins.
- Preview the exact prompt before sharing it.
- Clear privacy notice: nothing is sent automatically; you decide whether to paste and send.
- Existing v1/v1.1 journal data is retained because the app keeps the same local storage key.
- Updated service-worker cache so the browser can fetch the new version.

What this app does
- Daily intentions with editable labels
- Gratitude and evening reflection
- Weekly activity view
- Local browser storage
- JSON export/import backup
- Manual AI companion handoff to ChatGPT or Gemini
- Offline cache after first visit (when served over HTTPS)

Important limitations
- This is a PWA starter, not an App Store app.
- Data stays in the browser on this device. There is no account, cloud sync, or automatic backup.
- The app does not call Gemini API or OpenAI API and does not use your consumer subscriptions programmatically.
- AI handoff copies a prompt and opens the selected AI website. You must paste and send it yourself.
- Only the text shown in the prompt preview is included in the handoff. The rest of your browser storage is not uploaded automatically.

UPDATING AN EXISTING GITHUB PAGES APP
1. On your laptop, download and unzip this v1.2 package.
2. Open your existing GitHub repository in a browser.
3. Upload/replace these three files in the repository root:
   - index.html
   - manifest.webmanifest
   - sw.js
   If GitHub asks, confirm that you want to replace the existing files.
4. Commit the changes to the main branch.
5. Wait about 1–3 minutes for GitHub Pages to publish.
6. Open your existing GitHub Pages URL on your iPhone.
7. If the old version remains visible, fully close Safari and reopen the URL. If needed, remove the Home Screen shortcut and add it again after confirming the browser URL shows v1.2.

FIRST-TIME GITHUB PAGES SETUP
1. Sign in to GitHub and create a repository (public is simplest for GitHub Pages).
2. Upload index.html, manifest.webmanifest and sw.js to the repository root.
3. Open repository Settings > Pages.
4. Under Build and deployment, choose Deploy from a branch.
5. Select branch main and folder /(root), then Save.
6. Wait for GitHub Pages to publish and open the generated HTTPS URL in Safari on your iPhone.
7. In Safari, tap Share > Add to Home Screen > Add.

BACKUPS
- Use Export my data to download a JSON backup periodically.
- To restore, open the app on the target browser/device and use Import backup.
- Import replaces the app's current journal data in that browser. Export first if you want to preserve it.

Privacy reminder
Journal entries can be personal. Review the prompt preview every time and share only what you are comfortable sending to ChatGPT or Gemini. Check each provider's current privacy/data settings for your account.

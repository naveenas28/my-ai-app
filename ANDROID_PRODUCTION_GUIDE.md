# AgriVerse AI — Android Production Build & Release Guide

This guide describes how to bundle AgriVerse AI into a production-ready Android App (.AAB / .APK) using **Capacitor** and **Android Studio**, adhering strictly to the zero-billing policy until you are ready to pay the one-time Google Play registration fee ($25).

---

## 1. Prerequisites (All Free & Open Source)

1. **Android Studio Ladybug or Meerkat (Free)**: Download from developer.android.com
2. **Node.js 20+ & npm (Free)**
3. **Capacitor CLI**:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```

---

## 2. Initialize Android Platform

In the `my-ai-app` root directory:

```bash
# 1. Build production web bundle
npm run build

# 2. Add Android native platform
npx cap add android

# 3. Synchronize web assets into Android project
npx cap sync
```

---

## 3. Native Device Permissions (`AndroidManifest.xml`)

Open `android/app/src/main/AndroidManifest.xml` and ensure the following permissions are declared:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Internet Access for Weather, Mandi Prices & Backend APIs -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Microphone Permission for Krishi Voice Advisor -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <!-- Camera Permission for Crop Doctor Leaf Diagnosis -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <!-- Notifications for Weather Alerts & Reminders -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
</manifest>
```

---

## 4. App Icon & Splash Screen

Use `@capacitor/assets` to automatically generate all Android densities:

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --android
```

The splash screen is pre-configured in `capacitor.config.ts`:
- Background Color: `#064e3b` (AgriVerse Forest Green)
- Duration: 2000ms

---

## 5. Build Signed Android App Bundle (.AAB) for Google Play

1. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
2. In Android Studio, navigate to **Build > Generate Signed Bundle / APK...**
3. Choose **Android App Bundle (.aab)**.
4. Create a new Keystore (`agriverse-release-key.jks`) and store the password safely.
5. Select **release** build variant.
6. The final `.aab` file will be generated in `android/app/release/app-release.aab`.

---

## 6. Google Play Store Submission (One-Time Developer Fee)

- Pay the **one-time $25 USD developer registration fee** directly on the [Google Play Console](https://play.google.com/console).
- No recurring subscription or backend cloud fees are required.
- Upload `app-release.aab` under **Production > Create new release**.

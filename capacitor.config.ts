const config = {
  appId: 'ai.agriverse.farmer',
  appName: 'AgriVerse AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
    // Connects to production backend or local development host
    url: process.env.VITE_BACKEND_URL || undefined
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#064e3b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;

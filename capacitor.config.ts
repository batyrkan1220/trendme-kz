import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kz.trendme.app',
  appName: 'trendme',
  webDir: 'dist',
  server: {
    url: 'https://4e239644-3e62-4a93-918b-a1adac8c0446.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#f5f6fa',
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      overlaysWebView: true,
    },
  },
};

export default config;

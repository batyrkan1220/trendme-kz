import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kz.trendme.app',
  appName: 'trendme',
  webDir: 'dist',
  server: {
    url: 'https://trendme-kz.lovable.app?forceHideBadge=true&native=1',
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

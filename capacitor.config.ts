import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trendme.kz',
  appName: 'trendme',
  webDir: 'dist',
  server: {
    url: 'https://trendme.kz?forceHideBadge=true&native=1',
    allowNavigation: [
      'trendme.kz',
      '*.trendme.kz',
      '*.supabase.co',
      '*.supabase.com',
    ],
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#0a0a0a',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true,
    },
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trendme.kz',
  appName: 'Trendme',
  webDir: 'dist',
  server: {
    url: 'https://trendme-kz.lovable.app?forceHideBadge=true&native=1',
    cleartext: true,
    allowNavigation: [
      'trendme.kz',
      '*.trendme.kz',
      'trendme-kz.lovable.app',
      '*.lovable.app',
      '*.lovableproject.com',
      '*.supabase.co',
      '*.supabase.com',
    ],
  },
  ios: {
    preferredContentMode: 'mobile',
    backgroundColor: '#0a0a0a',
    scrollEnabled: false,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true,
    },
  },
};

export default config;

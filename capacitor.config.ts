import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kz.trendme.app',
  appName: 'trendme',
  webDir: 'dist',
  server: {
    url: 'https://trendme-kz.lovable.app?forceHideBadge=true&native=1',
    cleartext: true,
    allowNavigation: [
      'trendme-kz.lovable.app',
      '*.lovable.app',
      '*.lovableproject.com',
      '*.supabase.co',
      '*.supabase.com',
      'trendme.kz',
      '*.trendme.kz',
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

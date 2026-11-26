import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'HemoNexus — Blood Intelligence Network',
  description: 'Predictive emergency blood shortage intelligence and coordinated response for hospitals and blood banks. Demonstration network uses clearly labelled synthetic data.',
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/brand/HemoNexus-app-icon-dark-1024px.png' },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hemonexus-rho.vercel.app'),
  openGraph: { title: 'HemoNexus', description: 'Predictive emergency blood shortage intelligence.', images: ['/brand/HemoNexus-primary-horizontal-3200px.png'] },
};
export const viewport: Viewport = { themeColor: '#101B35', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

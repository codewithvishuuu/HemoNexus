import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HemoNexus — Predictive Blood Intelligence',
  description: 'Predictive Emergency Blood Shortage Network. Decision support and coordination for participating institutions. All demonstration data is simulated.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

/* eslint-disable @next/next/no-img-element */
type Variant = 'light-bg' | 'dark-bg' | 'mark';

/** Uses the official supplied logo kit only. Served unoptimized to preserve the exact supplied assets. */
export default function Logo({ variant = 'light-bg', className = '', height = 30 }: { variant?: Variant; className?: string; height?: number }) {
  if (variant === 'mark') {
    return <img src="/brand/HemoNexus-shield-icon.svg" alt="HemoNexus" width={height} height={height} className={className} />;
  }
  const src = variant === 'dark-bg' ? '/brand/HemoNexus-white-darkbg-3200px.png' : '/brand/HemoNexus-primary-horizontal-3200px.png';
  const width = Math.round(height * 3.75);
  return <img src={src} alt="HemoNexus" width={width} height={height} className={className} style={{ objectFit: 'contain', maxWidth: '100%', height }} />;
}

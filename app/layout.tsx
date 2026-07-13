import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Chonix Bot — Telegram Downloader',
  description: 'Chonix Bot — multi-client Telegram bot manager & watermark-free media downloader.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">{children}</body>
    </html>
  );
}

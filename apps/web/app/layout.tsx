import { Providers } from '@/shared/lib/providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FoodWise Intelligence',
  description: 'Scan-first grocery intelligence app',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FoodWise",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body suppressHydrationWarning>
        {/* 
            The Providers component handles MUI, Theme, and React Query 
            safely on the client side. 
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
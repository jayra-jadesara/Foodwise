import { Providers } from '@/shared/lib/providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FoodWise Intelligence',
  description: 'Scan-first grocery intelligence app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </head>
      <body>
        {/* 
            The Providers component handles MUI, Theme, and React Query 
            safely on the client side. 
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
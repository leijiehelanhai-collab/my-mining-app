// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers'; // 导入我们刚创建的 Providers

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My Mining DApp',
  description: 'Activate mining and earn MMT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 👇 关键就在这一行！ 
          我们必须用 <Providers> 包裹 {children}
        */}
        <Providers>{children}</Providers> 
      </body>
    </html>
  );
}
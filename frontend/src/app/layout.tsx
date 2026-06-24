import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Global InvestIQ - 2020 Sandbox',
  description: 'Portfolio tracker and investment risk advisor sandbox for Kenyan investors.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex bg-gray-950 text-gray-100 antialiased overflow-x-hidden">
        {/* Sidebar Navigation */}
        <Sidebar className="hidden md:flex flex-shrink-0" />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-transparent">
          {children}
        </div>
      </body>
    </html>
  );
}

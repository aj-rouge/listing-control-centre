import { ThemeProvider } from "next-themes";
import AddStockRowModal from "./components/AddStockRowModal";
import NewBatchModal from "./components/NewBatchModal";
import RowDetail from "./components/RowDetail";
import TopBar from "./components/TopBar";
import "./globals.css";
import localFont from "next/font/local";
import Script from "next/script"; // 1. Import Next.js Script

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "HTML Description Generator",
  description: "Generated eBay HTML Descriptions for your listings in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 2. Use Next.js <Script> with beforeInteractive */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <TopBar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
            {children}
          </main>
          <RowDetail /> <NewBatchModal /> <AddStockRowModal />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/hooks/use-theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CRM Watches Traders",
    template: "%s — CRM Watches Traders",
  },
  description: "Self-hostable CRM template for WhatsApp and CRM Watches Traders.",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [{ url: "/company_logo.png" }],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  colorScheme: "light dark",
  // "dark light" => "light dark"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} light h-full antialiased`}>
      <body className="min-h-full bg-theme-bg text-theme-text font-sans transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster
          theme="light"
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--theme-bg-card)",
              border: "1px solid var(--theme-border)",
              color: "var(--theme-text)",
            },
          }}
        />
      </body>
    </html>
  );
}

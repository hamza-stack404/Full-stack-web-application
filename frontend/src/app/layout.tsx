import type { Metadata } from "next";
import "./globals.css";
import { ErrorProvider } from "../providers/ErrorProvider";
import { ThemeProvider } from "../providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Todo App - AI-Powered Task Management",
  description: "Modern todo application with AI chatbot assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        <ThemeProvider>
          <ErrorProvider>
            {children}
            <Toaster />
          </ErrorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

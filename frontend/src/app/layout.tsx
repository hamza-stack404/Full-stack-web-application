import type { Metadata } from "next";
import "./globals.css";
import { ErrorProvider } from "../providers/ErrorProvider";
import { ThemeProvider } from "../providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import NotificationPermissionHandler from "../components/NotificationPermissionHandler";

export const metadata: Metadata = {
  title: "Todo App - AI-Powered Task Management",
  description: "Modern todo application with AI chatbot assistance and real-time updates",
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
            <NotificationPermissionHandler />
            {children}
            <Toaster />
          </ErrorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

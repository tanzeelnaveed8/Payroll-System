import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import ToastContainer from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MeeTech Labs Management system",
  description: "MeeTech Labs Management system - Production-grade payroll and workforce management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              {children}
              <ToastContainer />
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

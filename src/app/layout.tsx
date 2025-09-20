import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { SubscriptionProvider } from "@/lib/subscription-context";

const sourceSansPro = Source_Sans_3({
  variable: "--font-source-sans-pro",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Truleado - Find Your Next Customers on Reddit",
  description: "Stop cold emailing strangers. Discover relevant Reddit discussions where people are actively seeking solutions your SaaS product provides.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sourceSansPro.variable} antialiased`}
      >
        <AuthProvider>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

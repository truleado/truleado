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
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M53L68M3');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body
        className={`${sourceSansPro.variable} antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M53L68M3"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
        <AuthProvider>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "Truleado - Find Your Next Customers on Reddit",
  description: "Stop cold emailing strangers. Discover relevant Reddit discussions where people are actively seeking solutions your SaaS product provides.",
  icons: {
    icon: [
      { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png?v=2', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64x64.png?v=2', sizes: '64x64', type: 'image/png' },
      { url: '/favicon-96x96.png?v=2', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-128x128.png?v=2', sizes: '128x128', type: 'image/png' },
      { url: '/favicon-144x144.png?v=2', sizes: '144x144', type: 'image/png' },
      { url: '/favicon-152x152.png?v=2', sizes: '152x152', type: 'image/png' },
      { url: '/favicon-android-chrome-192x192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-256x256.png?v=2', sizes: '256x256', type: 'image/png' },
      { url: '/favicon-384x384.png?v=2', sizes: '384x384', type: 'image/png' },
      { url: '/favicon-512x512.png?v=2', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.png?v=2', sizes: 'any' },
    ],
    shortcut: '/favicon.ico?v=2',
    apple: [
      { url: '/favicon-apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg?v=2', color: '#148cfc' },
    ],
  },
  manifest: '/site.webmanifest',
};

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#148cfc',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicon Configuration */}
        <link rel="icon" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png?v=2" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64x64.png?v=2" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png?v=2" />
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon-128x128.png?v=2" />
        <link rel="icon" type="image/png" sizes="144x144" href="/favicon-144x144.png?v=2" />
        <link rel="icon" type="image/png" sizes="152x152" href="/favicon-152x152.png?v=2" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-android-chrome-192x192.png?v=2" />
        <link rel="icon" type="image/png" sizes="256x256" href="/favicon-256x256.png?v=2" />
        <link rel="icon" type="image/png" sizes="384x384" href="/favicon-384x384.png?v=2" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon-android-chrome-512x512.png?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon-apple-touch-icon.png?v=2" />
        <link rel="mask-icon" href="/favicon.svg?v=2" color="#148cfc" />
        <link rel="manifest" href="/site.webmanifest?v=2" />
        <meta name="msapplication-TileColor" content="#148cfc" />
        <meta name="msapplication-config" content="/browserconfig.xml?v=2" />
        
        {/* Google Fonts - Inter (similar to Söhne) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        
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
        
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RCPVDVSYRC"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RCPVDVSYRC');
            `,
          }}
        />
        {/* End Google tag (gtag.js) */}
      </head>
      <body
        className="antialiased"
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
        
        <ErrorBoundary>
          <AuthProvider>
            <SubscriptionProvider>
              <PageTransition>
                {children}
              </PageTransition>
            </SubscriptionProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

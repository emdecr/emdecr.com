import GlobalNav from "./components/GlobalNav";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <head>
        <Script
          src="https://scripts.withcabin.com/hello.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="px-4 w-full mx-auto max-w-2xl">
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <GlobalNav />
          <div id="main-content">
            {children}
          </div>
          <footer className="prose pt-10 pb-10">
            <p className="text-sm"><a href="https://github.com/emdecr/" rel="noopener noreferrer" className="underline link--external">GitHub</a>. <a href="https://www.linkedin.com/in/emilydelacruz/" rel="noopener noreferrer" className="underline link--external">LinkedIn</a></p>
            <p className="text-sm">&copy; {currentYear} Emily Dela Cruz. Fonts by <a href="https://www.collletttivo.it/typefaces" rel="noopener noreferrer" className="underline link--external">Collletttivo</a>.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}

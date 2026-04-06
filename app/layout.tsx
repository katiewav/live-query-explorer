import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Live Query Explorer",
  description: "Real-time social query engine — search what the internet is saying across Reddit, Instagram, and TikTok",
};

// Inline script to apply theme before paint — prevents FOUC
const themeScript = `
(function() {
  var saved = localStorage.getItem('theme');
  var dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-bg text-text-primary antialiased min-h-screen transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}

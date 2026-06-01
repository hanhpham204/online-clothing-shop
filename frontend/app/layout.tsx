import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import CartProvider from "./components/CartProvider";
import WishlistProvider from "./components/WishlistProvider";
import { Toaster } from "sonner";
import ChatbotWidget from "./components/ChatbotWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LUA LA Fashion Store",
  description:
    "Discover soft, elegant, and modern fashion for women, men, and kids — designed for comfort, confidence, and everyday charm.",
};

// viewportFit "cover" lets the page render under iOS notches / home-indicator
// areas, which is required for `env(safe-area-inset-*)` to return non-zero
// values for fixed UI like the floating chat bubble.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              {children}
              <ChatbotWidget />
              {/* Bottom-left keeps toasts clear of both the sticky header
                  (top) and the floating chat bubble (bottom-right). */}
              <Toaster position="bottom-left" richColors closeButton />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

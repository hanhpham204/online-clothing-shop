import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VogueStore — Thời Trang Cao Cấp",
  description:
    "Cửa hàng thời trang trực tuyến hàng đầu Việt Nam. Khám phá bộ sưu tập áo, quần, váy đầm và phụ kiện thời trang mới nhất.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "10px",
              background: "#1a1a2e",
              color: "#fff",
              fontSize: "0.9rem",
            },
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

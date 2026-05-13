import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "VogueStore — Thời Trang Cao Cấp",
  description: "Cửa hàng thời trang trực tuyến hàng đầu Việt Nam. Khám phá bộ sưu tập áo, quần, váy đầm và phụ kiện thời trang mới nhất.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '10px',
              background: '#1a1a2e',
              color: '#fff',
              fontSize: '0.9rem',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}

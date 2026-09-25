import "./globals.css";

export const metadata = {
  title: "Làng Ma Sói - Bộ Bài Ảo & Trợ Lý Quản Trò",
  description:
    "Trợ lý chơi Ma Sói offline và online cho nhóm bạn. Tự động chia bài, lật úp thẻ bài bí mật 3D, kịch bản gọi đêm và bảng điều khiển Quản trò.",
  icons: {
    icon: "/cards/card_back.jpg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

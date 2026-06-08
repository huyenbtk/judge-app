import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Văn nghệ Gala Dinner A-Star Group",
  description: "Chấm điểm và tổng hợp kết quả các đội thi",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={kanit.variable}>
      <body>{children}</body>
    </html>
  );
}

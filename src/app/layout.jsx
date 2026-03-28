import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata = {
  title: "Moku — Study Must Be Fun",
  description: "AI-powered study companion. Upload modul, generate laporan praktikum, study session dengan Moku yang tumbuh bersamamu.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

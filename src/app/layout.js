import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"], // Regular, Semi-bold, Bold, Black
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Regular, Medium, Semi-bold, Bold
});

export const metadata = {
  title: "CreativeChain",
  description: "Creative collaboration platform powered by blockchain",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${outfit.variable} ${inter.variable} antialiased bg-base h-full flex flex-col`}
      >
        <Navbar />
        <main className="pt-6 flex-1">
          <ThirdwebProvider>
            {children}
          </ThirdwebProvider>
        </main>
        <Footer />
      </body>
    </html>
  );
}

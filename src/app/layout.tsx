import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/presentation/components/layout/Navbar";
import { Footer } from "@/presentation/components/layout/Footer";

import { ToastProvider } from "@/presentation/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "Balela Trunfo - O Gerador de Cartas da Comunidade",
  description: "Crie, colecione e exporte suas cartas de Super Trunfo do Balela.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} ${outfit.variable}`}>
        <ToastProvider>
          <Navbar />
          <main style={{ flex: 1 }}>
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}

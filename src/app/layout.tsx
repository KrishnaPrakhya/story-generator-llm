import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/main/Navbar";
import Footer from "@/components/main/Footer";
import AuthProvider from "@/context/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Story Generator",
  description: "Story Generation using LLM",
};

export default function RootLayout({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.164.1/three.cjs"></script>
      </head>
      <body
        className={`${inter.className} bg-[#030014] overflow-y-scroll overflow-x-hidden`}
        >
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">

        {children}
        </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

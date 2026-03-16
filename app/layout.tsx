import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import logoPanDeTata from "../logopandetata.png";

export const metadata: Metadata = {
  title: "Pre-Operativa | Pan de Tata",
  description: "La pre operativa en Pan de Tata para identificar incidencias y detectar no conformidades por área y equipo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <div className="fixed left-4 top-4 z-50 flex items-center gap-3">
          <a
            href="https://pre-operativ-afrontend-nine.vercel.app/"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Ir al menú"
          >
            <span className="text-xl leading-none">☰</span>
          </a>
          <Image
            src={logoPanDeTata}
            alt="Pan de Tata"
            className="h-16 w-auto rounded-xl border border-slate-300 bg-white p-1.5 shadow-sm"
            priority
          />
        </div>

        <div className="min-h-screen pb-12">{children}</div>
        <p className="fixed bottom-2 left-3 text-xs text-slate-400">
          Elaborado por el pasante de producción: Gerardo Siblesz
        </p>
      </body>
    </html>
  );
}

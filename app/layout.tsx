import type { Metadata } from "next";
import "./globals.css";

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
        <div className="min-h-screen pb-12">{children}</div>
        <p className="fixed bottom-2 left-3 text-xs text-slate-400">
          Elaborado por el pasante de producción: Gerardo Siblesz
        </p>
      </body>
    </html>
  );
}

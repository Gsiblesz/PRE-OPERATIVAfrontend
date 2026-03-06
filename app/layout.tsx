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
        <details className="fixed left-4 top-4 z-50 group">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50">
            <span className="text-xl leading-none">☰</span>
          </summary>

          <nav className="mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <a
              href="/"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Inspección
            </a>
            <a
              href="/resultados"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Resultados
            </a>
          </nav>
        </details>

        <div className="min-h-screen pb-12">{children}</div>
        <p className="fixed bottom-2 left-3 text-xs text-slate-400">
          Elaborado por el pasante de producción: Gerardo Siblesz
        </p>
      </body>
    </html>
  );
}

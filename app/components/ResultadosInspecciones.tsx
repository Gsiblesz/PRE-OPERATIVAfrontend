"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type EstadoAspecto = "conforme" | "no_conforme";

type AspectoEvaluado = {
  aspecto: string;
  estado: EstadoAspecto;
};

type EquipoEvaluado = {
  equipoId: string;
  equipoNombre: string;
  aspectos: AspectoEvaluado[];
  observacionEquipo?: string;
};

type Inspeccion = {
  id: string;
  fecha: string;
  area: string;
  evaluacion_equipos: EquipoEvaluado[];
  created_at: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
const API_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/api/inspecciones-preoperativas`;

export default function ResultadosInspecciones() {
  const [passwordInput, setPasswordInput] = useState("");
  const [password, setPassword] = useState("");
  const [area, setArea] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const areasDisponibles = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.area))).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const resumen = useMemo(() => {
    const totalInspecciones = data.length;
    const totalEquipos = data.reduce((acc, row) => acc + row.evaluacion_equipos.length, 0);

    const totalNoConformes = data.reduce((acc, row) => {
      const count = row.evaluacion_equipos.reduce(
        (equiposAcc, equipo) =>
          equiposAcc + equipo.aspectos.filter((aspecto) => aspecto.estado === "no_conforme").length,
        0
      );
      return acc + count;
    }, 0);

    return { totalInspecciones, totalEquipos, totalNoConformes };
  }, [data]);

  const datosPorArea = useMemo(() => {
    return data.reduce<Record<string, Inspeccion[]>>((acc, row) => {
      if (!acc[row.area]) {
        acc[row.area] = [];
      }
      acc[row.area].push(row);
      return acc;
    }, {});
  }, [data]);

  const cargarResultados = async (passwordValue: string, keepFilters = true) => {
    if (!API_BASE_URL) {
      setError("Falta configurar NEXT_PUBLIC_API_URL en Vercel.");
      return;
    }

    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (keepFilters && area) params.set("area", area);
    if (keepFilters && from) params.set("from", from);
    if (keepFilters && to) params.set("to", to);

    const url = params.toString() ? `${API_ENDPOINT}?${params.toString()}` : API_ENDPOINT;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-results-password": passwordValue,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Contraseña incorrecta.");
        }
        const payload = await response.json();
        throw new Error(payload?.error ?? "No se pudieron cargar los resultados.");
      }

      const payload = await response.json();
      setData(payload.data ?? []);
      setPassword(passwordValue);
      setPasswordInput("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onUnlock = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwordInput.trim()) {
      setError("Ingresa la contraseña para continuar.");
      return;
    }
    await cargarResultados(passwordInput.trim(), false);
  };

  const onFiltrar = async (event: FormEvent) => {
    event.preventDefault();
    if (!password) return;
    await cargarResultados(password, true);
  };

  const onLimpiar = async () => {
    setArea("");
    setFrom("");
    setTo("");
    if (!password) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "GET",
        headers: {
          "x-results-password": password,
        },
      });

      if (!response.ok) {
        throw new Error("No se pudieron recargar los resultados.");
      }

      const payload = await response.json();
      setData(payload.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onCerrarVista = () => {
    setPassword("");
    setPasswordInput("");
    setData([]);
    setError("");
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">Resultados de inspecciones</h1>
            <p className="mt-1 text-sm text-slate-500">Vista protegida para análisis por área y fecha</p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Volver al registro
          </Link>
        </div>
      </section>

      {!password ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <form className="space-y-3" onSubmit={onUnlock}>
            <label className="block text-sm font-medium text-slate-700">Contraseña de resultados</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="Ingresa contraseña"
              className="w-full rounded-xl border border-slate-300 p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Entrar a resultados
            </button>
          </form>
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </section>
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Inspecciones</p>
              <p className="text-2xl font-semibold text-slate-800">{resumen.totalInspecciones}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Equipos evaluados</p>
              <p className="text-2xl font-semibold text-slate-800">{resumen.totalEquipos}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">No conformes</p>
              <p className="text-2xl font-semibold text-rose-700">{resumen.totalNoConformes}</p>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <form className="grid gap-3 md:grid-cols-4" onSubmit={onFiltrar}>
              <select
                value={area}
                onChange={(event) => setArea(event.target.value)}
                className="rounded-xl border border-slate-300 p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">Todas las áreas</option>
                {areasDisponibles.map((areaItem) => (
                  <option key={areaItem} value={areaItem}>
                    {areaItem}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="rounded-xl border border-slate-300 p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />

              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="rounded-xl border border-slate-300 p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {loading ? "Cargando..." : "Filtrar"}
                </button>
                <button
                  type="button"
                  onClick={onLimpiar}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Limpiar
                </button>
              </div>
            </form>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onCerrarVista}
                className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
              >
                Cerrar vista protegida
              </button>
            </div>
            {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          </section>

          <section className="space-y-4">
            {Object.entries(datosPorArea).map(([areaNombre, inspecciones]) => (
              <article
                key={areaNombre}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6"
              >
                <h2 className="text-lg font-semibold text-slate-800">{areaNombre}</h2>
                <p className="text-sm text-slate-500">{inspecciones.length} inspecciones</p>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {inspecciones.map((inspeccion) => (
                    <div
                      key={inspeccion.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold text-slate-800">Fecha: {inspeccion.fecha}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(inspeccion.created_at).toLocaleString("es-VE")}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {inspeccion.evaluacion_equipos.map((equipo) => (
                          <div key={`${inspeccion.id}-${equipo.equipoId}`} className="rounded-lg bg-white p-3">
                            <p className="font-medium text-slate-800">{equipo.equipoNombre}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {equipo.aspectos.map((aspecto) => (
                                <span
                                  key={`${equipo.equipoId}-${aspecto.aspecto}`}
                                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                                    aspecto.estado === "conforme"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-rose-100 text-rose-700"
                                  }`}
                                >
                                  {aspecto.aspecto}: {aspecto.estado === "conforme" ? "Conforme" : "No conforme"}
                                </span>
                              ))}
                            </div>
                            {equipo.observacionEquipo ? (
                              <p className="mt-2 text-sm text-slate-600">
                                Observación: {equipo.observacionEquipo}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
            {!loading && data.length === 0 ? (
              <article className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm md:p-6">
                No hay resultados para los filtros seleccionados.
              </article>
            ) : null}
          </section>
        </>
      )}
    </main>
  );
}

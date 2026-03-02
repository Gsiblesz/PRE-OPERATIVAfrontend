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
  const [equipoQuery, setEquipoQuery] = useState("");
  const [soloNoConformes, setSoloNoConformes] = useState(false);
  const [data, setData] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const areasDisponibles = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.area))).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const dataFiltrada = useMemo(() => {
    const query = equipoQuery.trim().toLowerCase();

    return data
      .map((inspeccion) => {
        const equipos = inspeccion.evaluacion_equipos.filter((equipo) => {
          const coincideNombre = query
            ? equipo.equipoNombre.toLowerCase().includes(query)
            : true;

          const tieneNoConformes = equipo.aspectos.some(
            (aspecto) => aspecto.estado === "no_conforme"
          );

          if (soloNoConformes && !tieneNoConformes) return false;
          if (query && !coincideNombre) return false;
          return true;
        });

        return {
          ...inspeccion,
          evaluacion_equipos: equipos,
        };
      })
      .filter((inspeccion) => inspeccion.evaluacion_equipos.length > 0);
  }, [data, equipoQuery, soloNoConformes]);

  const resumen = useMemo(() => {
    const totalInspecciones = dataFiltrada.length;
    const totalEquipos = dataFiltrada.reduce((acc, row) => acc + row.evaluacion_equipos.length, 0);
    const totalNoConformes = dataFiltrada.reduce(
      (acc, row) =>
        acc +
        row.evaluacion_equipos.reduce(
          (equiposAcc, equipo) =>
            equiposAcc +
            equipo.aspectos.filter((aspecto) => aspecto.estado === "no_conforme").length,
          0
        ),
      0
    );

    const inspeccionesConIncidencias = dataFiltrada.filter((row) =>
      row.evaluacion_equipos.some((equipo) =>
        equipo.aspectos.some((aspecto) => aspecto.estado === "no_conforme")
      )
    ).length;

    return {
      totalInspecciones,
      totalEquipos,
      totalNoConformes,
      inspeccionesConIncidencias,
      tasaIncidencia:
        totalInspecciones > 0
          ? Math.round((inspeccionesConIncidencias / totalInspecciones) * 100)
          : 0,
    };
  }, [dataFiltrada]);

  const datosPorArea = useMemo(() => {
    return dataFiltrada.reduce<Record<string, Inspeccion[]>>((acc, row) => {
      if (!acc[row.area]) {
        acc[row.area] = [];
      }
      acc[row.area].push(row);
      return acc;
    }, {});
  }, [dataFiltrada]);

  const incidenciasPorArea = useMemo(() => {
    const map = dataFiltrada.reduce<Record<string, number>>((acc, row) => {
      const noConformesArea = row.evaluacion_equipos.reduce(
        (eqAcc, equipo) =>
          eqAcc + equipo.aspectos.filter((aspecto) => aspecto.estado === "no_conforme").length,
        0
      );

      acc[row.area] = (acc[row.area] ?? 0) + noConformesArea;
      return acc;
    }, {});

    return Object.entries(map)
      .map(([areaNombre, total]) => ({ areaNombre, total }))
      .sort((a, b) => b.total - a.total);
  }, [dataFiltrada]);

  const topEquiposNoConformes = useMemo(() => {
    const map = dataFiltrada.reduce<Record<string, number>>((acc, row) => {
      row.evaluacion_equipos.forEach((equipo) => {
        const noConformes = equipo.aspectos.filter(
          (aspecto) => aspecto.estado === "no_conforme"
        ).length;

        if (noConformes > 0) {
          acc[equipo.equipoNombre] = (acc[equipo.equipoNombre] ?? 0) + noConformes;
        }
      });

      return acc;
    }, {});

    return Object.entries(map)
      .map(([equipoNombre, total]) => ({ equipoNombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [dataFiltrada]);

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
    setEquipoQuery("");
    setSoloNoConformes(false);
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
            <p className="mt-1 text-sm text-slate-500">
              La pre operativo en Pan de Tata para identificar incidencias y detectar no conformidades por área y equipo
            </p>
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
              <p className="text-sm text-slate-500">Inspecciones con incidencias</p>
              <p className="text-2xl font-semibold text-amber-700">{resumen.inspeccionesConIncidencias}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">No conformes</p>
              <p className="text-2xl font-semibold text-rose-700">{resumen.totalNoConformes}</p>
            </article>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Equipos evaluados</p>
              <p className="text-2xl font-semibold text-slate-800">{resumen.totalEquipos}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Tasa de incidencia</p>
              <p className="text-2xl font-semibold text-slate-800">{resumen.tasaIncidencia}%</p>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <form className="grid gap-3 md:grid-cols-5" onSubmit={onFiltrar}>
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

              <input
                type="text"
                value={equipoQuery}
                onChange={(event) => setEquipoQuery(event.target.value)}
                placeholder="Buscar equipo"
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

            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={soloNoConformes}
                onChange={(event) => setSoloNoConformes(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Mostrar solo equipos con no conformidades
            </label>

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

          <section className="grid gap-3 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <h2 className="text-base font-semibold text-slate-800">No conformidades por área</h2>
              <div className="mt-3 space-y-2">
                {incidenciasPorArea.map((item) => {
                  const max = incidenciasPorArea[0]?.total ?? 1;
                  const width = Math.max(8, Math.round((item.total / max) * 100));
                  return (
                    <div key={item.areaNombre}>
                      <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                        <span>{item.areaNombre}</span>
                        <span>{item.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-rose-400" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
                {incidenciasPorArea.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin incidencias para mostrar.</p>
                ) : null}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <h2 className="text-base font-semibold text-slate-800">Top equipos con no conformidades</h2>
              <div className="mt-3 space-y-2">
                {topEquiposNoConformes.map((item) => {
                  const max = topEquiposNoConformes[0]?.total ?? 1;
                  const width = Math.max(8, Math.round((item.total / max) * 100));
                  return (
                    <div key={item.equipoNombre}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm text-slate-600">
                        <span className="line-clamp-1">{item.equipoNombre}</span>
                        <span>{item.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-amber-400" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
                {topEquiposNoConformes.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin equipos con no conformidades.</p>
                ) : null}
              </div>
            </article>
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
                          <div
                            key={`${inspeccion.id}-${equipo.equipoId}`}
                            className={`rounded-lg bg-white p-3 ${
                              equipo.aspectos.some((aspecto) => aspecto.estado === "no_conforme")
                                ? "border border-rose-200"
                                : ""
                            }`}
                          >
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
            {!loading && dataFiltrada.length === 0 ? (
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

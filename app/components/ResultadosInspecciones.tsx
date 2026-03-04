"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const MONTH_OPTIONS = [
  { value: "01", label: "Ene" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dic" },
];

const YEAR_OPTIONS = ["2026", "2027", "2028", "2029", "2030"];

const CHART_COLORS = [
  { stroke: "text-rose-500", dot: "bg-rose-500" },
  { stroke: "text-amber-500", dot: "bg-amber-500" },
  { stroke: "text-blue-500", dot: "bg-blue-500" },
  { stroke: "text-emerald-500", dot: "bg-emerald-500" },
  { stroke: "text-purple-500", dot: "bg-purple-500" },
  { stroke: "text-cyan-500", dot: "bg-cyan-500" },
];

const OBSERVATION_STOPWORDS = new Set([
  "para",
  "con",
  "sin",
  "una",
  "uno",
  "del",
  "las",
  "los",
  "que",
  "por",
  "esta",
  "este",
  "equipo",
  "area",
  "área",
  "falta",
  "tiene",
  "hay",
  "como",
  "sobre",
  "desde",
  "entre",
  "operativa",
]);

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
  responsable?: string;
  evaluacion_equipos: EquipoEvaluado[];
  created_at: string;
};

type ControlPoint = {
  label: string;
  cumplimientoPct: number;
};

type ControlChartData = {
  points: ControlPoint[];
  cl: number;
  lcl: number;
  ucl: number;
};

type SemanaMesItem = {
  key: string;
  label: string;
  from: string;
  to: string;
  startDate: Date;
};

const formatDateToYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildMonthWeeks = (year: number, month: number): SemanaMesItem[] => {
  const lastDay = new Date(year, month, 0).getDate();
  const monthPadded = String(month).padStart(2, "0");
  const items: SemanaMesItem[] = [];

  let day = 1;
  let weekIndex = 1;

  while (day <= lastDay) {
    const weekStartDay = day;
    const weekEndDay = Math.min(day + 6, lastDay);

    const startDate = new Date(year, month - 1, weekStartDay);
    const endDate = new Date(year, month - 1, weekEndDay);

    items.push({
      key: `${year}-${monthPadded}-S${String(weekIndex).padStart(2, "0")}`,
      label: `Semana ${String(weekIndex).padStart(2, "0")}: ${String(weekStartDay).padStart(2, "0")}/${monthPadded} - ${String(
        weekEndDay
      ).padStart(2, "0")}/${monthPadded}`,
      from: formatDateToYmd(startDate),
      to: formatDateToYmd(endDate),
      startDate,
    });

    day += 7;
    weekIndex += 1;
  }

  return items;
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
  const [controlArea, setControlArea] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(YEAR_OPTIONS[0]);
  const [selectedWeekKey, setSelectedWeekKey] = useState("");
  const [data, setData] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const areasDisponibles = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.area))).sort((a, b) => a.localeCompare(b));
  }, [data]);

  useEffect(() => {
    if (areasDisponibles.length === 0) {
      setControlArea("");
      return;
    }

    if (!controlArea || !areasDisponibles.includes(controlArea)) {
      setControlArea(areasDisponibles[0]);
    }
  }, [areasDisponibles, controlArea]);

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
    const totalConformes = dataFiltrada.reduce(
      (acc, row) =>
        acc +
        row.evaluacion_equipos.reduce(
          (equiposAcc, equipo) =>
            equiposAcc +
            equipo.aspectos.filter((aspecto) => aspecto.estado === "conforme").length,
          0
        ),
      0
    );
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
      totalConformes,
      totalNoConformes,
      inspeccionesConIncidencias,
      porcentajeCumplimiento:
        totalConformes + totalNoConformes > 0
          ? Math.round((totalConformes / (totalConformes + totalNoConformes)) * 100)
          : 0,
    };
  }, [dataFiltrada]);

  const cumplimientoPorArea = useMemo(() => {
    const grouped = dataFiltrada.reduce<
      Record<string, { conformes: number; totalAspectos: number }>
    >((acc, row) => {
      if (!acc[row.area]) {
        acc[row.area] = { conformes: 0, totalAspectos: 0 };
      }

      row.evaluacion_equipos.forEach((equipo) => {
        acc[row.area].totalAspectos += equipo.aspectos.length;
        acc[row.area].conformes += equipo.aspectos.filter(
          (aspecto) => aspecto.estado === "conforme"
        ).length;
      });

      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([areaNombre, values]) => ({
        areaNombre,
        cumplimiento:
          values.totalAspectos > 0
            ? Math.round((values.conformes / values.totalAspectos) * 100)
            : 0,
        noConformidad:
          values.totalAspectos > 0
            ? Math.round(((values.totalAspectos - values.conformes) / values.totalAspectos) * 100)
            : 0,
      }))
      .sort((a, b) => b.cumplimiento - a.cumplimiento)
      .slice(0, 3);
  }, [dataFiltrada]);

  const patronesPorArea = useMemo(() => {
    const grouped = dataFiltrada.reduce<
      Record<
        string,
        {
          inspecciones: number;
          totalAspectos: number;
          conformes: number;
          noConformes: number;
          observaciones: number;
        }
      >
    >((acc, row) => {
      if (!acc[row.area]) {
        acc[row.area] = {
          inspecciones: 0,
          totalAspectos: 0,
          conformes: 0,
          noConformes: 0,
          observaciones: 0,
        };
      }

      acc[row.area].inspecciones += 1;

      row.evaluacion_equipos.forEach((equipo) => {
        const conformesEquipo = equipo.aspectos.filter((aspecto) => aspecto.estado === "conforme").length;
        const noConformesEquipo = equipo.aspectos.filter(
          (aspecto) => aspecto.estado === "no_conforme"
        ).length;

        acc[row.area].totalAspectos += equipo.aspectos.length;
        acc[row.area].conformes += conformesEquipo;
        acc[row.area].noConformes += noConformesEquipo;
        if (equipo.observacionEquipo?.trim()) {
          acc[row.area].observaciones += 1;
        }
      });

      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([areaNombre, values]) => {
        const cumplimiento =
          values.totalAspectos > 0 ? Math.round((values.conformes / values.totalAspectos) * 100) : 0;
        const incidencia =
          values.totalAspectos > 0 ? Math.round((values.noConformes / values.totalAspectos) * 100) : 0;

        return {
          areaNombre,
          ...values,
          cumplimiento,
          incidencia,
        };
      })
      .sort((a, b) => b.cumplimiento - a.cumplimiento);
  }, [dataFiltrada]);

  const observacionesDashboard = useMemo(() => {
    const observations: Array<{ area: string; equipo: string; texto: string; fecha: string }> = [];

    dataFiltrada.forEach((row) => {
      row.evaluacion_equipos.forEach((equipo) => {
        const texto = equipo.observacionEquipo?.trim();
        if (!texto) return;

        observations.push({
          area: row.area,
          equipo: equipo.equipoNombre,
          texto,
          fecha: row.fecha,
        });
      });
    });

    const porAreaMap = observations.reduce<Record<string, number>>((acc, observation) => {
      acc[observation.area] = (acc[observation.area] ?? 0) + 1;
      return acc;
    }, {});

    const porArea = Object.entries(porAreaMap)
      .map(([areaNombre, total]) => ({ areaNombre, total }))
      .sort((a, b) => b.total - a.total);

    const topKeywordsMap = observations.reduce<Record<string, number>>((acc, observation) => {
      const normalized = observation.texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      normalized
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 4)
        .filter((token) => !OBSERVATION_STOPWORDS.has(token))
        .forEach((token) => {
          acc[token] = (acc[token] ?? 0) + 1;
        });

      return acc;
    }, {});

    const topKeywords = Object.entries(topKeywordsMap)
      .map(([token, total]) => ({ token, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const recientes = observations
      .slice()
      .sort((a, b) => new Date(`${b.fecha}T00:00:00`).getTime() - new Date(`${a.fecha}T00:00:00`).getTime())
      .slice(0, 5);

    return {
      total: observations.length,
      porArea,
      topKeywords,
      recientes,
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

  const visibleIds = useMemo(() => dataFiltrada.map((item) => item.id), [dataFiltrada]);

  useEffect(() => {
    const visibleSet = new Set(visibleIds);
    setSelectedIds((prev) => prev.filter((id) => visibleSet.has(id)));
  }, [visibleIds]);

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

  const donutData = useMemo(() => {
    const total = incidenciasPorArea.reduce((acc, item) => acc + item.total, 0);
    if (total === 0) {
      return {
        total,
        slices: [] as Array<{
          areaNombre: string;
          total: number;
          strokeClass: string;
          dotClass: string;
          dash: number;
          offset: number;
        }>,
      };
    }

    let accumulated = 0;
    const slices = incidenciasPorArea.map((item, index) => {
      const dash = (item.total / total) * 100;
      const offset = 100 - accumulated;
      accumulated += dash;

      return {
        areaNombre: item.areaNombre,
        total: item.total,
        strokeClass: CHART_COLORS[index % CHART_COLORS.length].stroke,
        dotClass: CHART_COLORS[index % CHART_COLORS.length].dot,
        dash,
        offset,
      };
    });

    return { total, slices };
  }, [incidenciasPorArea]);

  const donutConformidad = useMemo(() => {
    const totalConformes = resumen.totalConformes;
    const totalNoConformes = resumen.totalNoConformes;
    const total = totalConformes + totalNoConformes;

    if (total === 0) {
      return {
        total,
        conformes: 0,
        noConformes: 0,
      };
    }

    return {
      total,
      conformes: Math.round((totalConformes / total) * 100),
      noConformes: Math.round((totalNoConformes / total) * 100),
    };
  }, [resumen.totalConformes, resumen.totalNoConformes]);

  const controlChartData = useMemo(() => {
    const formatNumber = (value: number) => Number(value.toFixed(2));

    const buildChartData = (granularity: "semanal" | "mensual"): ControlChartData => {
      if (!controlArea) {
        return { points: [], cl: 0, lcl: 0, ucl: 0 };
      }

      const targetYear = Number(selectedYear);
      const targetMonth = Number(selectedMonth);
      const hasSelectedMonth =
        granularity === "semanal" &&
        selectedMonth !== "" &&
        !Number.isNaN(targetYear) &&
        !Number.isNaN(targetMonth);
      const monthWeeks = hasSelectedMonth ? buildMonthWeeks(targetYear, targetMonth) : [];

      const groups = new Map<
        string,
        {
          label: string;
          startDate: Date;
          totalAspectos: number;
          totalConformes: number;
        }
      >();

      if (hasSelectedMonth) {
        monthWeeks.forEach((week) => {
          groups.set(week.key, {
            label: week.label,
            startDate: week.startDate,
            totalAspectos: 0,
            totalConformes: 0,
          });
        });
      }

      data.forEach((row) => {
        if (row.area !== controlArea) return;

        const rowDate = new Date(`${row.fecha}T00:00:00`);

        if (hasSelectedMonth) {
          if (rowDate.getFullYear() !== targetYear || rowDate.getMonth() + 1 !== targetMonth) {
            return;
          }
        }

        let key = "";
        let label = "";
        let startDate = new Date(rowDate);

        if (granularity === "mensual") {
          const month = String(rowDate.getMonth() + 1).padStart(2, "0");
          key = `${rowDate.getFullYear()}-${month}`;
          label = `${MONTH_OPTIONS[rowDate.getMonth()].label} ${rowDate.getFullYear()}`;
          startDate = new Date(rowDate.getFullYear(), rowDate.getMonth(), 1);
        } else {
          if (hasSelectedMonth) {
            const weekMatched = monthWeeks.find((week) => row.fecha >= week.from && row.fecha <= week.to);
            if (!weekMatched) return;

            key = weekMatched.key;
            label = weekMatched.label;
            startDate = weekMatched.startDate;
          } else {
            const day = rowDate.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            const monday = new Date(rowDate);
            monday.setDate(rowDate.getDate() + diffToMonday);

            const weekYear = monday.getFullYear();
            const weekMonth = String(monday.getMonth() + 1).padStart(2, "0");
            const weekDay = String(monday.getDate()).padStart(2, "0");

            key = `${weekYear}-${weekMonth}-${weekDay}`;
            label = `Sem ${weekDay}/${weekMonth}`;
            startDate = monday;
          }
        }

        const totalAspectosInspeccion = row.evaluacion_equipos.reduce(
          (equiposAcc, equipo) => equiposAcc + equipo.aspectos.length,
          0
        );
        const totalConformesInspeccion = row.evaluacion_equipos.reduce(
          (equiposAcc, equipo) =>
            equiposAcc + equipo.aspectos.filter((aspecto) => aspecto.estado === "conforme").length,
          0
        );

        const existing = groups.get(key);
        if (existing) {
          existing.totalAspectos += totalAspectosInspeccion;
          existing.totalConformes += totalConformesInspeccion;
        } else {
          groups.set(key, {
            label,
            startDate,
            totalAspectos: totalAspectosInspeccion,
            totalConformes: totalConformesInspeccion,
          });
        }
      });

      const ordered = Array.from(groups.values())
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .map((group) => {
          const cumplimientoPct =
            group.totalAspectos > 0 ? formatNumber((group.totalConformes / group.totalAspectos) * 100) : 0;

          return {
            label: group.label,
            cumplimientoPct,
          };
        });

      const points = ordered.slice(-12);
      if (points.length === 0) {
        return { points: [], cl: 0, lcl: 0, ucl: 0 };
      }

      const cl = formatNumber(
        points.reduce((acc, point) => acc + point.cumplimientoPct, 0) / points.length
      );

      const variance =
        points.reduce((acc, point) => acc + (point.cumplimientoPct - cl) ** 2, 0) /
        points.length;
      const sigma = Math.sqrt(variance);

      const lcl = formatNumber(Math.max(0, cl - 3 * sigma));
      const ucl = formatNumber(Math.min(100, cl + 3 * sigma));

      return {
        points,
        cl,
        lcl,
        ucl,
      };
    };

    return {
      semanal: buildChartData("semanal"),
      mensual: buildChartData("mensual"),
    };
  }, [data, controlArea, selectedMonth, selectedYear]);

  const semanasDelMesSeleccionado = useMemo(() => {
    if (!selectedMonth) return [] as SemanaMesItem[];

    const year = Number(selectedYear);
    const month = Number(selectedMonth);
    if (Number.isNaN(year) || Number.isNaN(month)) return [] as SemanaMesItem[];

    return buildMonthWeeks(year, month);
  }, [selectedMonth, selectedYear]);

  const aplicarRango = async (nextFrom: string, nextTo: string, failMessage: string) => {
    setFrom(nextFrom);
    setTo(nextTo);

    if (!password) return;

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (area) params.set("area", area);
      params.set("from", nextFrom);
      params.set("to", nextTo);

      const response = await fetch(`${API_ENDPOINT}?${params.toString()}`, {
        method: "GET",
        headers: {
          "x-results-password": password,
        },
      });

      if (!response.ok) {
        throw new Error(failMessage);
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

  const aplicarMes = async (monthValue: string) => {
    setSelectedMonth(monthValue);
    setSelectedWeekKey("");

    if (!monthValue) {
      setFrom("");
      setTo("");
      if (password) {
        await cargarResultados(password, true);
      }
      return;
    }

    const year = Number(selectedYear);
    const month = Number(monthValue);
    if (Number.isNaN(year) || Number.isNaN(month)) return;

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    const nextFrom = startDate.toISOString().slice(0, 10);
    const nextTo = endDate.toISOString().slice(0, 10);

    await aplicarRango(nextFrom, nextTo, "No se pudo filtrar por mes.");
  };

  const aplicarSemana = async (week: SemanaMesItem) => {
    setSelectedWeekKey(week.key);
    await aplicarRango(week.from, week.to, "No se pudo filtrar por semana.");
  };

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
    setSelectedMonth("");
    setSelectedWeekKey("");
    if (!password) return;
    await cargarResultados(password, true);
  };

  const onLimpiar = async () => {
    setArea("");
    setFrom("");
    setTo("");
    setEquipoQuery("");
    setSoloNoConformes(false);
    setSelectedMonth("");
    setSelectedWeekKey("");
    setSelectedIds([]);
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
    setSelectedIds([]);
    setError("");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const seleccionarVisibles = () => {
    setSelectedIds(visibleIds);
  };

  const limpiarSeleccion = () => {
    setSelectedIds([]);
  };

  const eliminarSeleccionadas = async () => {
    if (!password || selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar ${selectedIds.length} tarjeta(s) seleccionada(s)?`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-results-password": password,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "No se pudieron eliminar las tarjetas seleccionadas.");
      }

      const selectedSet = new Set(selectedIds);
      setData((prev) => prev.filter((item) => !selectedSet.has(item.id)));
      setSelectedIds([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado.";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const renderControlChart = (chartData: ControlChartData, periodLabel: string) => {
    if (chartData.points.length === 0) {
      return <p className="text-sm text-slate-500">Sin datos {periodLabel} para el gráfico de control.</p>;
    }

    const chartWidth = 640;
    const chartHeight = 260;
    const margin = { top: 16, right: 16, bottom: 52, left: 36 };
    const plotWidth = chartWidth - margin.left - margin.right;
    const plotHeight = chartHeight - margin.top - margin.bottom;
    const labelStep = Math.max(1, Math.ceil(chartData.points.length / 6));

    const getX = (index: number) => {
      if (chartData.points.length === 1) {
        return margin.left + plotWidth / 2;
      }

      return margin.left + (index * plotWidth) / (chartData.points.length - 1);
    };

    const getY = (value: number) => margin.top + ((100 - value) * plotHeight) / 100;

    const linePath = chartData.points
      .map((point, index) => `${getX(index)},${getY(point.cumplimientoPct)}`)
      .join(" ");

    const yCl = getY(chartData.cl);
    const yLcl = getY(chartData.lcl);
    const yUcl = getY(chartData.ucl);

    return (
      <>
        <div className="mt-3 overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-[620px]">
            {[0, 25, 50, 75, 100].map((tick) => {
              const y = getY(tick);
              return (
                <g key={`tick-${tick}`}>
                  <line
                    x1={margin.left}
                    y1={y}
                    x2={chartWidth - margin.right}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200"
                    strokeDasharray="3 4"
                  />
                  <text x={6} y={y + 4} fontSize="10" className="fill-slate-500">
                    {tick}%
                  </text>
                </g>
              );
            })}

            <line
              x1={margin.left}
              y1={yUcl}
              x2={chartWidth - margin.right}
              y2={yUcl}
              stroke="currentColor"
              className="text-rose-500"
              strokeDasharray="6 4"
              strokeWidth="1.5"
            />
            <line
              x1={margin.left}
              y1={yCl}
              x2={chartWidth - margin.right}
              y2={yCl}
              stroke="currentColor"
              className="text-blue-600"
              strokeWidth="1.5"
            />
            <line
              x1={margin.left}
              y1={yLcl}
              x2={chartWidth - margin.right}
              y2={yLcl}
              stroke="currentColor"
              className="text-amber-500"
              strokeDasharray="6 4"
              strokeWidth="1.5"
            />

            <polyline
              points={linePath}
              fill="none"
              stroke="currentColor"
              className="text-slate-700"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {chartData.points.map((point, index) => {
              const x = getX(index);
              const y = getY(point.cumplimientoPct);
              const outOfControl = point.cumplimientoPct < chartData.lcl || point.cumplimientoPct > chartData.ucl;
              const showLabel = index % labelStep === 0 || index === chartData.points.length - 1;

              return (
                <g key={`${point.label}-${index}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="currentColor"
                    className={outOfControl ? "text-rose-600" : "text-slate-700"}
                  />
                  {showLabel ? (
                    <text x={x} y={chartHeight - 16} textAnchor="middle" fontSize="10" className="fill-slate-500">
                      {point.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <p>
            Límite superior (UCL): <span className="font-semibold text-rose-600">{chartData.ucl}%</span>
          </p>
          <p>
            Valor central (CL): <span className="font-semibold text-blue-600">{chartData.cl}%</span>
          </p>
          <p>
            Límite inferior (LCL): <span className="font-semibold text-amber-600">{chartData.lcl}%</span>
          </p>
          <p className="text-slate-500">Puntos fuera de control se muestran en rojo.</p>
        </div>
      </>
    );
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">Resultados de inspecciones</h1>
            <p className="mt-1 text-sm text-slate-500">
              Pre-Operativa: La pre operativa en Pan de Tata para identificar incidencias y detectar no conformidades por área y equipo
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
              <p className="text-sm text-slate-500">Preoperativas</p>
              <p className="text-2xl font-semibold text-slate-800">{resumen.totalInspecciones}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Preoperativas con incidencias</p>
              <p className="text-2xl font-semibold text-amber-700">{resumen.inspeccionesConIncidencias}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">No conformidad</p>
              <p className="text-2xl font-semibold text-rose-700">{resumen.totalNoConformes}</p>
            </article>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Equipos evaluados</p>
              <p className="text-2xl font-semibold text-slate-800">{resumen.totalEquipos}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Balance por área (positivo y negativo)</p>
              <div className="mt-2 space-y-1.5">
                {cumplimientoPorArea.map((item) => {
                  const estadoColor =
                    item.cumplimiento < 80
                      ? "bg-rose-500"
                      : item.cumplimiento < 90
                        ? "bg-amber-500"
                        : "bg-emerald-500";
                  const estadoTexto =
                    item.cumplimiento < 80 ? "Crítico" : item.cumplimiento < 90 ? "Atención" : "Óptimo";

                  return (
                    <div key={item.areaNombre} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${estadoColor}`} />
                        <span className="text-slate-700">{item.areaNombre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{estadoTexto}</span>
                        <span className="font-semibold text-emerald-700">+{item.cumplimiento}%</span>
                        <span className="font-semibold text-rose-700">-{item.noConformidad}%</span>
                      </div>
                    </div>
                  );
                })}
                {cumplimientoPorArea.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin datos por área.</p>
                ) : null}
              </div>
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

            <div className="mt-3 rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">Filtro rápido por mes</p>
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {YEAR_OPTIONS.map((yearOption) => (
                    <option key={yearOption} value={yearOption}>
                      {yearOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => aplicarMes("")}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm ${
                    selectedMonth === ""
                      ? "border-slate-500 bg-slate-100 text-slate-800"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Todo el año
                </button>
                {MONTH_OPTIONS.map((month) => (
                  <button
                    key={month.value}
                    type="button"
                    onClick={() => aplicarMes(month.value)}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm ${
                      selectedMonth === month.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {month.label}
                  </button>
                ))}
              </div>

              {selectedMonth ? (
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p className="mb-2 text-sm font-medium text-blue-800">Semanas asociadas al mes seleccionado</p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => aplicarMes(selectedMonth)}
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        selectedWeekKey === ""
                          ? "border-blue-500 bg-blue-100 text-blue-800"
                          : "border-blue-200 bg-white text-blue-700"
                      }`}
                    >
                      Mes completo
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {semanasDelMesSeleccionado.map((week) => (
                      <button
                        key={week.key}
                        type="button"
                        onClick={() => aplicarSemana(week)}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          selectedWeekKey === week.key
                            ? "border-blue-500 bg-blue-100 text-blue-800"
                            : "border-blue-200 bg-white text-blue-700"
                        }`}
                      >
                        {week.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

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

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm md:p-6">
            <h2 className="text-base font-semibold text-slate-800">Vista rápida del equipo</h2>
            <p className="mt-1 text-sm text-slate-600">
              Panel operativo para ver en segundos qué áreas cumplen más, dónde se concentran las incidencias y qué observaciones se repiten.
            </p>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <h2 className="text-base font-semibold text-slate-800">Patrones por área</h2>
              <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                Ordenado por mayor cumplimiento. Sirve para comparar eficiencia e incidencia de cada área en una sola vista.
              </p>
              <div className="mt-3 space-y-2">
                {patronesPorArea.map((item) => (
                  <div key={item.areaNombre} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{item.areaNombre}</p>
                      <p className="text-sm font-semibold text-emerald-700">{item.cumplimiento}% cumplimiento</p>
                    </div>
                    <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-slate-600">
                      <p>Incidencia: {item.incidencia}%</p>
                      <p>Preoperativas: {item.inspecciones}</p>
                      <p>Observaciones: {item.observaciones}</p>
                    </div>
                  </div>
                ))}
                {patronesPorArea.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin datos de patrones por área.</p>
                ) : null}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <h2 className="text-base font-semibold text-slate-800">Observaciones clave</h2>
              <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                Resume las observaciones para no perder contexto operativo: volumen por área, palabras repetidas y notas recientes.
              </p>
              <p className="mt-3 text-sm text-slate-700">
                Total de observaciones registradas: <span className="font-semibold">{observacionesDashboard.total}</span>
              </p>

              <div className="mt-2 space-y-1.5">
                {observacionesDashboard.porArea.slice(0, 3).map((item) => (
                  <div key={item.areaNombre} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{item.areaNombre}</span>
                    <span className="font-semibold text-slate-800">{item.total}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {observacionesDashboard.topKeywords.map((item) => (
                  <span
                    key={item.token}
                    className="rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-700"
                  >
                    {item.token} ({item.total})
                  </span>
                ))}
                {observacionesDashboard.topKeywords.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay palabras clave de observaciones.</p>
                ) : null}
              </div>

              <div className="mt-3 space-y-1.5">
                {observacionesDashboard.recientes.map((item, index) => (
                  <p key={`${item.area}-${item.equipo}-${index}`} className="line-clamp-1 text-xs text-slate-600">
                    {item.fecha} · {item.area} · {item.equipo}: {item.texto}
                  </p>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <h2 className="text-base font-semibold text-slate-800">No conformidades por área</h2>
              <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                Muestra las áreas con mayor volumen de no conformidades para priorizar acciones correctivas.
              </p>
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
              <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                Identifica los equipos más críticos para seguimiento inmediato del equipo operativo.
              </p>
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

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm md:p-6">
            <h2 className="text-base font-semibold text-slate-800">Análisis estadístico</h2>
            <p className="mt-1 text-sm text-slate-600">
              En esta sección los gráficos muestran comportamiento del proceso con límites de control y distribución porcentual para detectar variaciones fuera de control.
            </p>
          </section>

          <section className="grid gap-3 lg:grid-cols-1">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <h2 className="text-base font-semibold text-slate-800">Torta % Conformes vs No conformes</h2>
              <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                Mide la proporción global de cumplimiento vs incumplimiento para evaluar salud general del proceso.
              </p>
              <div className="mt-3 flex flex-col items-center gap-4 md:flex-row md:items-start">
                <svg viewBox="0 0 36 36" className="h-44 w-44 -rotate-90">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" className="text-slate-200" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="currentColor"
                    className="text-emerald-500"
                    strokeWidth="4"
                    pathLength={100}
                    strokeDasharray={`${donutConformidad.conformes} ${100 - donutConformidad.conformes}`}
                    strokeDashoffset={100}
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="currentColor"
                    className="text-rose-500"
                    strokeWidth="4"
                    pathLength={100}
                    strokeDasharray={`${donutConformidad.noConformes} ${100 - donutConformidad.noConformes}`}
                    strokeDashoffset={100 - donutConformidad.conformes}
                  />
                </svg>

                <div className="w-full space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2 text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span>Conformes</span>
                    </div>
                    <span className="text-slate-600">{donutConformidad.conformes}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-500" />
                      <span>No conformes</span>
                    </div>
                    <span className="text-slate-600">{donutConformidad.noConformes}%</span>
                  </div>
                  <p className="text-slate-500">Total aspectos evaluados: {donutConformidad.total}</p>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-3 lg:grid-cols-1">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <h2 className="text-base font-semibold text-slate-800">Gráfico de torta por área</h2>
              <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                Distribuye el peso de no conformidades entre áreas para ver concentración del problema.
              </p>
              <div className="mt-3 flex flex-col items-center gap-4 md:flex-row md:items-start">
                <svg viewBox="0 0 36 36" className="h-44 w-44 -rotate-90">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" className="text-slate-200" strokeWidth="4" />
                  {donutData.slices.map((slice) => (
                    <circle
                      key={slice.areaNombre}
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="currentColor"
                      className={slice.strokeClass}
                      strokeWidth="4"
                      pathLength={100}
                      strokeDasharray={`${slice.dash} ${100 - slice.dash}`}
                      strokeDashoffset={slice.offset}
                    />
                  ))}
                </svg>

                <div className="w-full space-y-2">
                  {donutData.slices.map((slice) => {
                    const percentage = donutData.total > 0 ? Math.round((slice.total / donutData.total) * 100) : 0;
                    return (
                      <div key={`legend-${slice.areaNombre}`} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                          <span className={`h-3 w-3 rounded-full ${slice.dotClass}`} />
                          <span>{slice.areaNombre}</span>
                        </div>
                        <span className="text-slate-600">{percentage}%</span>
                      </div>
                    );
                  })}

                  {donutData.slices.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin datos para gráfico de torta.</p>
                  ) : null}
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-800">Control semanal de % cumplimiento</h2>
                <select
                  value={controlArea}
                  onChange={(event) => setControlArea(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {areasDisponibles.map((areaItem) => (
                    <option key={areaItem} value={areaItem}>
                      {areaItem}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Área: {controlArea || "Sin área seleccionada"} · Últimos 12 periodos semanales
              </p>
              <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                Gráfico de control semanal con límites superior e inferior para detectar variaciones fuera de control.
              </p>
              {renderControlChart(controlChartData.semanal, "semanales")}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <h2 className="text-base font-semibold text-slate-800">Control mensual de % cumplimiento</h2>
              <p className="mt-1 text-sm text-slate-500">
                Área: {controlArea || "Sin área seleccionada"} · Últimos 12 periodos mensuales
              </p>
              <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                Gráfico de control mensual para evaluar estabilidad del cumplimiento en el mediano plazo.
              </p>
              {renderControlChart(controlChartData.mensual, "mensuales")}
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-700">
                Tarjetas seleccionadas: <span className="font-semibold">{selectedIds.length}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={seleccionarVisibles}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Seleccionar visibles
                </button>
                <button
                  type="button"
                  onClick={limpiarSeleccion}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Limpiar selección
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length === 0 || deleting}
                  onClick={eliminarSeleccionadas}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Eliminando..." : "Eliminar seleccionadas"}
                </button>
              </div>
            </div>
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
                      className={`rounded-xl border bg-slate-50 p-4 ${
                        selectedIds.includes(inspeccion.id)
                          ? "border-blue-300 ring-2 ring-blue-100"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">Fecha: {inspeccion.fecha}</p>
                          {inspeccion.responsable ? (
                            <p className="text-xs text-slate-600">Responsable: {inspeccion.responsable}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(inspeccion.id)}
                              onChange={() => toggleSelect(inspeccion.id)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            Seleccionar
                          </label>
                          <p className="text-xs text-slate-500">
                            {new Date(inspeccion.created_at).toLocaleString("es-VE")}
                          </p>
                        </div>
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

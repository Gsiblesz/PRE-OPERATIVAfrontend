"use client";

import { useMemo, useState } from "react";
import { AREAS_CONFIG, EstadoAspecto } from "../data/areas-config";

type AspectoEvaluado = {
  aspecto: string;
  estado: Exclude<EstadoAspecto, null>;
};

type EvaluacionEquipo = {
  equipoId: string;
  equipoNombre: string;
  aspectos: AspectoEvaluado[];
  observacionEquipo: string;
};

type EstadoAspectoUI = {
  estado: EstadoAspecto;
};

export default function FormInspeccionPreoperativa() {
  const [area, setArea] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [aspectosUI, setAspectosUI] = useState<Record<string, EstadoAspectoUI>>({});
  const [observacionEquipo, setObservacionEquipo] = useState("");
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionEquipo[]>([]);

  const equiposArea = useMemo(() => (area ? AREAS_CONFIG[area] ?? [] : []), [area]);

  const equipoSeleccionado = useMemo(
    () => equiposArea.find((equipo) => equipo.id === equipoId),
    [equiposArea, equipoId]
  );

  const evaluadosSet = useMemo(
    () => new Set(evaluaciones.map((evaluacion) => evaluacion.equipoId)),
    [evaluaciones]
  );

  const onAreaChange = (nextArea: string) => {
    setArea(nextArea);
    setEquipoId("");
    setAspectosUI({});
    setObservacionEquipo("");
    setEvaluaciones([]);
  };

  const onEquipoChange = (nextEquipoId: string) => {
    setEquipoId(nextEquipoId);

    const equipo = equiposArea.find((item) => item.id === nextEquipoId);
    if (!equipo) {
      setAspectosUI({});
      return;
    }

    const initialState = Object.fromEntries(
      equipo.aspectos.map((aspecto) => [aspecto, { estado: null as EstadoAspecto }])
    );

    setAspectosUI(initialState);
    setObservacionEquipo("");
  };

  const setEstado = (aspecto: string, estado: Exclude<EstadoAspecto, null>) => {
    setAspectosUI((prev) => ({
      ...prev,
      [aspecto]: {
        ...prev[aspecto],
        estado,
      },
    }));
  };

  const guardarEquipo = () => {
    if (!equipoSeleccionado) return;

    const aspectoSinSeleccion = equipoSeleccionado.aspectos.find(
      (aspecto) => !aspectosUI[aspecto]?.estado
    );

    if (aspectoSinSeleccion) {
      alert(`Debes marcar Conforme o No conforme en: ${aspectoSinSeleccion}`);
      return;
    }

    const aspectos = equipoSeleccionado.aspectos.map((aspecto) => {
      const value = aspectosUI[aspecto];

      return {
        aspecto,
        estado: value!.estado as Exclude<EstadoAspecto, null>,
      };
    });

    const nuevaEvaluacion: EvaluacionEquipo = {
      equipoId: equipoSeleccionado.id,
      equipoNombre: equipoSeleccionado.nombre,
      aspectos,
      observacionEquipo: observacionEquipo.trim(),
    };

    setEvaluaciones((prev) => [...prev, nuevaEvaluacion]);
    setEquipoId("");
    setAspectosUI({});
    setObservacionEquipo("");
  };

  const finalizarArea = async () => {
    if (!area || evaluaciones.length === 0) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    const endpoint = apiBaseUrl
      ? `${apiBaseUrl.replace(/\/$/, "")}/api/inspecciones-preoperativas`
      : "/api/inspecciones-preoperativas";

    const payload = {
      fecha: new Date().toISOString().slice(0, 10),
      area,
      evaluacion_equipos: evaluaciones,
    };

    console.log("Payload final para API:", payload);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "No se pudo guardar la inspección.");
      }

      alert("Inspección guardada correctamente");
      setEquipoId("");
      setAspectosUI({});
      setObservacionEquipo("");
      setEvaluaciones([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado";
      alert(message);
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">
          Inspección preoperativa
        </h1>
        <p className="mt-1 text-sm text-slate-500">Registro diario por área y equipos</p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-medium text-slate-800">Paso 1: Selecciona el área</h2>
        <select
          className="w-full rounded-xl border border-slate-300 p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
          value={area}
          onChange={(event) => onAreaChange(event.target.value)}
        >
          <option value="">Selecciona un área</option>
          {Object.keys(AREAS_CONFIG).map((areaOption) => (
            <option key={areaOption} value={areaOption}>
              {areaOption}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-medium text-slate-800">Paso 2: Selecciona el equipo</h2>
        <select
          className="w-full rounded-xl border border-slate-300 p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100"
          value={equipoId}
          onChange={(event) => onEquipoChange(event.target.value)}
          disabled={!area}
        >
          <option value="">Selecciona un equipo</option>
          {equiposArea.map((equipo) => {
            const yaEvaluado = evaluadosSet.has(equipo.id);
            return (
              <option key={equipo.id} value={equipo.id} disabled={yaEvaluado}>
                {equipo.nombre} {yaEvaluado ? "✓" : ""}
              </option>
            );
          })}
        </select>
      </section>

      {equipoSeleccionado ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <h2 className="text-lg font-medium text-slate-800">
            Paso 3: Evalúa aspectos de {equipoSeleccionado.nombre}
          </h2>

          <div className="space-y-3">
            {equipoSeleccionado.aspectos.map((aspecto) => (
              <article
                key={aspecto}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4"
              >
                <p className="font-medium text-slate-800">{aspecto}</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEstado(aspecto, "conforme")}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      aspectosUI[aspecto]?.estado === "conforme"
                        ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    Conforme
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstado(aspecto, "no_conforme")}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      aspectosUI[aspecto]?.estado === "no_conforme"
                        ? "border-rose-400 bg-rose-100 text-rose-800"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    No conforme
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4">
            <label className="mb-2 block font-medium text-slate-800">Observación del equipo</label>
            <input
              type="text"
              placeholder="Observación general (opcional)"
              value={observacionEquipo}
              onChange={(event) => setObservacionEquipo(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={guardarEquipo}
              className="rounded-xl bg-slate-800 px-4 py-2.5 font-medium text-white hover:bg-slate-700"
            >
              Guardar equipo y evaluar otro
            </button>

            <button
              type="button"
              onClick={finalizarArea}
              className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-500"
            >
              Finalizar Área
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <h3 className="text-base font-semibold text-slate-800">
          Equipos guardados en esta área: {evaluaciones.length}
        </h3>
      </section>
    </main>
  );
}

export type EstadoAspecto = "conforme" | "no_conforme" | null;

export type EquipoConfig = {
  id: string;
  nombre: string;
  aspectos: string[];
};

export const AREAS_CONFIG: Record<string, EquipoConfig[]> = {
  "Área de donas": [
    {
      id: "freidora",
      nombre: "Freidora",
      aspectos: ["Superficie externa", "Pisos", "Campana"],
    },
    {
      id: "batidora-2",
      nombre: "Batidora #2",
      aspectos: [
        "Tolva",
        "Gancho",
        "Superficie interna",
        "Superficie externa",
        "Presencia de materiales extraños",
      ],
    },
    {
      id: "nevera-vertical-refrimet",
      nombre: "Nevera vertical blanca Refrimet",
      aspectos: ["Manillas y puertas", "Gomas", "Estantes internos", "Piso internos"],
    },
    {
      id: "mesones-donas",
      nombre: "Mesones donas",
      aspectos: [
        "Superficie superior",
        "Estructura inferior (patas y estantes)",
        "Buenas prácticas de almacenamiento",
      ],
    },
    {
      id: "cava-2",
      nombre: "Cava #2",
      aspectos: ["Manilla y puerta", "Gomas", "Paredes internas", "Piso internos"],
    },
    {
      id: "residuos-donas",
      nombre: "Disposición de residuos y control de utensilios",
      aspectos: ["Basureros", "Pañitos de limpieza"],
    },
  ],
  Panadería: [
    {
      id: "mezcladora-1",
      nombre: "Mezcladora #1",
      aspectos: [
        "Rejilla de seguridad",
        "Tolva",
        "Gancho",
        "Superficie interna",
        "Superficie externa",
        "Presencia de materiales extraños",
      ],
    },
    {
      id: "mezcladora-7",
      nombre: "Mezcladora #7 Ponques",
      aspectos: [
        "Rejilla de seguridad",
        "Tolva",
        "Gancho",
        "Superficie interna",
        "Superficie externa",
        "Presencia de materiales extraños",
      ],
    },
    {
      id: "mezcladora-4",
      nombre: "Mezcladora #4",
      aspectos: [
        "Rejilla de seguridad",
        "Tolva",
        "Gancho",
        "Superficie interna",
        "Superficie externa",
        "Presencia de materiales extraños",
      ],
    },
    {
      id: "porcionadora-redonda",
      nombre: "Porcionadora redonda",
      aspectos: [
        "Platos divisores",
        "Superficie externa",
        "Base del equipo",
        "Presencia de materiales extraños",
      ],
    },
    {
      id: "fermentadora-refrimet",
      nombre: "Fermentadora Refrimet",
      aspectos: [
        "Manillas y puertas",
        "Gomas",
        "Estantes internos",
        "Paredes internas",
        "Piso internos",
      ],
    },
    {
      id: "nevera-6-puertas",
      nombre: "Nevera de 6 puertas",
      aspectos: ["Manillas y puertas", "Gomas", "Estantes internos", "Piso internos"],
    },
    {
      id: "mesones-panaderia",
      nombre: "Mesones panadería",
      aspectos: [
        "Superficie superior",
        "Estructura inferior (patas y estantes)",
        "Buenas prácticas de almacenamiento",
      ],
    },
    {
      id: "formadora-masa-1",
      nombre: "Formadora de masa #1",
      aspectos: [
        "Lona transportadora",
        "Superficie interna",
        "Superficie externa",
        "Presencia de materiales extraños",
        "Pisos",
      ],
    },
    {
      id: "formadora-masa-2",
      nombre: "Formadora de masa #2",
      aspectos: [
        "Lona transportadora",
        "Superficie interna",
        "Superficie externa",
        "Presencia de materiales extraños",
        "Pisos",
      ],
    },
    {
      id: "timer",
      nombre: "Timer",
      aspectos: ["Superficie externa"],
    },
    {
      id: "horno-4",
      nombre: "Horno #4",
      aspectos: [
        "Superficie interna",
        "Superficie externa",
        "Base del equipo",
        "Pisos",
        "Presencia de materiales extraños",
      ],
    },
    {
      id: "horno-imperial",
      nombre: "Horno imperial",
      aspectos: [
        "Superficie interna",
        "Superficie externa",
        "Base del equipo",
        "Pisos",
        "Presencia de materiales extraños",
      ],
    },
    {
      id: "residuos-panaderia",
      nombre: "Disposición de residuos y control de utensilios",
      aspectos: ["Basureros", "Pañitos de limpieza"],
    },
  ],
  Hojaldre: [
    {
      id: "mezcladora-9",
      nombre: "Mezcladora #9",
      aspectos: [
        "Rejilla de seguridad",
        "Tolva",
        "Gancho",
        "Superficie interna",
        "Superficie externa",
        "Presencia de materiales extraños",
      ],
    },
    {
      id: "laminadora-1",
      nombre: "Laminadora #1",
      aspectos: [
        "Lona transportadora",
        "Superficie interna",
        "Superficie externa",
        "Mesón de la laminadora",
        "Presencia de materiales extraños",
        "Pisos",
      ],
    },
    {
      id: "rebanadora-3",
      nombre: "Rebanadora #3",
      aspectos: [
        "Cuchilla y protector",
        "Bandeja de salida",
        "Perillas y controles",
        "Superficie externa",
        "Presencia de materiales extraños",
      ],
    },
    {
      id: "colector-harina",
      nombre: "Colector de harina",
      aspectos: ["Superficie interna", "Superficie externa", "Presencia de materiales extraños"],
    },
    {
      id: "mesones-hojaldre",
      nombre: "Mesones de hojaldre",
      aspectos: [
        "Superficie superior",
        "Estructura inferior (patas y estantes)",
        "Buenas prácticas de almacenamiento",
      ],
    },
    {
      id: "nevera-14-true",
      nombre: "Nevera #14 True (sótano)",
      aspectos: [
        "Manillas y puertas",
        "Gomas",
        "Estantes internos",
        "Paredes internas",
        "Piso internos",
      ],
    },
    {
      id: "abatidor",
      nombre: "Abatidor",
      aspectos: [
        "Manillas y puertas",
        "Gomas",
        "Rieles internos",
        "Paredes internas",
        "Piso internos",
      ],
    },
    {
      id: "congelador-pequeno-hojaldre",
      nombre: "Congelador horizontal pequeño (100 L)",
      aspectos: ["Puerta", "Gomas", "Paredes internas", "Piso internos"],
    },
    {
      id: "congelador-grande-hojaldre",
      nombre: "Congelador horizontal grande (300 L)",
      aspectos: ["Puerta", "Gomas", "Paredes internas", "Piso internos"],
    },
    {
      id: "residuos-hojaldre",
      nombre: "Disposición de residuos y control de utensilios",
      aspectos: ["Basureros", "Pañitos de limpieza"],
    },
  ],
};

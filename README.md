# Frontend - PRE OPERATIVA

Frontend del formulario de inspecciones preoperativas con Next.js y Tailwind.

## Estructura del proyecto

```text
frontend/
├── app/
│   ├── components/FormInspeccionPreoperativa.tsx
│   ├── data/areas-config.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── .env.example
├── .gitignore
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Ejecutar en local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea `.env.local` desde `.env.example` y agrega:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

3. Corre la app:

   ```bash
   npm run dev
   ```

4. Abre `http://localhost:3000`.

## Subir este frontend a GitHub

```bash
git init
git add .
git commit -m "feat: frontend inspecciones preoperativas"
git branch -M main
git remote add origin <URL_DEL_REPO>
git push -u origin main
```

## Deploy en Vercel

- Variable requerida: `NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com`
- El formulario hará POST a `https://tu-backend.onrender.com/api/inspecciones-preoperativas`.

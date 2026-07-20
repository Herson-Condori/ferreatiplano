# 🏗️ Ferrealtiplano - Sistema de Ventas e Inventario

Sistema full-stack moderno para la gestión de ventas, inventario y facturación electrónica para ferreterías.

---

## 📋 Tabla de Contenidos
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Ejecutar la Aplicación](#-ejecutar-la-aplicación)
- [Scripts Disponibles](#-scripts-disponibles)
- [Variables de Entorno](#-variables-de-entorno)

---

## 🚀 Tecnologías

### Backend
- **Node.js** + **Express** - API REST
- **Prisma ORM** - PostgreSQL
- **JWT** + **bcryptjs** - Autenticación
- **Cloudinary** - Almacenamiento de imágenes
- **Culqi** - Pagos con tarjeta
- **Nubefact** - Facturación electrónica

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** - Estilos
- **Zustand** - State management
- **React Router** - Enrutamiento
- **Lucide React** - Íconos
- **Recharts** - Gráficos

---

## 📁 Estructura del Proyecto

```
FERREALTIPLANO/
├── backend/          # API REST (Node.js + Express)
│   ├── prisma/       # Schema y migraciones de BD
│   ├── src/
│   │   ├── config/   # Configuraciones (Cloudinary, Culqi, etc.)
│   │   ├── controllers/ # Lógica de negocio
│   │   ├── middleware/  # Middlewares (auth, upload)
│   │   ├── routes/      # Endpoints API
│   │   ├── services/    # Servicios (facturación, maps)
│   │   └── index.js     # Servidor principal
│   └── package.json
│
└── frontend/         # SPA (React + Vite)
    ├── src/
    │   ├── components/ # Componentes reutilizables
    │   ├── pages/      # Páginas de la app
    │   ├── store/      # Stores Zustand
    │   ├── lib/        # API client
    │   └── main.jsx    # Punto de entrada
    └── package.json
```

---

## 🔧 Instalación y Configuración

### 1. Prerrequisitos
Asegúrate de tener instalado:
- **Node.js** (v18 o superior)
- **PostgreSQL** (v13 o superior)
- **npm** o **yarn**

### 2. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd FERREALTIPLANO
```

### 3. Configurar Backend

#### a. Instalar dependencias
```bash
cd backend
npm install
```

#### b. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo y editarlo
cp .env.example .env
# Editar .env con tus credenciales
```

#### c. Configurar Base de Datos
```bash
# 1. Crear la BD en PostgreSQL
# 2. Ejecutar migraciones de Prisma
npx prisma migrate dev

# 3. (Opcional) Ejecutar seed para datos de prueba
npm run prisma:seed
```

### 4. Configurar Frontend

#### a. Instalar dependencias
```bash
cd frontend
npm install
```

#### b. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env si es necesario
```

---

## ▶️ Ejecutar la Aplicación

### Modo Desarrollo

#### Backend (Terminal 1)
```bash
cd backend
npm run dev
# Servidor corriendo en http://localhost:4000
```

#### Frontend (Terminal 2)
```bash
cd frontend
npm run dev
# App corriendo en http://localhost:5173
```

---

## 📜 Scripts Disponibles

### Backend (`/backend`)
| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor en modo desarrollo (nodemon) |
| `npm start` | Inicia servidor en modo producción |
| `npm run prisma:seed` | Ejecuta seed de datos de prueba |

### Frontend (`/frontend`)
| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia dev server de Vite |
| `npm run build` | Compila para producción |
| `npm run preview` | Previsualiza la build de producción |

---

## 🔐 Variables de Entorno

### Backend (`/backend/.env`)
Consulta el archivo [`.env.example`](backend/.env.example) para ver todas las variables requeridas.

### Frontend (`/frontend/.env`)
Consulta el archivo [`.env.example`](frontend/.env.example) para ver todas las variables requeridas.

---

## 👥 Roles de Usuario
1. **CLIENTE** - Usuarios que compran productos
2. **VENDEDOR** - Gestiona pedidos y ventas
3. **ADMIN** - Control total del sistema

---

## 📝 Notas Importantes
- El backend usa **CORS** configurado para localhost:5173 por defecto
- Las imágenes se almacenan en **Cloudinary**
- La facturación electrónica usa **Nubefact** (Perú)
- Los pagos con tarjeta usan **Culqi** (Perú)

---

## 🛟 Soporte
Si tienes preguntas o problemas, contacta al equipo de desarrollo.

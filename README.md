# API Médico - Backend

## Descripción

API REST desarrollada con Express.js y TypeScript para un sistema médico. Proporciona endpoints para la gestión de pacientes, doctores, citas médicas y más.

## Características

- ✅ Express.js con TypeScript
- ✅ Middleware de seguridad (Helmet, CORS)
- ✅ Logging con Morgan
- ✅ Validación de datos
- ✅ Estructura modular y escalable
- ✅ Manejo de errores centralizado

## Instalación

### Prerrequisitos

- Node.js (v16 o superior)
- npm o yarn

### Pasos de instalación

1. Clona el repositorio

```bash
git clone <url-del-repositorio>
cd API-Medico
```

2. Instala las dependencias

```bash
npm install
```

3. Configura las variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones.

4. Compila el proyecto

```bash
npm run build
```

5. Inicia el servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## Scripts disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo con recarga automática
- `npm run build` - Compila el proyecto TypeScript
- `npm run start` - Inicia el servidor en modo producción
- `npm run watch` - Compila en modo observación
- `npm run clean` - Limpia la carpeta dist

## Estructura del proyecto

```
src/
├── app.ts              # Configuración principal de Express
├── server.ts           # Punto de entrada de la aplicación
├── controllers/        # Controladores de rutas
├── routes/            # Definición de rutas
├── models/            # Modelos de datos
├── middlewares/       # Middleware personalizado
├── services/          # Lógica de negocio
└── types/             # Definiciones de tipos TypeScript
```

## API Endpoints

### Health Check

- `GET /` - Estado general de la API
- `GET /api/health` - Estado detallado del sistema

## Variables de Entorno

Consulta el archivo `.env.example` para ver todas las variables de entorno disponibles.

## Desarrollo

### Comandos útiles

```bash
# Instalar nueva dependencia
npm install nombre-paquete

# Instalar dependencia de desarrollo
npm install --save-dev nombre-paquete

# Verificar tipos TypeScript
npx tsc --noEmit
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la licencia ISC.

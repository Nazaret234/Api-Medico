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


## Configuración de la base de datos (Prisma)

se utilizo Prisma como ORM y PostgreSQL para la base de datos.

1) Variables de entorno 

- `DATABASE_URL`: la URL de conexión a PostgreSQL. Ejemplo de formato:

	```text
	postgresql://<user>:<password>@<host>:<port>/<database>
	```

- Además de `DATABASE_URL`, mi `.env` contiene otras claves que el proyecto usa, por ejemplo `SECRET_JWT_KEY` y `SECRET_KEY`.

2) Generar el cliente de Prisma

Después de añadir `DATABASE_URL` en `.env` :

```bash
npx prisma generate
```

3) Aplicar el esquema / migraciones

se creo una base de datos con

```bash
npx prisma db push
```

4) Ver la base de datos en el navegador

Uso Prisma Studio para inspeccionar tablas y datos:

```bash
npx prisma studio
```

5) Script de verificación que incluí

Se incluyo `scripts/migrate.ts` para comprobar la conexión y poder ejecutar seeds si hace falta. Para ejecutarlo:

```bash
ts-node scripts/migrate.ts
```

6) Notas sobre Supabase / producción

- Si se usa Supabase pega la `DATABASE_URL` que te da Supabase en el `.env`.
- Si la contraseña tiene caracteres especiales, recuerda que deben ser URL-encoded (por ejemplo `@` → `%40`).

7) Verificación rápida

- Para probar el proyecto hay que ejecutat

```bash
npm run dev
```

Si Prisma no puede conectar verás errores relacionados con `DATABASE_URL` en la consola.

8) Problemas comunes

- Error de autenticación: revisa user/password en `DATABASE_URL`.
- Timeouts o conexión denegada: comprueba que el host/puerto estén accesibles (especialmente si la DB está en la nube).


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

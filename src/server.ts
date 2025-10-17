import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes";
import db from "./services/database";

// Variables de entorno necesarias:
// SUPABASE_URL=https://scmmjygzyvzkgqqevuxs.supabase.co
// SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbW1qeWd6eXZ6a2dxcWV2dXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDUyNDAsImV4cCI6MjA3NTE4MTI0MH0.t1TnUCXeocBFl36PpqxHup3w8Twfnu58TRyiCothNfs
// DATABASE_URL="postgresql://postgres:[password]@db.scmmjygzyvzkgqqevuxs.supabase.co:5432/postgres"
// SECRET_JWT_KEY=tu_clave_secreta_jwt_muy_segura_aqui
// GOOGLE_CLIENT_ID=tu_google_client_id_aqui
// PORT=3000
// NODE_ENV=development

const app = express();
const port = Number(process.env.PORT) || 3000; // 👈 Convertir a número

// 1. CORS actualizado para permitir conexiones desde tu red local
app.use(
  cors({
    origin: "*", // En desarrollo, acepta cualquier origen
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// // 2. RUTAS PÚBLICAS (sin cifrado)
// app.get("/api/health", (req, res) => {
//   res.json({
//     status: "OK",
//     service: "Backend API",
//     timestamp: new Date().toISOString(),
//   });
// });

// app.get("/api/mensaje", (req, res) => {
//   res.json({
//     mensaje: "¡Hola desde el backend!",
//     funcionando: true,
//   });
// });

// // 3. RUTAS CON CIFRADO
// app.post(
//   "/api/test-encryption",
//   decryptRequestMiddleware,
//   encryptResponseMiddleware,
//   (req, res) => {
//     res.json({
//       originalMessage: "Backend recibió tus datos cifrados",
//       dataRecibida: req.body,
//       prueba: "✅ Cifrado/descifrado funcionando",
//       timestamp: new Date().toISOString(),
//     });
//   }
// );

// // Ruta GET para probar cifrado desde navegador
// app.get("/api/test-encryption", encryptResponseMiddleware, (req, res) => {
//   res.json({
//     mensaje: "✅ Cifrado funcionando (GET)",
//     timestamp: new Date().toISOString(),
//     nota: "Esta respuesta está cifrada",
//   });
// });

// 4. Manejo de rutas no encontradas
// app.use("/api", (req, res) => {
//   res.status(404).json({
//     error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
//   });
// });

router(app);

// Inicializar servidor con conexión a base de datos
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await db.connect();
    
    // Verificar conexión
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      throw new Error('❌ La conexión a la base de datos no está funcionando');
    }

    // Iniciar servidor
    app.listen(port, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
      console.log(`📊 Base de datos conectada a Supabase`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await db.disconnect();
  process.exit(0);
});

startServer();

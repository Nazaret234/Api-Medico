import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { decryptRequestMiddleware, encryptResponseMiddleware } from "./middlewares/Encryp";

const app = express();
const port = Number(process.env.PORT) || 3000; // 👈 Convertir a número

// 1. CORS actualizado para permitir conexiones desde tu red local
app.use(cors({
  origin: '*', // En desarrollo, acepta cualquier origen
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. RUTAS PÚBLICAS (sin cifrado)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Backend API', 
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/mensaje', (req, res) => {
  res.json({ 
    mensaje: '¡Hola desde el backend!', 
    funcionando: true 
  });
});

// 3. RUTAS CON CIFRADO
app.post('/api/test-encryption', 
  decryptRequestMiddleware, 
  encryptResponseMiddleware, 
  (req, res) => {
    res.json({
      originalMessage: 'Backend recibió tus datos cifrados',
      dataRecibida: req.body,
      prueba: '✅ Cifrado/descifrado funcionando',
      timestamp: new Date().toISOString()
    });
  }
);

// Ruta GET para probar cifrado desde navegador
app.get('/api/test-encryption', 
  encryptResponseMiddleware, 
  (req, res) => {
    res.json({
      mensaje: '✅ Cifrado funcionando (GET)',
      timestamp: new Date().toISOString(),
      nota: 'Esta respuesta está cifrada'
    });
  }
);

// 4. Manejo de rutas no encontradas
app.use('/api', (req, res) => {
  res.status(404).json({ 
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` 
  });
});
